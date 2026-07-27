"use client";

import { useState, useCallback, useEffect } from "react";
import { parseUnits, formatUnits, Contract } from "ethers";
import { useWalletInfo } from "./useWalletInfo";
import { useV3TokenContract } from "./useV3Contract";
import { getErrorMessage, isValidAddress, isValidAmount } from "@/lib/v3/errors";

export interface UseV3TransferReturn {
	decimals: number;
	taxAmount: string;
	isTransferring: boolean;
	/** 预估对方实际到账（扣除固定税后） */
	estimateReceive: (amount: string) => string | null;
	transfer: (
		recipient: string,
		amount: string,
		userBalance?: string,
	) => Promise<boolean>;
	error: string | null;
	clearError: () => void;
}

/**
 * V3 直接转账（用户付 Gas），附加固定税预览
 */
export function useV3Transfer(): UseV3TransferReturn {
	const [decimals, setDecimals] = useState(6);
	const [taxAmount, setTaxAmount] = useState("0");
	const [isTransferring, setIsTransferring] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { getSigner } = useWalletInfo();
	const {
		address: tokenAddress,
		abi: tokenAbi,
		contract: tokenContract,
	} = useV3TokenContract();

	const fetchMeta = useCallback(async () => {
		if (!tokenContract) return;
		try {
			const [dec, tax] = await Promise.all([
				tokenContract.decimals(),
				tokenContract.taxAmount(),
			]);
			const decNum = Number(dec);
			setDecimals(decNum);
			setTaxAmount(formatUnits(tax, decNum));
		} catch {
			// keep defaults
		}
	}, [tokenContract]);

	useEffect(() => {
		fetchMeta();
	}, [fetchMeta]);

	const estimateReceive = useCallback(
		(amount: string): string | null => {
			if (!isValidAmount(amount)) return null;
			const receive = Number(amount) - Number(taxAmount);
			if (receive <= 0) return null;
			return receive.toString();
		},
		[taxAmount],
	);

	const clearError = useCallback(() => setError(null), []);

	const transfer = useCallback(
		async (
			recipient: string,
			amount: string,
			userBalance?: string,
		): Promise<boolean> => {
			if (!isValidAddress(recipient)) {
				setError("请输入有效的钱包地址");
				return false;
			}
			if (!isValidAmount(amount)) {
				setError("请输入有效的正数金额");
				return false;
			}
			if (userBalance !== undefined && Number(amount) > Number(userBalance)) {
				setError("输入金额超过可用余额");
				return false;
			}
			if (Number(amount) <= Number(taxAmount)) {
				setError(`转账金额必须严格大于固定税 ${taxAmount}`);
				return false;
			}
			if (!tokenAddress || !tokenAbi) {
				setError("Token 合约未初始化");
				return false;
			}

			setIsTransferring(true);
			setError(null);

			try {
				const signer = await getSigner();
				if (!signer) {
					setError("无法获取签名器，请确保钱包已连接");
					return false;
				}

				const tokenWithSigner = new Contract(tokenAddress, tokenAbi, signer);
				const dec = tokenContract
					? Number(await tokenContract.decimals())
					: decimals;
				const transferAmount = parseUnits(amount, dec);
				const tx = await tokenWithSigner.transfer(recipient, transferAmount);
				await tx.wait(2);
				return true;
			} catch (err) {
				console.error("V3 transfer failed:", err);
				setError(getErrorMessage(err, "转账失败，请稍后重试"));
				return false;
			} finally {
				setIsTransferring(false);
			}
		},
		[tokenAddress, tokenAbi, tokenContract, decimals, taxAmount, getSigner],
	);

	return {
		decimals,
		taxAmount,
		isTransferring,
		estimateReceive,
		transfer,
		error,
		clearError,
	};
}
