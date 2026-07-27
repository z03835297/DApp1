"use client";

import { useState, useEffect, useCallback } from "react";
import { formatUnits } from "ethers";
import { useWalletInfo } from "./useWalletInfo";
import { useV3TokenContract, useV3UsdtContract } from "./useV3Contract";

export interface UseV3BalanceReturn {
	balance: string;
	rawBalance: bigint | null;
	decimals: number;
	isLoading: boolean;
	refresh: () => Promise<void>;
}

function useV3Erc20Balance(
	contract: ReturnType<typeof useV3TokenContract>["contract"],
	isReady: boolean,
	defaultDecimals: number,
): UseV3BalanceReturn {
	const [balance, setBalance] = useState("0");
	const [rawBalance, setRawBalance] = useState<bigint | null>(null);
	const [decimals, setDecimals] = useState(defaultDecimals);
	const [isLoading, setIsLoading] = useState(false);

	const { address, isConnected, isSupportedChain } = useWalletInfo();

	const refresh = useCallback(async () => {
		if (!isConnected || !address || !isReady || !contract || !isSupportedChain) {
			setBalance("0");
			setRawBalance(null);
			return;
		}

		setIsLoading(true);
		try {
			const [balanceResult, decimalsResult] = await Promise.all([
				contract.balanceOf(address),
				contract.decimals(),
			]);
			setBalance(formatUnits(balanceResult, decimalsResult));
			setRawBalance(balanceResult);
			setDecimals(Number(decimalsResult));
		} catch (error) {
			console.error("Failed to fetch V3 balance:", error);
			setBalance("0");
			setRawBalance(null);
		} finally {
			setIsLoading(false);
		}
	}, [isConnected, address, isSupportedChain, contract, isReady]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	return { balance, rawBalance, decimals, isLoading, refresh };
}

/** V3 Token 余额 */
export function useV3TokenBalance(): UseV3BalanceReturn {
	const { contract, isReady } = useV3TokenContract();
	return useV3Erc20Balance(contract, isReady, 6);
}

/** V3 USDT 余额 */
export function useV3UsdtBalance(): UseV3BalanceReturn {
	const { contract, isReady } = useV3UsdtContract();
	return useV3Erc20Balance(contract, isReady, 6);
}
