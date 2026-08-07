"use client";

import { useMemo } from "react";
import { Contract, type ContractRunner } from "ethers";
import { V3_CONTRACT_ADDRESS, V3_ABI, V3_USDT_ABI, type ChainId } from "@/lib/constants";
import { V3ContractName } from "@/lib/type";
import { useWalletInfo } from "./useWalletInfo";

export interface UseV3ContractReturn {
	contract: Contract | null;
	address: string | null;
	abi: object[] | null;
	isReady: boolean;
}

/**
 * V3 合约实例 Hook
 * 直接按 V3 地址/ABI 查表，不依赖 VersionContext（v3 是独立模块）
 */
export function useV3Contract(contractName: V3ContractName): UseV3ContractReturn {
	const { chainId, isSupportedChain, getProvider } = useWalletInfo();

	const contractAddress = useMemo(() => {
		if (!isSupportedChain || !chainId) return null;
		const chainContracts = V3_CONTRACT_ADDRESS[chainId as ChainId];
		if (!chainContracts) return null;
		return chainContracts[contractName] ?? null;
	}, [chainId, isSupportedChain, contractName]);

	const contractAbi = useMemo(() => {
		if (contractName === V3ContractName.USDT) {
			if (!chainId) return null;
			return V3_USDT_ABI[chainId as ChainId] ?? null;
		}
		return V3_ABI[contractName] ?? null;
	}, [contractName, chainId]);

	const contract = useMemo(() => {
		if (!contractAddress || !contractAbi) return null;
		const provider = getProvider();
		if (!provider) return null;
		return new Contract(
			contractAddress,
			contractAbi,
			provider as ContractRunner,
		);
	}, [contractAddress, contractAbi, getProvider]);

	return {
		contract,
		address: contractAddress,
		abi: contractAbi,
		isReady: !!contract,
	};
}

export function useV3TokenContract() {
	return useV3Contract(V3ContractName.TOKEN);
}

export function useV3LimitGateContract() {
	return useV3Contract(V3ContractName.LIMIT_GATE);
}

export function useV3RedeemQueueContract() {
	return useV3Contract(V3ContractName.REDEEM_QUEUE);
}

export function useV3UsdtContract() {
	return useV3Contract(V3ContractName.USDT);
}
