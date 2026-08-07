"use client";

import { RainbowKitProvider, lightTheme, type Locale } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { mainnet, wagmiConfig } from "@/lib/wagmi";
import { useAppLocale } from "@/i18n/LocaleProvider";
import { rainbowKitLocaleMap } from "@/i18n/config";

/**
 * 钱包接入 Provider
 *
 * 基于 wagmi + RainbowKit，仅启用浏览器注入式钱包（injectedWallet），
 * 因此无需 WalletConnect Project ID。支持 Mainnet 与 Sepolia 两个网络，
 * 用户可以通过 RainbowKit 的切链入口在主网与测试网之间切换。
 */
export function AppKitProvider({ children }: { children: ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 30_000,
						retry: 1,
						refetchOnWindowFocus: false,
					},
				},
			}),
	);
	const { locale } = useAppLocale();

	return (
		<WagmiProvider config={wagmiConfig}>
			<QueryClientProvider client={queryClient}>
				<RainbowKitProvider
					theme={lightTheme()}
					locale={rainbowKitLocaleMap[locale] as Locale}
					initialChain={mainnet}
				>
					{children}
				</RainbowKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}
