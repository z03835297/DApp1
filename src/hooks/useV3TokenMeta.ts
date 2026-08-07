"use client";

import { useState, useEffect, useCallback } from "react";
import { formatUnits } from "ethers";
import { readTokenTax } from "@/lib/v3/tax";
import { useV3TokenContract, useV3UsdtContract } from "./useV3Contract";

export interface TokenMeta {
	name: string;
	symbol: string;
	decimals: number;
}

export interface UseV3TokenMetaReturn {
	tokenInfo: TokenMeta;
	usdtInfo: TokenMeta;
	taxAmount: string;
	paused: boolean;
	isLoading: boolean;
	refresh: () => Promise<void>;
}

const DEFAULT_TOKEN: TokenMeta = { name: "Token", symbol: "TOKEN", decimals: 6 };
const DEFAULT_USDT: TokenMeta = { name: "USDT", symbol: "USDT", decimals: 6 };

/**
 * V3 Token / USDT 元数据 + taxAmount / paused
 */
export function useV3TokenMeta(): UseV3TokenMetaReturn {
	const [tokenInfo, setTokenInfo] = useState<TokenMeta>(DEFAULT_TOKEN);
	const [usdtInfo, setUsdtInfo] = useState<TokenMeta>(DEFAULT_USDT);
	const [taxAmount, setTaxAmount] = useState("0");
	const [paused, setPaused] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const { contract: tokenContract, isReady: isTokenReady } = useV3TokenContract();
	const { contract: usdtContract, isReady: isUsdtReady } = useV3UsdtContract();

	const refresh = useCallback(async () => {
		if (!isTokenReady || !isUsdtReady || !tokenContract || !usdtContract) return;

		setIsLoading(true);
		try {
			const [
				tokenName,
				tokenSymbol,
				tokenDecimals,
				usdtName,
				usdtSymbol,
				usdtDecimals,
				tax,
				isPaused,
			] = await Promise.all([
				tokenContract.name(),
				tokenContract.symbol(),
				tokenContract.decimals(),
				usdtContract.name(),
				usdtContract.symbol(),
				usdtContract.decimals(),
				readTokenTax(tokenContract),
				tokenContract.paused(),
			]);

			const dec = Number(tokenDecimals);
			setTokenInfo({
				name: tokenName,
				symbol: tokenSymbol,
				decimals: dec,
			});
			setUsdtInfo({
				name: usdtName,
				symbol: usdtSymbol,
				decimals: Number(usdtDecimals),
			});
			setTaxAmount(formatUnits(tax, dec));
			setPaused(Boolean(isPaused));
		} catch (error) {
			console.warn("Failed to fetch V3 token meta:", error);
		} finally {
			setIsLoading(false);
		}
	}, [tokenContract, usdtContract, isTokenReady, isUsdtReady]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	return {
		tokenInfo,
		usdtInfo,
		taxAmount,
		paused,
		isLoading,
		refresh,
	};
}
