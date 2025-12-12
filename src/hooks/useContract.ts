"use client";

import { useMemo } from "react";
import { Contract, type ContractRunner } from "ethers";
import { CONTRACT_ADDRESS, ABI, type ChainId } from "@/lib/constants";
import { ContractName } from "@/lib/type";
import { useWalletInfo } from "./useWalletInfo";

export interface ContractConfig {
	/** 合约名称 */
	contractName: ContractName;
	/** 是否需要 signer（用于写操作） */
	withSigner?: boolean;
}

export interface UseContractReturn {
	/** 合约实例 */
	contract: Contract | null;
	/** 合约地址 */
	address: string | null;
	/** 合约 ABI */
	abi: object[] | null;
	/** 是否可用 */
	isReady: boolean;
}

/**
 * 合约实例 Hook
 * 封装合约实例的创建和管理
 */
export function useContract(config: ContractConfig): UseContractReturn {
	const { contractName } = config;
	const { chainId, isSupportedChain, getProvider } = useWalletInfo();

	// 获取合约地址
	const contractAddress = useMemo(() => {
		if (!isSupportedChain || !chainId) return null;
		return CONTRACT_ADDRESS[chainId as ChainId]?.[contractName] ?? null;
	}, [chainId, isSupportedChain, contractName]);

	// 获取合约 ABI
	const contractAbi = useMemo(() => {
		if (!isSupportedChain || !chainId) return null;
		return ABI[chainId as ChainId]?.[contractName] ?? null;
	}, [chainId, isSupportedChain, contractName]);

	// 创建合约实例
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

/**
 * 获取 USDT 合约实例
 */
export function useUsdtContract() {
	return useContract({ contractName: ContractName.USDT });
}

/**
 * 获取 Token 合约实例
 */
export function useTokenContract() {
	return useContract({ contractName: ContractName.TOKEN });
}

/**
 * 获取 Vault 合约实例
 */
export function useVaultContract() {
	return useContract({ contractName: ContractName.VAULT });
}
