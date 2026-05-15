"use client";

import { useMemo } from "react";
import { useAccount, useChainId, useConnectorClient } from "wagmi";
import type { Account, Chain, Client, Transport } from "viem";
import {
	BrowserProvider,
	JsonRpcSigner,
	type Eip1193Provider,
} from "ethers";
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
	getSigner: () => Promise<JsonRpcSigner | null>;
}

/**
 * 把 viem 的 WalletClient 适配成 ethers v6 的 BrowserProvider
 * @see https://wagmi.sh/react/guides/ethers#walletclient--signer
 */
function clientToBrowserProvider(
	client: Client<Transport, Chain, Account>,
): BrowserProvider {
	const { chain, transport } = client;
	const network = {
		chainId: chain.id,
		name: chain.name,
		ensAddress: chain.contracts?.ensRegistry?.address,
	};
	return new BrowserProvider(transport as unknown as Eip1193Provider, network);
}

/**
 * 钱包信息 Hook
 * 封装钱包连接状态、网络信息和 Provider 获取逻辑
 */
export function useWalletInfo(): WalletInfo {
	const { address, isConnected } = useAccount();
	const wagmiChainId = useChainId();
	const { data: client } = useConnectorClient();

	const chainId = isConnected ? wagmiChainId : undefined;

	const isSupportedChain = useMemo(
		() => chainId === ChainId.MAINNET || chainId === ChainId.SEPOLIA,
		[chainId],
	);

	const walletProvider = useMemo<Eip1193Provider | undefined>(() => {
		if (!client) return undefined;
		return client.transport as unknown as Eip1193Provider;
	}, [client]);

	const getProvider = useMemo(() => {
		return () => {
			if (!client) return null;
			return clientToBrowserProvider(client);
		};
	}, [client]);

	const getSigner = useMemo(() => {
		return async () => {
			if (!client) return null;
			const provider = clientToBrowserProvider(client);
			return new JsonRpcSigner(provider, client.account.address);
		};
	}, [client]);

	return {
		address,
		isConnected,
		chainId,
		isSupportedChain,
		walletProvider,
		getProvider,
		getSigner,
	};
}
