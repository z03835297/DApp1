"use client";

import { useState, useCallback } from "react";
import { parseUnits } from "ethers";
import { useWalletInfo } from "./useWalletInfo";
import { useVaultContract, useTokenContract } from "./useContract";

export interface UseWithdrawReturn {
	/** Token 精度 */
	decimals: number;
	/** 是否正在执行 withdraw */
	isWithdrawing: boolean;
	/** 执行 withdraw (burnAndWithdraw) */
	withdraw: (amount: string, userBalance?: string) => Promise<boolean>;
	/** 错误信息 */
	error: string | null;
	/** 清除错误 */
	clearError: () => void;
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
 * 获取用户友好的错误消息
 * @param err 原始错误
 * @param defaultMsg 默认消息
 * @returns 用户友好的错误消息
 */
function getErrorMessage(err: unknown, defaultMsg: string): string {
	const message = err instanceof Error ? err.message.toLowerCase() : "";

	if (message.includes("user rejected") || message.includes("user denied")) {
		return "交易被用户取消";
	}
	if (message.includes("insufficient funds for gas")) {
		return "Gas 费用不足，请确保有足够的 ETH";
	}
	if (
		message.includes("insufficient") ||
		message.includes("balance") ||
		message.includes("insufficientbalance")
	) {
		return "代币余额不足";
	}
	if (message.includes("notallowedtoburn")) {
		return "当前账户没有 Withdraw 权限";
	}
	if (message.includes("nonce")) {
		return "交易 Nonce 错误，请刷新页面重试";
	}
	if (message.includes("timeout") || message.includes("timed out")) {
		return "交易超时，请稍后重试";
	}
	if (message.includes("network") || message.includes("connection")) {
		return "网络连接错误，请检查网络后重试";
	}

	return defaultMsg;
}

/**
 * Withdraw 操作 Hook
 * 调用 Vault 的 burnAndWithdraw 函数，将 Token 转换回 USDT
 */
export function useWithdraw(): UseWithdrawReturn {
	const [decimals, setDecimals] = useState<number>(6);
	const [isWithdrawing, setIsWithdrawing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { getSigner } = useWalletInfo();
	const { address: vaultAddress, abi: vaultAbi } = useVaultContract();
	const { contract: tokenContract } = useTokenContract();

	// 自动获取 Token 精度
	const fetchDecimals = useCallback(async (): Promise<number> => {
		if (!tokenContract) return 6;
		try {
			const dec = await tokenContract.decimals();
			const decNum = Number(dec);
			setDecimals(decNum);
			return decNum;
		} catch {
			return 6; // 默认精度
		}
	}, [tokenContract]);

	// 清除错误
	const clearError = useCallback(() => {
		setError(null);
	}, []);

	// 执行 withdraw (burnAndWithdraw)
	const withdraw = useCallback(
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

			if (!vaultAddress || !vaultAbi) {
				setError("Vault 合约未初始化");
				return false;
			}

			setIsWithdrawing(true);
			setError(null);

			try {
				const signer = await getSigner();
				if (!signer) {
					setError("无法获取签名器，请确保钱包已连接");
					return false;
				}

				// 创建带有 signer 的 Vault 合约实例
				const { Contract } = await import("ethers");
				const vaultWithSigner = new Contract(vaultAddress, vaultAbi, signer);

				// 自动获取 Token 精度
				const dec = await fetchDecimals();

				// 将输入金额转换为合约需要的格式
				const withdrawAmount = parseUnits(amount, dec);

				// 调用 Vault 的 burnAndWithdraw 函数
				const tx = await vaultWithSigner.burnAndWithdraw(withdrawAmount);
				// 等待 2 个区块确认
				await tx.wait(2);

				return true;
			} catch (err) {
				console.error("Withdraw failed:", err);
				setError(getErrorMessage(err, "Withdraw 失败，请稍后重试"));
				return false;
			} finally {
				setIsWithdrawing(false);
			}
		},
		[vaultAddress, vaultAbi, getSigner, fetchDecimals],
	);

	return {
		decimals,
		isWithdrawing,
		withdraw,
		error,
		clearError,
	};
}
