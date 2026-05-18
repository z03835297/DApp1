"use client";

import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { custom } from "viem";

/**
 * 仅使用浏览器注入的 EIP-1193 钱包（MetaMask / OKX / Rabby / Coinbase 扩展等），
 * 不走 WalletConnect，因此 projectId 仅作为 RainbowKit 的占位符，不会被实际使用。
 */
const connectors = connectorsForWallets(
	[{ groupName: "Wallets", wallets: [injectedWallet] }],
	{ appName: "BaCi DApp", projectId: "none" },
);

/**
 * 把 RPC 请求转发给浏览器注入的钱包 provider，避免外部 RPC 节点依赖。
 * SSR 阶段没有 window，会延迟到客户端实际发起请求时校验。
 */
const injectedTransport = custom({
	async request({ method, params }) {
		if (typeof window === "undefined") {
			throw new Error("钱包 RPC 仅在浏览器环境可用");
		}
		const provider = (
			window as unknown as {
				ethereum?: { request: (args: unknown) => Promise<unknown> };
			}
		).ethereum;
		if (!provider) throw new Error("未检测到已注入的 EVM 钱包");
		return provider.request({ method, params });
	},
});

export const wagmiConfig = createConfig({
	chains: [mainnet, sepolia],
	connectors,
	transports: {
		[mainnet.id]: injectedTransport,
		[sepolia.id]: injectedTransport,
	},
	ssr: true,
});

export { mainnet, sepolia };
