"use client";

import { useState } from "react";
import {
	useWalletInfo,
	useV3TokenMeta,
	useV3UsdtBalance,
	useV3Mint,
} from "@/hooks";

interface V3MintPanelProps {
	onSuccess?: () => void;
}

export default function V3MintPanel({ onSuccess }: V3MintPanelProps) {
	const [amount, setAmount] = useState("");

	const { isConnected } = useWalletInfo();
	const { usdtInfo, tokenInfo } = useV3TokenMeta();
	const {
		balance: usdtBalance,
		isLoading: isLoadingBalance,
		refresh: refreshBalance,
	} = useV3UsdtBalance();
	const {
		isApproving,
		isApproved,
		isMinting,
		approve,
		mint,
		reset,
		error,
	} = useV3Mint();

	const handleAmountChange = (value: string) => {
		setAmount(value);
		if (isApproved) reset();
	};

	const handleApprove = async () => {
		if (!amount) return;
		await approve(amount, usdtBalance);
	};

	const handleMint = async () => {
		if (!amount) return;
		const success = await mint(amount);
		if (success) {
			await refreshBalance();
			setAmount("");
			onSuccess?.();
		}
	};

	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h3 className="text-xl font-bold text-white">Mint Tokens</h3>
				<p className="text-sm text-zinc-400">
					存入 USDT，1:1 铸造 Token（approve → mint）
				</p>
			</div>

			<div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30">
				<div className="flex items-center justify-between mb-2">
					<span className="text-sm text-zinc-400">{usdtInfo.name} 余额</span>
					<button
						type="button"
						onClick={refreshBalance}
						disabled={isLoadingBalance || !isConnected}
						className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
					>
						{isLoadingBalance ? "刷新中..." : "刷新"}
					</button>
				</div>
				<div className="flex items-baseline gap-2">
					<span className="text-2xl font-bold text-white">
						{isLoadingBalance ? (
							<span className="inline-block w-20 h-7 bg-zinc-700 rounded animate-pulse" />
						) : !isConnected ? (
							"-"
						) : (
							Number(usdtBalance).toLocaleString(undefined, {
								maximumFractionDigits: 6,
							})
						)}
					</span>
					<span className="text-sm text-zinc-400">{usdtInfo.symbol}</span>
				</div>
			</div>

			<div className="space-y-2">
				<label
					htmlFor="v3-mint-amount"
					className="block text-sm font-medium text-zinc-300"
				>
					数量
				</label>
				<div className="relative">
					<input
						id="v3-mint-amount"
						type="number"
						value={amount}
						onChange={(e) => handleAmountChange(e.target.value)}
						placeholder="0.0"
						min="0"
						step="any"
						disabled={isApproving || isMinting}
						className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-600/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
					/>
					<button
						type="button"
						onClick={() => setAmount(usdtBalance)}
						disabled={!isConnected || isApproving || isMinting}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
					>
						MAX
					</button>
				</div>
			</div>

			{error && (
				<div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
					<p className="text-sm text-red-400">{error}</p>
				</div>
			)}

			<div className="space-y-3">
				<button
					type="button"
					onClick={handleApprove}
					disabled={isApproving || isApproved || !amount || !isConnected}
					className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all disabled:cursor-not-allowed flex items-center justify-center gap-3 ${
						isApproved
							? "bg-emerald-600/20 border-2 border-emerald-500 text-emerald-400"
							: "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/25 disabled:opacity-50"
					}`}
				>
					<span
						className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
							isApproved ? "bg-emerald-500 text-white" : "bg-white/20"
						}`}
					>
						{isApproved ? "✓" : "1"}
					</span>
					{isApproving
						? "授权中..."
						: isApproved
							? "授权完成"
							: `授权 ${usdtInfo.symbol}`}
				</button>

				<button
					type="button"
					onClick={handleMint}
					disabled={isMinting || !isApproved || !amount || !isConnected}
					className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all disabled:cursor-not-allowed flex items-center justify-center gap-3 ${
						!isApproved
							? "bg-zinc-700 text-zinc-400 opacity-50"
							: "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25"
					}`}
				>
					<span className="flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold bg-white/20">
						2
					</span>
					{isMinting ? "Minting..." : `Mint ${tokenInfo.symbol}`}
				</button>
			</div>

			<p className="text-xs text-center text-zinc-500">
				Step 1: 授权 USDT 给 Token → Step 2: Token.mint
			</p>
		</div>
	);
}
