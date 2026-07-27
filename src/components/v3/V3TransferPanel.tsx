"use client";

import { useState } from "react";
import {
	useWalletInfo,
	useV3TokenMeta,
	useV3TokenBalance,
	useV3Transfer,
} from "@/hooks";

interface V3TransferPanelProps {
	onSuccess?: () => void;
}

export default function V3TransferPanel({ onSuccess }: V3TransferPanelProps) {
	const [recipient, setRecipient] = useState("");
	const [amount, setAmount] = useState("");

	const { isConnected } = useWalletInfo();
	const { tokenInfo } = useV3TokenMeta();
	const {
		balance: tokenBalance,
		isLoading: isLoadingBalance,
		refresh: refreshBalance,
	} = useV3TokenBalance();
	const {
		taxAmount,
		isTransferring,
		estimateReceive,
		transfer,
		error,
		clearError,
	} = useV3Transfer();

	const receive = estimateReceive(amount);

	const handleTransfer = async () => {
		const success = await transfer(recipient, amount, tokenBalance);
		if (success) {
			await refreshBalance();
			setRecipient("");
			setAmount("");
			onSuccess?.();
		}
	};

	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h3 className="text-xl font-bold text-white">Transfer</h3>
				<p className="text-sm text-zinc-400">
					直接链上转账（用户付 Gas）；用户间转账可能扣固定税
				</p>
			</div>

			<div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30">
				<div className="flex items-center justify-between mb-2">
					<span className="text-sm text-zinc-400">{tokenInfo.name} 余额</span>
					<button
						type="button"
						onClick={refreshBalance}
						disabled={isLoadingBalance || !isConnected}
						className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
					>
						{isLoadingBalance ? "刷新中..." : "刷新"}
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
				{Number(taxAmount) > 0 && (
					<p className="mt-2 text-xs text-zinc-500">
						固定税：{taxAmount} {tokenInfo.symbol}（转账额须严格大于税额）
					</p>
				)}
			</div>

			<div className="space-y-2">
				<label
					htmlFor="v3-recipient"
					className="block text-sm font-medium text-zinc-300"
				>
					接收地址
				</label>
				<input
					id="v3-recipient"
					type="text"
					value={recipient}
					onChange={(e) => {
						if (error) clearError();
						setRecipient(e.target.value);
					}}
					placeholder="0x..."
					disabled={isTransferring}
					className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-600/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50"
				/>
			</div>

			<div className="space-y-2">
				<label
					htmlFor="v3-transfer-amount"
					className="block text-sm font-medium text-zinc-300"
				>
					转账数量
				</label>
				<div className="relative">
					<input
						id="v3-transfer-amount"
						type="number"
						value={amount}
						onChange={(e) => {
							if (error) clearError();
							setAmount(e.target.value);
						}}
						placeholder="0.0"
						min="0"
						step="any"
						disabled={isTransferring}
						className="w-full px-4 py-3 pr-16 bg-zinc-800/50 border border-zinc-600/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
					/>
					<button
						type="button"
						onClick={() => setAmount(tokenBalance)}
						disabled={!isConnected || isTransferring}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
					>
						MAX
					</button>
				</div>
			</div>

			{amount && Number(amount) > 0 && (
				<div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30 space-y-1 text-sm">
					<div className="flex justify-between">
						<span className="text-zinc-400">转出</span>
						<span className="text-white">
							{amount} {tokenInfo.symbol}
						</span>
					</div>
					{Number(taxAmount) > 0 && (
						<div className="flex justify-between">
							<span className="text-zinc-400">固定税</span>
							<span className="text-yellow-400">
								- {taxAmount} {tokenInfo.symbol}
							</span>
						</div>
					)}
					<div className="flex justify-between font-medium border-t border-zinc-700/50 pt-1">
						<span className="text-zinc-300">对方预估到账</span>
						<span className="text-white">
							{receive
								? `${receive} ${tokenInfo.symbol}`
								: "金额须大于税额"}
						</span>
					</div>
				</div>
			)}

			{error && (
				<div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
					<p className="text-sm text-red-400">{error}</p>
				</div>
			)}

			<button
				type="button"
				onClick={handleTransfer}
				disabled={
					isTransferring ||
					!recipient ||
					!amount ||
					!isConnected ||
					!receive
				}
				className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/25"
			>
				{isTransferring ? "转账中..." : `Transfer ${tokenInfo.symbol}`}
			</button>
		</div>
	);
}
