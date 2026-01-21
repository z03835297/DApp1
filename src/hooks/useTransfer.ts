"use client";

import { useState, useCallback } from "react";
import { parseUnits } from "ethers";
import { useWalletInfo } from "./useWalletInfo";
import { useTokenContract } from "./useContract";

export interface UseTransferReturn {
	/** Token 精度 */
	decimals: number;
	/** 是否正在执行 transfer */
	isTransferring: boolean;
	/** 执行 transfer */
	transfer: (
		recipient: string,
		amount: string,
		userBalance?: string,
	) => Promise<boolean>;
	/** 错误信息 */
	error: string | null;
	/** 清除错误 */
	clearError: () => void;
}

/**
 * 验证地址格式是否有效
 * @param address 钱包地址
 * @returns 是否有效
 */
function isValidAddress(address: string): boolean {
	return /^0x[a-fA-F0-9]{40}$/.test(address);
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
	if (Number.isNaN(num) || !Number.isFinite(num)) return false;

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
 * Transfer 操作 Hook
 * 调用 Token 合约的 transfer 函数，进行代币转账
 */
export function useTransfer(): UseTransferReturn {
	const [decimals, setDecimals] = useState<number>(6);
	const [isTransferring, setIsTransferring] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { getSigner } = useWalletInfo();
	const {
		address: tokenAddress,
		abi: tokenAbi,
		contract: tokenContract,
	} = useTokenContract();

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

	// 执行 transfer
	const transfer = useCallback(
		async (
			recipient: string,
			amount: string,
			userBalance?: string,
		): Promise<boolean> => {
			// 地址验证
			if (!isValidAddress(recipient)) {
				setError("请输入有效的钱包地址");
				return false;
			}

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

				// 创建带有 signer 的 Token 合约实例
				const { Contract } = await import("ethers");
				const tokenWithSigner = new Contract(tokenAddress, tokenAbi, signer);

				// 自动获取 Token 精度
				const dec = await fetchDecimals();

				// 将输入金额转换为合约需要的格式
				const transferAmount = parseUnits(amount, dec);

				// 调用 Token 的 transfer 函数
				const tx = await tokenWithSigner.transfer(recipient, transferAmount);
				// 等待 2 个区块确认
				await tx.wait(2);

				return true;
			} catch (err) {
				console.error("Transfer failed:", err);
				setError(getErrorMessage(err, "转账失败，请稍后重试"));
				return false;
			} finally {
				setIsTransferring(false);
			}
		},
		[tokenAddress, tokenAbi, getSigner, fetchDecimals],
	);

	return {
		decimals,
		isTransferring,
		transfer,
		error,
		clearError,
	};
}
