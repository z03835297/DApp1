"use client";

import { useState, useEffect, useCallback } from "react";
import { useUsdtContract, useTokenContract } from "./useContract";

export interface TokenInfo {
	/** 代币名称 */
	name: string;
	/** 代币符号 */
	symbol: string;
}

export interface UseTokenInfoReturn {
	/** USDT 代币信息 */
	usdtInfo: TokenInfo;
	/** 项目代币信息 */
	tokenInfo: TokenInfo;
	/** 是否正在加载 */
	isLoading: boolean;
	/** 刷新代币信息 */
	refresh: () => Promise<void>;
}

const DEFAULT_USDT_INFO: TokenInfo = { name: "USDT", symbol: "USDT" };
const DEFAULT_TOKEN_INFO: TokenInfo = { name: "Token", symbol: "TOKEN" };

/**
 * 代币信息 Hook
 * 获取 USDT 和项目代币的 name 和 symbol
 */
export function useTokenInfo(): UseTokenInfoReturn {
	const [usdtInfo, setUsdtInfo] = useState<TokenInfo>(DEFAULT_USDT_INFO);
	const [tokenInfo, setTokenInfo] = useState<TokenInfo>(DEFAULT_TOKEN_INFO);
	const [isLoading, setIsLoading] = useState(false);

	const { contract: usdtContract, isReady: isUsdtReady } = useUsdtContract();
	const { contract: tokenContract, isReady: isTokenReady } = useTokenContract();

	const fetchTokenInfo = useCallback(async () => {
		if (!isUsdtReady || !isTokenReady || !usdtContract || !tokenContract) {
			return;
		}

		setIsLoading(true);
		try {
			// 并行获取两个合约的 name 和 symbol
			const [usdtName, usdtSymbol, tokenName, tokenSymbol] = await Promise.all([
				usdtContract.name(),
				usdtContract.symbol(),
				tokenContract.name(),
				tokenContract.symbol(),
			]);

			setUsdtInfo({ name: usdtName, symbol: usdtSymbol });
			setTokenInfo({ name: tokenName, symbol: tokenSymbol });
		} catch (error) {
			console.error("Failed to fetch token info:", error);
			// 保持默认值
		} finally {
			setIsLoading(false);
		}
	}, [usdtContract, tokenContract, isUsdtReady, isTokenReady]);

	// 当合约准备好时自动获取信息
	useEffect(() => {
		fetchTokenInfo();
	}, [fetchTokenInfo]);

	return {
		usdtInfo,
		tokenInfo,
		isLoading,
		refresh: fetchTokenInfo,
	};
}
