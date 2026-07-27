"use client";

import { useState, useEffect, useCallback } from "react";
import { formatUnits } from "ethers";
import {
	useV3TokenContract,
	useV3LimitGateContract,
	useV3UsdtContract,
} from "./useV3Contract";

export interface UseV3LimitInfoReturn {
	perTxLimit: string;
	globalDailyLimit: string;
	globalUsedToday: string;
	vaultUsdtBalance: string;
	paused: boolean;
	decimals: number;
	isLoading: boolean;
	refresh: () => Promise<void>;
}

/**
 * V3 赎回额度 / 金库余额 / 暂停状态（只读）
 */
export function useV3LimitInfo(): UseV3LimitInfoReturn {
	const [perTxLimit, setPerTxLimit] = useState("0");
	const [globalDailyLimit, setGlobalDailyLimit] = useState("0");
	const [globalUsedToday, setGlobalUsedToday] = useState("0");
	const [vaultUsdtBalance, setVaultUsdtBalance] = useState("0");
	const [paused, setPaused] = useState(false);
	const [decimals, setDecimals] = useState(6);
	const [isLoading, setIsLoading] = useState(false);

	const { contract: tokenContract, address: tokenAddress, isReady: isTokenReady } =
		useV3TokenContract();
	const { contract: gateContract, isReady: isGateReady } =
		useV3LimitGateContract();
	const { contract: usdtContract, isReady: isUsdtReady } = useV3UsdtContract();

	const refresh = useCallback(async () => {
		if (
			!isTokenReady ||
			!isGateReady ||
			!isUsdtReady ||
			!tokenContract ||
			!gateContract ||
			!usdtContract ||
			!tokenAddress
		) {
			return;
		}

		setIsLoading(true);
		try {
			const [
				dec,
				perTx,
				daily,
				used,
				vaultBal,
				isPaused,
			] = await Promise.all([
				tokenContract.decimals(),
				gateContract.perTxLimit(),
				gateContract.globalDailyLimit(),
				gateContract.globalUsedToday(),
				usdtContract.balanceOf(tokenAddress),
				tokenContract.paused(),
			]);

			const decNum = Number(dec);
			setDecimals(decNum);
			setPerTxLimit(formatUnits(perTx, decNum));
			setGlobalDailyLimit(formatUnits(daily, decNum));
			setGlobalUsedToday(formatUnits(used, decNum));
			setVaultUsdtBalance(formatUnits(vaultBal, decNum));
			setPaused(Boolean(isPaused));
		} catch (error) {
			console.error("Failed to fetch V3 limit info:", error);
		} finally {
			setIsLoading(false);
		}
	}, [
		tokenContract,
		gateContract,
		usdtContract,
		tokenAddress,
		isTokenReady,
		isGateReady,
		isUsdtReady,
	]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	return {
		perTxLimit,
		globalDailyLimit,
		globalUsedToday,
		vaultUsdtBalance,
		paused,
		decimals,
		isLoading,
		refresh,
	};
}
