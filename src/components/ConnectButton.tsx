"use client";

import { ConnectButton as RKConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChainId } from "@/lib/constants";

/**
 * 自定义连接钱包按钮
 *
 * 基于 RainbowKit ConnectButton.Custom，UI 与项目顶栏配色对齐。
 * - 未连接：点击弹出钱包选择弹窗（仅 injected 钱包）
 * - 链不支持：点击弹出切链弹窗（Mainnet / Sepolia 可选）
 * - 已连接：点击弹出账户弹窗（查看 / 断开）
 */
export default function ConnectButton() {
	const t = useTranslations("connectButton");

	return (
		<RKConnectButton.Custom>
			{({
				account,
				chain,
				openAccountModal,
				openChainModal,
				openConnectModal,
				mounted,
			}) => {
				const ready = mounted;
				const connected = ready && !!account && !!chain;

				const baseClass =
					"inline-flex items-center justify-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50";

				if (!ready) {
					return (
						<div
							aria-hidden="true"
							style={{
								opacity: 0,
								pointerEvents: "none",
								userSelect: "none",
							}}
						>
							<button type="button" className={`${baseClass} bg-white text-indigo-600`}>
								{t("connectWallet")}
							</button>
						</div>
					);
				}

				if (!connected) {
					return (
						<button
							type="button"
							onClick={openConnectModal}
							className={`${baseClass} bg-white text-indigo-600 hover:bg-indigo-50`}
						>
							{t("connectWallet")}
						</button>
					);
				}

				if (chain.unsupported) {
					return (
						<button
							type="button"
							onClick={openChainModal}
							className={`${baseClass} bg-red-500 text-white hover:bg-red-600`}
						>
							{t("switchNetwork")}
						</button>
					);
				}

				const isTestnet = chain.id === ChainId.SEPOLIA;

				return (
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={openChainModal}
							className={`${baseClass} bg-white/15 text-white hover:bg-white/25`}
						>
							{chain.hasIcon && chain.iconUrl ? (
								<span
									className="inline-flex size-4 shrink-0 overflow-hidden rounded-full"
									style={{ backgroundColor: chain.iconBackground }}
								>
									<Image
										src={chain.iconUrl}
										alt={chain.name ?? "Chain"}
										width={16}
										height={16}
										unoptimized
										className="h-full w-full"
									/>
								</span>
							) : null}
							<span>{chain.name}</span>
							{isTestnet && (
								<span className="rounded-full bg-amber-400/90 px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wide text-amber-950">
									{t("test")}
								</span>
							)}
						</button>

						<button
							type="button"
							onClick={openAccountModal}
							className={`${baseClass} bg-white text-indigo-600 hover:bg-indigo-50`}
						>
							{account.displayName}
						</button>
					</div>
				);
			}}
		</RKConnectButton.Custom>
	);
}
