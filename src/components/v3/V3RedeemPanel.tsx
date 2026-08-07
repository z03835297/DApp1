"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
	useWalletInfo,
	useV3TokenMeta,
	useV3TokenBalance,
	useV3LimitInfo,
	useV3Redeem,
	type RedeemPreview,
} from "@/hooks";

interface V3RedeemPanelProps {
	onSuccess?: () => void;
}

export default function V3RedeemPanel({ onSuccess }: V3RedeemPanelProps) {
	const t = useTranslations("v3.redeemPanel");
	const tCommon = useTranslations("common");
	const [amount, setAmount] = useState("");
	const [preview, setPreview] = useState<RedeemPreview>(null);

	const { isConnected } = useWalletInfo();
	const { tokenInfo, usdtInfo } = useV3TokenMeta();
	const {
		balance: tokenBalance,
		isLoading: isLoadingBalance,
		refresh: refreshBalance,
	} = useV3TokenBalance();
	const {
		perTxLimit,
		globalDailyLimit,
		globalUsedToday,
		vaultUsdtBalance,
		paused,
		refresh: refreshLimits,
	} = useV3LimitInfo();
	const {
		isRedeeming,
		error,
		lastOutcome,
		previewRedeem,
		redeem,
		clearError,
	} = useV3Redeem();

	useEffect(() => {
		let cancelled = false;
		(async () => {
			if (!amount || Number(amount) <= 0) {
				setPreview(null);
				return;
			}
			const result = await previewRedeem(amount);
			if (!cancelled) setPreview(result);
		})();
		return () => {
			cancelled = true;
		};
	}, [amount, previewRedeem]);

	const handleRedeem = async () => {
		if (!amount) return;
		const outcome = await redeem(amount, tokenBalance);
		if (outcome) {
			await Promise.all([refreshBalance(), refreshLimits()]);
			setAmount("");
			onSuccess?.();
		}
	};

	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h3 className="text-xl font-bold text-white">{t("title")}</h3>
				<p className="text-sm text-zinc-400">{t("description")}</p>
			</div>

			<div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30 space-y-3">
				<div className="flex items-center justify-between">
					<span className="text-sm text-zinc-400">
						{t("balance", { name: tokenInfo.name })}
					</span>
					<button
						type="button"
						onClick={() => {
							refreshBalance();
							refreshLimits();
						}}
						disabled={isLoadingBalance || !isConnected}
						className="text-xs text-amber-400 hover:text-amber-300 disabled:opacity-50"
					>
						{tCommon("refresh")}
					</button>
				</div>
				<div className="flex items-baseline gap-2">
					<span className="text-2xl font-bold text-white">
						{!isConnected
							? "-"
							: Number(tokenBalance).toLocaleString(undefined, {
									maximumFractionDigits: 6,
								})}
					</span>
					<span className="text-sm text-zinc-400">{tokenInfo.symbol}</span>
				</div>

				<div className="pt-3 border-t border-zinc-700/30 grid grid-cols-2 gap-2 text-xs">
					<div>
						<p className="text-zinc-500">{t("perTxLimit")}</p>
						<p className="text-zinc-300">{perTxLimit}</p>
					</div>
					<div>
						<p className="text-zinc-500">{t("dailyUsed")}</p>
						<p className="text-zinc-300">
							{globalUsedToday} / {globalDailyLimit}
						</p>
					</div>
					<div>
						<p className="text-zinc-500">{t("vaultBalance")}</p>
						<p className="text-zinc-300">{vaultUsdtBalance}</p>
					</div>
					<div>
						<p className="text-zinc-500">{t("paused")}</p>
						<p className={paused ? "text-red-400" : "text-emerald-400"}>
							{paused ? t("pausedYes") : t("pausedNo")}
						</p>
					</div>
				</div>
			</div>

			<div className="space-y-2">
				<label
					htmlFor="v3-redeem-amount"
					className="block text-sm font-medium text-zinc-300"
				>
					{t("amount")}
				</label>
				<div className="relative">
					<input
						id="v3-redeem-amount"
						type="number"
						value={amount}
						onChange={(e) => {
							if (error) clearError();
							setAmount(e.target.value);
						}}
						placeholder="0.0"
						min="0"
						step="any"
						disabled={isRedeeming || paused}
						className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-600/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
					/>
					<button
						type="button"
						onClick={() => setAmount(tokenBalance)}
						disabled={!isConnected || isRedeeming}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-amber-400 hover:text-amber-300 disabled:opacity-50"
					>
						{tCommon("max")}
					</button>
				</div>
			</div>

			{preview && (
				<div
					className={`p-3 rounded-lg border text-sm ${
						preview.kind === "instant"
							? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
							: preview.kind === "paused"
								? "bg-red-500/10 border-red-500/30 text-red-300"
								: "bg-amber-500/10 border-amber-500/30 text-amber-300"
					}`}
				>
					{preview.kind === "instant" &&
						t("previewInstant", { symbol: usdtInfo.symbol })}
					{preview.kind === "queued" &&
						t("previewQueued", { reason: preview.reason })}
					{preview.kind === "paused" && t("previewPaused")}
				</div>
			)}

			{lastOutcome && (
				<div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-300">
					{lastOutcome.kind === "instant" && t("outcomeInstant")}
					{lastOutcome.kind === "queued" &&
						t("outcomeQueued", { ticketId: lastOutcome.ticketId })}
					{lastOutcome.kind === "unknown" && t("outcomeUnknown")}
				</div>
			)}

			{error && (
				<div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
					<p className="text-sm text-red-400">{error}</p>
				</div>
			)}

			<button
				type="button"
				onClick={handleRedeem}
				disabled={isRedeeming || !amount || !isConnected || paused}
				className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25"
			>
				{isRedeeming
					? t("redeeming")
					: t("redeem", { symbol: tokenInfo.symbol })}
			</button>
		</div>
	);
}
