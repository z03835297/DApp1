"use client";

import { useMemo } from "react";
import {
	useAppKitAccount,
	useAppKitNetwork,
	useAppKitProvider,
} from "@reown/appkit/react";
import { BrowserProvider, type Eip1193Provider } from "ethers";
import { ChainId } from "@/lib/constants";

export interface WalletInfo {
	/** 钱包地址 */
	address: string | undefined;
	/** 是否已连接钱包 */
	isConnected: boolean;
	/** 当前链 ID */
	chainId: number | undefined;
	/** 是否为支持的链 */
	isSupportedChain: boolean;
	/** 钱包 Provider */
	walletProvider: Eip1193Provider | undefined;
	/** 获取 BrowserProvider 实例 */
	getProvider: () => BrowserProvider | null;
	/** 获取 Signer 实例（用于签名交易） */
	getSigner: () => Promise<import("ethers").JsonRpcSigner | null>;
}

/**
 * 钱包信息 Hook
 * 封装钱包连接状态、网络信息和 Provider 获取逻辑
 */
export function useWalletInfo(): WalletInfo {
	const { address, isConnected } = useAppKitAccount();
	const { chainId: rawChainId } = useAppKitNetwork();
	const { walletProvider } = useAppKitProvider("eip155");

	// 转换 chainId 为数字
	const chainId = rawChainId ? Number(rawChainId) : undefined;

	// 检查是否为支持的链
	const isSupportedChain = useMemo(
		() => chainId === ChainId.MAINNET || chainId === ChainId.SEPOLIA,
		[chainId],
	);

	// 获取 BrowserProvider 实例
	const getProvider = useMemo(() => {
		return () => {
			if (!walletProvider) return null;
			return new BrowserProvider(walletProvider as Eip1193Provider);
		};
	}, [walletProvider]);

	// 获取 Signer 实例
	const getSigner = useMemo(() => {
		return async () => {
			const provider = getProvider();
			if (!provider) return null;
			return await provider.getSigner();
		};
	}, [getProvider]);

	return {
		address,
		isConnected,
		chainId,
		isSupportedChain,
		walletProvider: walletProvider as Eip1193Provider | undefined,
		getProvider,
		getSigner,
	};
}
