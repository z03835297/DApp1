"use client";

import Navbar from "@/components/Navbar";
import V3AdminLimitsPanel from "@/components/v3/V3AdminLimitsPanel";
import V3AdminQueuePanel from "@/components/v3/V3AdminQueuePanel";
import { useIsV3Admin, useWalletInfo } from "@/hooks";

export default function V3AdminPage() {
	const { isConnected } = useWalletInfo();
	const { isAdmin, adminAddress, isLoading } = useIsV3Admin();

	return (
		<div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
			<Navbar />
			<main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="text-center mb-10">
					<h1 className="text-3xl font-bold text-white mb-2">V3 Admin</h1>
					<p className="text-zinc-400 text-sm">
						LimitGate 限额设置 · RedeemQueue 审批队列
					</p>
					{adminAddress && (
						<p className="text-xs text-zinc-500 mt-2 font-mono">
							admin: {adminAddress}
						</p>
					)}
				</div>

				{!isConnected ? (
					<div className="text-center py-16 text-zinc-400">
						请先连接钱包
					</div>
				) : isLoading ? (
					<div className="text-center py-16 text-zinc-400">
						正在校验管理员身份...
					</div>
				) : !isAdmin ? (
					<div className="max-w-md mx-auto bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
						<h2 className="text-lg font-semibold text-red-300 mb-2">
							仅管理员可访问
						</h2>
						<p className="text-sm text-zinc-400">
							当前连接钱包不是 Token.admin()。合约层仍会拒绝非管理员写操作。
						</p>
					</div>
				) : (
					<div className="space-y-8">
						<V3AdminLimitsPanel />
						<V3AdminQueuePanel />
					</div>
				)}
			</main>
		</div>
	);
}
