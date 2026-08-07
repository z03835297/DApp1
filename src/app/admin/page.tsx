"use client";

import { useTranslations } from "next-intl";
import Navbar from "@/components/Navbar";
import V3AdminLimitsPanel from "@/components/v3/V3AdminLimitsPanel";
import V3AdminQueuePanel from "@/components/v3/V3AdminQueuePanel";
import { useIsV3Admin, useWalletInfo } from "@/hooks";

export default function AdminPage() {
	const t = useTranslations("adminPage");
	const { isConnected } = useWalletInfo();
	const { isAdmin, adminAddress, isLoading } = useIsV3Admin();

	return (
		<div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
			<Navbar />
			<main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="text-center mb-10">
					<h1 className="text-3xl font-bold text-white mb-2">{t("title")}</h1>
					<p className="text-zinc-400 text-sm">
						{t("subtitle")}
					</p>
					{adminAddress && (
						<p className="text-xs text-zinc-500 mt-2 font-mono">
							{t("adminAddress", { address: adminAddress })}
						</p>
					)}
				</div>

				{!isConnected ? (
					<div className="text-center py-16 text-zinc-400">
						{t("connectFirst")}
					</div>
				) : isLoading ? (
					<div className="text-center py-16 text-zinc-400">
						{t("checking")}
					</div>
				) : !isAdmin ? (
					<div className="max-w-md mx-auto bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
						<h2 className="text-lg font-semibold text-red-300 mb-2">
							{t("accessDeniedTitle")}
						</h2>
						<p className="text-sm text-zinc-400">
							{t("accessDeniedDesc")}
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
