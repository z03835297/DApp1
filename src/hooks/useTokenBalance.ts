"use client";

import { useState, useEffect, useCallback } from "react";
import { formatUnits } from "ethers";
import { useWalletInfo } from "./useWalletInfo";
import { useUsdtContract, useTokenContract } from "./useContract";

export interface UseTokenBalanceReturn {
	/** 余额（格式化后的字符串） */
	balance: string;
	/** 原始余额（BigInt） */
	rawBalance: bigint | null;
	/** 代币精度 */
	decimals: number;
	/** 是否正在加载 */
	isLoading: boolean;
	/** 刷新余额 */
	refresh: () => Promise<void>;
}

/**
 * USDT 余额 Hook
 * 获取当前连接钱包的 USDT 余额
 */
export function useUsdtBalance(): UseTokenBalanceReturn {
	const [balance, setBalance] = useState<string>("0");
	const [rawBalance, setRawBalance] = useState<bigint | null>(null);
	const [decimals, setDecimals] = useState<number>(6);
	const [isLoading, setIsLoading] = useState(false);

	const { address, isConnected, isSupportedChain } = useWalletInfo();
	const { contract: usdtContract, isReady } = useUsdtContract();

	const fetchBalance = useCallback(async () => {
		if (
			!isConnected ||
			!address ||
			!isReady ||
			!usdtContract ||
			!isSupportedChain
		) {
			setBalance("0");
			setRawBalance(null);
			return;
		}

		setIsLoading(true);
		try {
			// 获取余额和 decimals
			const [balanceResult, decimalsResult] = await Promise.all([
				usdtContract.balanceOf(address),
				usdtContract.decimals(),
			]);

			const formattedBalance = formatUnits(balanceResult, decimalsResult);
			setBalance(formattedBalance);
			setRawBalance(balanceResult);
			setDecimals(Number(decimalsResult));
		} catch (error) {
			console.error("Failed to fetch USDT balance:", error);
			setBalance("0");
			setRawBalance(null);
		} finally {
			setIsLoading(false);
		}
	}, [isConnected, address, isSupportedChain, usdtContract, isReady]);

	// 当钱包连接状态或网络变化时获取余额
	useEffect(() => {
		fetchBalance();
	}, [fetchBalance]);

	return {
		balance,
		rawBalance,
		decimals,
		isLoading,
		refresh: fetchBalance,
	};
}

/**
 * Token 余额 Hook
 * 获取当前连接钱包的项目代币余额
 */
export function useTokenBalance(): UseTokenBalanceReturn {
	const [balance, setBalance] = useState<string>("0");
	const [rawBalance, setRawBalance] = useState<bigint | null>(null);
	const [decimals, setDecimals] = useState<number>(18);
	const [isLoading, setIsLoading] = useState(false);

	const { address, isConnected, isSupportedChain } = useWalletInfo();
	const { contract: tokenContract, isReady } = useTokenContract();

	const fetchBalance = useCallback(async () => {
		if (
			!isConnected ||
			!address ||
			!isReady ||
			!tokenContract ||
			!isSupportedChain
		) {
			setBalance("0");
			setRawBalance(null);
			return;
		}

		setIsLoading(true);
		try {
			// 获取余额和 decimals
			const [balanceResult, decimalsResult] = await Promise.all([
				tokenContract.balanceOf(address),
				tokenContract.decimals(),
			]);

			const formattedBalance = formatUnits(balanceResult, decimalsResult);
			setBalance(formattedBalance);
			setRawBalance(balanceResult);
			setDecimals(Number(decimalsResult));
		} catch (error) {
			console.error("Failed to fetch token balance:", error);
			setBalance("0");
			setRawBalance(null);
		} finally {
			setIsLoading(false);
		}
	}, [isConnected, address, isSupportedChain, tokenContract, isReady]);

	// 当钱包连接状态或网络变化时获取余额
	useEffect(() => {
		fetchBalance();
	}, [fetchBalance]);

	return {
		balance,
		rawBalance,
		decimals,
		isLoading,
		refresh: fetchBalance,
	};
}
