"use client";

import { useState, useCallback } from "react";
import { parseUnits, Contract } from "ethers";
import { useWalletInfo } from "./useWalletInfo";
import { useV3TokenContract, useV3UsdtContract } from "./useV3Contract";
import { getErrorMessage, isValidAmount } from "@/lib/v3/errors";

export interface UseV3MintReturn {
	decimals: number;
	isApproving: boolean;
	isApproved: boolean;
	isMinting: boolean;
	approve: (amount: string, userBalance?: string) => Promise<boolean>;
	mint: (amount: string) => Promise<boolean>;
	reset: () => void;
	error: string | null;
}

/**
 * V3 Mint：approve USDT → Token.mint(usdtAmount)
 * spender 是 Token 合约本身（不再是 Vault）
 */
export function useV3Mint(): UseV3MintReturn {
	const [decimals, setDecimals] = useState(6);
	const [isApproving, setIsApproving] = useState(false);
	const [isApproved, setIsApproved] = useState(false);
	const [isMinting, setIsMinting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [approvedAmount, setApprovedAmount] = useState("");

	const { getSigner, address: userAddress } = useWalletInfo();
	const {
		contract: usdtContract,
		address: usdtAddress,
		abi: usdtAbi,
	} = useV3UsdtContract();
	const {
		address: tokenAddress,
		abi: tokenAbi,
	} = useV3TokenContract();

	const fetchDecimals = useCallback(async (): Promise<number> => {
		if (!usdtContract) return 6;
		try {
			const dec = Number(await usdtContract.decimals());
			setDecimals(dec);
			return dec;
		} catch {
			return 6;
		}
	}, [usdtContract]);

	const checkAllowance = useCallback(
		async (amount: string, dec: number): Promise<boolean> => {
			if (!usdtContract || !userAddress || !tokenAddress) return false;
			try {
				const required = parseUnits(amount, dec);
				const current = await usdtContract.allowance(userAddress, tokenAddress);
				return current >= required;
			} catch {
				return false;
			}
		},
		[usdtContract, userAddress, tokenAddress],
	);

	const reset = useCallback(() => {
		setIsApproved(false);
		setApprovedAmount("");
		setError(null);
	}, []);

	const approve = useCallback(
		async (amount: string, userBalance?: string): Promise<boolean> => {
			if (!isValidAmount(amount)) {
				setError("请输入有效的正数金额");
				return false;
			}
			if (userBalance !== undefined && Number(amount) > Number(userBalance)) {
				setError("输入金额超过可用余额");
				return false;
			}
			if (!usdtAddress || !usdtAbi || !tokenAddress || !userAddress) {
				setError("合约未初始化");
				return false;
			}

			setIsApproving(true);
			setError(null);

			try {
				const signer = await getSigner();
				if (!signer) {
					setError("无法获取签名器，请确保钱包已连接");
					return false;
				}

				const usdtWithSigner = new Contract(usdtAddress, usdtAbi, signer);
				const dec = await fetchDecimals();
				const approveAmount = parseUnits(amount, dec);
				const currentAllowance = await usdtWithSigner.allowance(
					userAddress,
					tokenAddress,
				);

				if (currentAllowance >= approveAmount) {
					setIsApproved(true);
					setApprovedAmount(amount);
					return true;
				}

				// USDT 可能要求先清零再重新授权
				if (currentAllowance > BigInt(0)) {
					const resetTx = await usdtWithSigner.approve(tokenAddress, 0);
					await resetTx.wait(1);
				}

				const tx = await usdtWithSigner.approve(tokenAddress, approveAmount);
				await tx.wait(2);

				setIsApproved(true);
				setApprovedAmount(amount);
				return true;
			} catch (err) {
				console.error("V3 approve failed:", err);
				setError(getErrorMessage(err, "授权失败，请稍后重试"));
				return false;
			} finally {
				setIsApproving(false);
			}
		},
		[usdtAddress, usdtAbi, tokenAddress, userAddress, getSigner, fetchDecimals],
	);

	const mint = useCallback(
		async (amount: string): Promise<boolean> => {
			if (!isValidAmount(amount)) {
				setError("请输入有效的正数金额");
				return false;
			}
			if (!tokenAddress || !tokenAbi) {
				setError("Token 合约未初始化");
				return false;
			}
			if (!isApproved) {
				setError("请先完成授权（Step 1）");
				return false;
			}
			if (approvedAmount && amount !== approvedAmount) {
				setError("金额与授权金额不一致，请重新授权");
				setIsApproved(false);
				setApprovedAmount("");
				return false;
			}

			setIsMinting(true);
			setError(null);

			try {
				const signer = await getSigner();
				if (!signer) {
					setError("无法获取签名器，请确保钱包已连接");
					return false;
				}

				const dec = await fetchDecimals();
				const hasEnough = await checkAllowance(amount, dec);
				if (!hasEnough) {
					setError("链上授权额度不足，请重新授权");
					setIsApproved(false);
					setApprovedAmount("");
					return false;
				}

				const tokenWithSigner = new Contract(tokenAddress, tokenAbi, signer);
				const mintAmount = parseUnits(amount, dec);
				const tx = await tokenWithSigner.mint(mintAmount);
				await tx.wait(2);

				setIsApproved(false);
				setApprovedAmount("");
				return true;
			} catch (err) {
				console.error("V3 mint failed:", err);
				setError(getErrorMessage(err, "Mint 失败，请稍后重试"));
				return false;
			} finally {
				setIsMinting(false);
			}
		},
		[
			tokenAddress,
			tokenAbi,
			isApproved,
			approvedAmount,
			getSigner,
			fetchDecimals,
			checkAllowance,
		],
	);

	return {
		decimals,
		isApproving,
		isApproved,
		isMinting,
		approve,
		mint,
		reset,
		error,
	};
}
