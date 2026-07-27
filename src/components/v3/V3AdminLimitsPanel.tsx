"use client";

import { useState } from "react";
import { useV3AdminLimits } from "@/hooks";

export default function V3AdminLimitsPanel() {
	const {
		perTxLimit,
		globalDailyLimit,
		globalUsedToday,
		isLoading,
		isUpdating,
		error,
		refresh,
		setPerTxLimit,
		setGlobalDailyLimit,
		clearError,
	} = useV3AdminLimits();

	const [perTxInput, setPerTxInput] = useState("");
	const [dailyInput, setDailyInput] = useState("");
	const [message, setMessage] = useState<string | null>(null);

	const handleSetPerTx = async () => {
		setMessage(null);
		clearError();
		const ok = await setPerTxLimit(perTxInput);
		if (ok) {
			setMessage("单笔上限已更新");
			setPerTxInput("");
		}
	};

	const handleSetDaily = async () => {
		setMessage(null);
		clearError();
		const ok = await setGlobalDailyLimit(dailyInput);
		if (ok) {
			setMessage("日上限已更新");
			setDailyInput("");
		}
	};

	return (
		<div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl border border-zinc-700/50 p-6 space-y-6">
			<div className="flex items-start justify-between">
				<div>
					<h3 className="text-lg font-bold text-white">LimitGate 限额</h3>
					<p className="text-sm text-zinc-400 mt-1">
						在 LimitGate 合约上设置单笔 / 全服日赎回上限
					</p>
				</div>
				<button
					type="button"
					onClick={refresh}
					disabled={isLoading}
					className="text-xs text-violet-400 hover:text-violet-300 disabled:opacity-50"
				>
					刷新
				</button>
			</div>

			<div className="grid grid-cols-3 gap-3 text-sm">
				<div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/40">
					<p className="text-zinc-500 text-xs">单笔上限</p>
					<p className="text-white font-semibold mt-1">{perTxLimit}</p>
				</div>
				<div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/40">
					<p className="text-zinc-500 text-xs">日上限</p>
					<p className="text-white font-semibold mt-1">{globalDailyLimit}</p>
				</div>
				<div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/40">
					<p className="text-zinc-500 text-xs">今日已用</p>
					<p className="text-white font-semibold mt-1">{globalUsedToday}</p>
				</div>
			</div>

			<div className="space-y-3">
				<label className="block text-sm text-zinc-300" htmlFor="per-tx-limit">
					设置单笔上限
				</label>
				<div className="flex gap-2">
					<input
						id="per-tx-limit"
						type="number"
						value={perTxInput}
						onChange={(e) => setPerTxInput(e.target.value)}
						placeholder={perTxLimit}
						min="0"
						step="any"
						disabled={isUpdating}
						className="flex-1 px-4 py-2 bg-zinc-800/50 border border-zinc-600/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
					/>
					<button
						type="button"
						onClick={handleSetPerTx}
						disabled={isUpdating || !perTxInput}
						className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50"
					>
						更新
					</button>
				</div>
			</div>

			<div className="space-y-3">
				<label className="block text-sm text-zinc-300" htmlFor="daily-limit">
					设置日上限
				</label>
				<div className="flex gap-2">
					<input
						id="daily-limit"
						type="number"
						value={dailyInput}
						onChange={(e) => setDailyInput(e.target.value)}
						placeholder={globalDailyLimit}
						min="0"
						step="any"
						disabled={isUpdating}
						className="flex-1 px-4 py-2 bg-zinc-800/50 border border-zinc-600/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
					/>
					<button
						type="button"
						onClick={handleSetDaily}
						disabled={isUpdating || !dailyInput}
						className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50"
					>
						更新
					</button>
				</div>
			</div>

			{error && (
				<div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
					<p className="text-sm text-red-400">{error}</p>
				</div>
			)}
			{message && (
				<div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
					<p className="text-sm text-emerald-300">{message}</p>
				</div>
			)}
		</div>
	);
}
