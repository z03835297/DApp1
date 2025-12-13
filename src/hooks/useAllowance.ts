"use client";

import { useState, useCallback } from "react";
import { parseUnits } from "ethers";
import { useWalletInfo } from "./useWalletInfo";
import { useUsdtContract, useVaultContract } from "./useContract";

export interface UseVaultReturn {
	/** USDT 精度 */
	decimals: number;
	/** 是否正在执行 approve */
	isApproving: boolean;
	/** 是否已完成授权 */
	isApproved: boolean;
	/** 是否正在执行 mint */
	isMinting: boolean;
	/** 执行 approve（Step 1） */
	approve: (amount: string, userBalance?: string) => Promise<boolean>;
	/** 执行 mint（Step 2） */
	mint: (amount: string) => Promise<boolean>;
	/** 重置状态 */
	reset: () => void;
	/** 错误信息 */
	error: string | null;
}

/**
 * 验证金额输入是否有效
 * @param amount 输入金额字符串
 * @returns 是否有效
 */
function isValidAmount(amount: string): boolean {
	// 空值检查
	if (!amount || amount.trim() === "") return false;

	// 检查格式：只允许数字和最多一个小数点
	if (!/^\d*\.?\d*$/.test(amount)) return false;

	// 检查是否为有效数字
	const num = Number(amount);
	if (isNaN(num) || !isFinite(num)) return false;

	// 检查是否为正数
	if (num <= 0) return false;

	return true;
}

/**
 * 获取原始错误消息（用于开发调试）
 * @param err 原始错误
 * @param defaultMsg 默认消息
 * @returns 原始错误消息
 */
function getErrorMessage(err: unknown, defaultMsg: string): string {
	if (err instanceof Error) {
		return err.message;
	}
	if (typeof err === "string") {
		return err;
	}
	if (err && typeof err === "object" && "message" in err) {
		return String((err as { message: unknown }).message);
	}
	return defaultMsg;
}

/**
 * Vault 操作 Hook
 * Step 1: 授权 USDT 给 Vault
 * Step 2: 调用 Vault 的 mint 函数
 */
