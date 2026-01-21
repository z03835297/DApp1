"use client";

import { useMemo } from "react";
import { Contract, type ContractRunner } from "ethers";
import { CONTRACT_ADDRESS, ABI, ChainId } from "@/lib/constants";
import { ContractName, type AppVersion } from "@/lib/type";
import { useWalletInfo } from "./useWalletInfo";
import { useVersion } from "@/context";

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
 * 自动根据当前版本获取对应的合约配置
 */
export function useContract(config: ContractConfig): UseContractReturn {
	const { contractName } = config;
	const version = useVersion(); // 从 context 获取当前版本
	const { chainId, isSupportedChain, getProvider } = useWalletInfo();

	// 获取合约地址（根据版本）
	const contractAddress = useMemo(() => {
		if (!isSupportedChain || !chainId) return null;
		const typedChainId = chainId as ChainId;
		const typedVersion = version as AppVersion;
		const chainContracts = CONTRACT_ADDRESS[typedChainId];
		if (!chainContracts) return null;
		const versionContracts = chainContracts[typedVersion];
		if (!versionContracts) return null;
		return versionContracts[contractName] ?? null;
	}, [chainId, isSupportedChain, contractName, version]);

	// 获取合约 ABI（根据版本）
	const contractAbi = useMemo(() => {
		if (!isSupportedChain || !chainId) return null;
		const typedChainId = chainId as ChainId;
		const typedVersion = version as AppVersion;
		const chainAbis = ABI[typedChainId];
		if (!chainAbis) return null;
		const versionAbis = chainAbis[typedVersion];
		if (!versionAbis) return null;
		return versionAbis[contractName] ?? null;
	}, [chainId, isSupportedChain, contractName, version]);

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
