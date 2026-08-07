"use client";

import { useState, useCallback, useEffect } from "react";
import { parseUnits, randomBytes, hexlify, formatUnits } from "ethers";
import { useWalletInfo } from "./useWalletInfo";
import { useV3TokenContract } from "./useV3Contract";
import { isValidAddress, isValidAmount } from "@/lib/v3/errors";
import { readTokenTax } from "@/lib/v3/tax";
import type {
	TransferAuthPayload,
	UseTransferWithAuthReturn,
} from "./useTransferWithAuth";
import { useTranslations } from "next-intl";

export interface UseV3TransferWithAuthReturn extends UseTransferWithAuthReturn {
	/** 固定税额（token 单位） */
	taxAmount: string;
}

/**
 * V3 TransferWithAuthorization 签名 Hook (EIP-3009)
 * 用于免 Gas 转账：用户仅签名，由服务端代付 Gas 执行
 */
export function useV3TransferWithAuth(): UseV3TransferWithAuthReturn {
	const t = useTranslations("errors");
	const [isSigning, setIsSigning] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [payload, setPayload] = useState<TransferAuthPayload | null>(null);
	const [taxAmount, setTaxAmount] = useState("0");

	const { address, getSigner } = useWalletInfo();
	const { address: tokenAddress, contract: tokenContract } =
		useV3TokenContract();

	useEffect(() => {
		if (!tokenContract) return;
		let cancelled = false;
		(async () => {
			try {
				const [dec, tax] = await Promise.all([
					tokenContract.decimals(),
					readTokenTax(tokenContract),
				]);
				if (!cancelled) {
					setTaxAmount(formatUnits(tax, Number(dec)));
				}
			} catch {
				// keep default
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [tokenContract]);

	const signTransferAuth = useCallback(
		async (
			to: string,
			amount: string,
			userBalance?: string,
		): Promise<TransferAuthPayload | null> => {
			if (!isValidAddress(to)) {
				setError(t("invalidAddress"));
				return null;
			}

			if (!isValidAmount(amount)) {
				setError(t("invalidAmount"));
				return null;
			}

			if (Number(amount) <= Number(taxAmount)) {
				setError(t("amountMustExceedTax", { tax: taxAmount }));
				return null;
			}

			if (userBalance !== undefined && Number(amount) > Number(userBalance)) {
				setError(t("exceedsBalance"));
				return null;
			}

			if (!address || !tokenAddress || !tokenContract) {
				setError(t("connectWalletFirst"));
				return null;
			}

			setIsSigning(true);
			setError(null);

			try {
				const signer = await getSigner();
				if (!signer) {
					setError(t("noSigner"));
					return null;
				}

				const decimals = await tokenContract.decimals();
				const value = parseUnits(amount, Number(decimals));

				const nonce = hexlify(randomBytes(32));

				// 合约 MAX_AUTH_WINDOW = 15 分钟(900s)，且校验的是 validBefore - validAfter（而非
				// validBefore - block.timestamp）。validBefore 必须锚定在 validAfter 之上，
				// 否则向前补的时钟误差缓冲会被算进窗口总长，导致总长超过 900s 而被合约拒绝。
				const now = Math.floor(Date.now() / 1000);
				const CLOCK_SKEW_BUFFER_SECONDS = 12;
				const MAX_AUTH_WINDOW_SECONDS = 900; // 对应合约 Authorization.MAX_AUTH_WINDOW
				const validAfter = now - CLOCK_SKEW_BUFFER_SECONDS;
				const validBefore = validAfter + MAX_AUTH_WINDOW_SECONDS;

				const domainData = await tokenContract.eip712Domain();

				const domain = {
					name: domainData[1] as string,
					version: domainData[2] as string,
					chainId: Number(domainData[3]),
					verifyingContract: domainData[4] as string,
				};

				const types = {
					TransferWithAuthorization: [
						{ name: "from", type: "address" },
						{ name: "to", type: "address" },
						{ name: "value", type: "uint256" },
						{ name: "validAfter", type: "uint256" },
						{ name: "validBefore", type: "uint256" },
						{ name: "nonce", type: "bytes32" },
					],
				};

				const message = {
					from: address,
					to,
					value: value.toString(),
					validAfter,
					validBefore,
					nonce,
				};

				const signature = await signer.signTypedData(domain, types, message);
				const result: TransferAuthPayload = {
					domain: {
						chainId: domain.chainId,
						name: domain.name,
						verifyingContract: domain.verifyingContract,
						version: domain.version,
					},
					message: {
						from: address,
						to,
						value: value.toString(),
						validAfter,
						validBefore,
						nonce,
						signature,
					},
				};

				setPayload(result);
				return result;
			} catch (err) {
				console.error("V3 signing failed:", err);
				if (err instanceof Error) {
					if (
						err.message.includes("user rejected") ||
						err.message.includes("User rejected")
					) {
						setError(t("userRejectedSign"));
					} else {
						setError(err.message);
					}
				} else {
					setError(t("signFailed"));
				}
				return null;
			} finally {
				setIsSigning(false);
			}
		},
		[address, tokenAddress, tokenContract, taxAmount, getSigner, t],
	);

	const clearError = useCallback(() => setError(null), []);
	const clearPayload = useCallback(() => setPayload(null), []);

	return {
		isSigning,
		error,
		payload,
		taxAmount,
		signTransferAuth,
		clearError,
		clearPayload,
	};
}