export function useAllowance(): UseVaultReturn {
	const [decimals, setDecimals] = useState<number>(6);
	const [isApproving, setIsApproving] = useState(false);
	const [isApproved, setIsApproved] = useState(false);
	const [isMinting, setIsMinting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	// 保存授权的金额，用于后续验证
	const [approvedAmount, setApprovedAmount] = useState<string>("");

	const { getSigner, address: userAddress } = useWalletInfo();
	const {
		contract: usdtContract,
		address: usdtAddress,
		abi: usdtAbi,
	} = useUsdtContract();
	const { address: vaultAddress, abi: vaultAbi } = useVaultContract();

	// 自动获取 USDT 精度
	const fetchDecimals = useCallback(async (): Promise<number> => {
		if (!usdtContract) return 6;
		try {
			const dec = await usdtContract.decimals();
			const decNum = Number(dec);
			setDecimals(decNum);
			return decNum;
		} catch {
			return 6; // USDT 默认精度
		}
	}, [usdtContract]);

	/**
	 * 检查链上实际授权额度
	 * @param amount 需要的金额
	 * @param dec 精度
	 * @returns 授权额度是否足够
	 */
	const checkAllowance = useCallback(
		async (amount: string, dec: number): Promise<boolean> => {
			if (!usdtContract || !userAddress || !vaultAddress) return false;

			try {
				const requiredAmount = parseUnits(amount, dec);
				const currentAllowance = await usdtContract.allowance(
					userAddress,
					vaultAddress,
				);

				return currentAllowance >= requiredAmount;
			} catch (err) {
				console.error("Failed to check allowance:", err);
				return false;
			}
		},
		[usdtContract, userAddress, vaultAddress],
	);

	// 重置状态
	const reset = useCallback(() => {
		setIsApproved(false);
		setApprovedAmount("");
		setError(null);
	}, []);

	// Step 1: 执行 approve
	const approve = useCallback(
		async (amount: string, userBalance?: string): Promise<boolean> => {
			// 输入验证
			if (!isValidAmount(amount)) {
				setError("请输入有效的正数金额");
				return false;
			}

			// 余额验证（如果提供了余额）
			if (userBalance !== undefined && Number(amount) > Number(userBalance)) {
				setError("输入金额超过可用余额");
				return false;
			}

			if (!usdtAddress || !usdtAbi || !vaultAddress || !userAddress) {
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

				// 创建带有 signer 的合约实例
				const { Contract } = await import("ethers");
				const usdtWithSigner = new Contract(usdtAddress, usdtAbi, signer);

				// 自动获取精度
				const dec = await fetchDecimals();

				// 将输入金额转换为合约需要的格式
				const approveAmount = parseUnits(amount, dec);

				// 检查当前授权额度
				const currentAllowance = await usdtWithSigner.allowance(
					userAddress,
					vaultAddress,
				);

				// 如果授权额度已经足够，直接跳过授权步骤
				if (currentAllowance >= approveAmount) {
					console.log("Allowance already sufficient, skipping approve");
					setIsApproved(true);
					setApprovedAmount(amount);
					return true;
				}

				// 官方 USDT 合约要求：如果已有非零授权但不够用，需要先重置为 0
				// 这是为了防止 "approve race condition" 攻击
				if (currentAllowance > BigInt(0)) {
					console.log("Resetting existing allowance to 0 first...");
					const resetTx = await usdtWithSigner.approve(vaultAddress, 0);
					await resetTx.wait(1);
				}

				// 执行授权
				const tx = await usdtWithSigner.approve(vaultAddress, approveAmount);
				// 等待 2 个区块确认以提高安全性
				await tx.wait(2);

				setIsApproved(true);
				setApprovedAmount(amount);
				return true;
			} catch (err) {
				console.error("Approve failed:", err);
				setError(getErrorMessage(err, "授权失败，请稍后重试"));
				return false;
			} finally {
				setIsApproving(false);
			}
		},
		[usdtAddress, usdtAbi, vaultAddress, userAddress, getSigner, fetchDecimals],
	);

	// Step 2: 执行 Vault mint
	const mint = useCallback(
		async (amount: string): Promise<boolean> => {
			// 输入验证
			if (!isValidAmount(amount)) {
				setError("请输入有效的正数金额");
				return false;
			}

			if (!vaultAddress || !vaultAbi) {
				setError("Vault 合约未初始化");
				return false;
			}

			// 检查前端授权状态
			if (!isApproved) {
				setError("请先完成授权（Step 1）");
				return false;
			}

			// 验证金额是否与授权金额一致
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

				// 自动获取 USDT 精度
				const dec = await fetchDecimals();

				// 🔒 安全检查：验证链上实际授权额度
				const hasEnoughAllowance = await checkAllowance(amount, dec);
				if (!hasEnoughAllowance) {
					setError("链上授权额度不足，请重新授权");
					setIsApproved(false);
					setApprovedAmount("");
					return false;
				}

				// 创建带有 signer 的 Vault 合约实例
				const { Contract } = await import("ethers");
				const vaultWithSigner = new Contract(vaultAddress, vaultAbi, signer);

				// 将输入金额转换为合约需要的格式
				const mintAmount = parseUnits(amount, dec);

				// 调用 Vault 的 mint 函数
				const tx = await vaultWithSigner.mint(mintAmount);
				// 等待 2 个区块确认
				await tx.wait(2);

				// mint 成功后重置授权状态
				setIsApproved(false);
				setApprovedAmount("");
				return true;
			} catch (err) {
				console.error("Mint failed:", err);
				setError(getErrorMessage(err, "Mint 失败，请稍后重试"));
				return false;
			} finally {
				setIsMinting(false);
			}
		},
		[
			vaultAddress,
			vaultAbi,
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
