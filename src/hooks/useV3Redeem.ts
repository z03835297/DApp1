"use client";

import { useState, useCallback } from "react";
import { parseUnits, Contract, formatUnits } from "ethers";
import { useWalletInfo } from "./useWalletInfo";
import {
	useV3TokenContract,
	useV3LimitGateContract,
	useV3UsdtContract,
} from "./useV3Contract";
import { getErrorMessage, isValidAmount } from "@/lib/v3/errors";

export type RedeemOutcome =
	| { kind: "instant" }
	| { kind: "queued"; ticketId: string }
	| { kind: "unknown" };

export type RedeemPreview =
	| { kind: "instant" }
	| { kind: "queued"; reason: string }
	| { kind: "paused" }
	| null;

export interface UseV3RedeemReturn {
	isRedeeming: boolean;
	error: string | null;
	lastOutcome: RedeemOutcome | null;
	previewRedeem: (amount: string) => Promise<RedeemPreview>;
	redeem: (amount: string, userBalance?: string) => Promise<RedeemOutcome | null>;
	clearError: () => void;
}

/**
 * V3 Redeem：预判即时/入队，调用 Token.redeem，解析回执区分结果
 */
export function useV3Redeem(): UseV3RedeemReturn {
	const [isRedeeming, setIsRedeeming] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [lastOutcome, setLastOutcome] = useState<RedeemOutcome | null>(null);

	const { getSigner, address } = useWalletInfo();
	const {
		address: tokenAddress,
		abi: tokenAbi,
		contract: tokenContract,
	} = useV3TokenContract();
	const { contract: gateContract } = useV3LimitGateContract();
	const { contract: usdtContract } = useV3UsdtContract();

	const clearError = useCallback(() => setError(null), []);

	const previewRedeem = useCallback(
		async (amount: string): Promise<RedeemPreview> => {
			if (!isValidAmount(amount) || !tokenContract || !gateContract || !usdtContract || !tokenAddress || !address) {
				return null;
			}

			try {
				const dec = Number(await tokenContract.decimals());
				const amountWei = parseUnits(amount, dec);
				const [paused, limits, vaultBal] = await Promise.all([
					tokenContract.paused(),
					gateContract.checkLimits(address, amountWei),
					usdtContract.balanceOf(tokenAddress),
				]);

				if (paused) return { kind: "paused" };

				const [userOk, globalOk] = limits as [boolean, boolean];

				if (!userOk) {
					return { kind: "queued", reason: "超过单笔赎回上限" };
				}
				if (!globalOk) {
					return { kind: "queued", reason: "超过全服当日赎回额度" };
				}
				if (vaultBal < amountWei) {
					return {
						kind: "queued",
						reason: `金库 USDT 不足（当前 ${formatUnits(vaultBal, dec)}）`,
					};
				}
				return { kind: "instant" };
			} catch (err) {
				console.error("previewRedeem failed:", err);
				return null;
			}
		},
		[tokenContract, gateContract, usdtContract, tokenAddress, address],
	);

	const redeem = useCallback(
		async (
			amount: string,
			userBalance?: string,
		): Promise<RedeemOutcome | null> => {
			if (!isValidAmount(amount)) {
				setError("请输入有效的正数金额");
				return null;
			}
			if (userBalance !== undefined && Number(amount) > Number(userBalance)) {
				setError("输入金额超过可用余额");
				return null;
			}
			if (!tokenAddress || !tokenAbi || !tokenContract) {
				setError("Token 合约未初始化");
				return null;
			}

			setIsRedeeming(true);
			setError(null);
			setLastOutcome(null);

			try {
				const signer = await getSigner();
				if (!signer) {
					setError("无法获取签名器，请确保钱包已连接");
					return null;
				}

				const dec = Number(await tokenContract.decimals());
				const redeemAmount = parseUnits(amount, dec);
				const tokenWithSigner = new Contract(tokenAddress, tokenAbi, signer);
				const tx = await tokenWithSigner.redeem(redeemAmount);
				const receipt = await tx.wait(2);

				// 解析日志：Redeemed(account, amount) vs RedeemRequested(ticketId, owner, amount)
				let outcome: RedeemOutcome = { kind: "unknown" };

				if (receipt?.logs) {
					for (const log of receipt.logs) {
						try {
							const parsed = tokenContract.interface.parseLog({
								topics: log.topics as string[],
								data: log.data,
							});
							if (parsed?.name === "Redeemed") {
								outcome = { kind: "instant" };
								break;
							}
						} catch {
							// not a Token event
						}
					}
				}

				// RedeemRequested 在 RedeemQueue 上发出
				if (outcome.kind === "unknown" && receipt?.logs) {
					const { Contract: EthersContract } = await import("ethers");
					const { V3_ABI } = await import("@/lib/constants");
					const { V3ContractName } = await import("@/lib/type");
					const queueIface = new EthersContract(
						"0x0000000000000000000000000000000000000001",
						V3_ABI[V3ContractName.REDEEM_QUEUE],
					).interface;

					for (const log of receipt.logs) {
						try {
							const parsed = queueIface.parseLog({
								topics: log.topics as string[],
								data: log.data,
							});
							if (parsed?.name === "RedeemRequested") {
								outcome = {
									kind: "queued",
									ticketId: parsed.args.ticketId.toString(),
								};
								break;
							}
						} catch {
							// not a Queue event
						}
					}
				}

				setLastOutcome(outcome);
				return outcome;
			} catch (err) {
				console.error("V3 redeem failed:", err);
				setError(getErrorMessage(err, "Redeem 失败，请稍后重试"));
				return null;
			} finally {
				setIsRedeeming(false);
			}
		},
		[tokenAddress, tokenAbi, tokenContract, getSigner],
	);

	return {
		isRedeeming,
		error,
		lastOutcome,
		previewRedeem,
		redeem,
		clearError,
	};
}
