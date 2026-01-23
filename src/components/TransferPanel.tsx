"use client";

import { useState } from "react";
import {
	useWalletInfo,
	useTokenInfo,
	useTransferWithAuth,
	useTokenBalance,
} from "@/hooks";

interface TransferPanelProps {
	onSuccess?: () => void;
}

export default function TransferPanel({ onSuccess }: TransferPanelProps) {
	const [recipient, setRecipient] = useState("");
	const [amount, setAmount] = useState("");

	const { isConnected } = useWalletInfo();
	const { tokenInfo } = useTokenInfo();
	const {
		balance: tokenBalance,
		isLoading: isLoadingBalance,
		refresh: refreshBalance,
	} = useTokenBalance();
	const { isSigning, signTransferAuth, payload, error, clearError } =
		useTransferWithAuth();

	// 处理接收地址变化
	const handleRecipientChange = (value: string) => {
		if (error) clearError();
		setRecipient(value);
	};

	// 处理金额变化
	const handleAmountChange = (value: string) => {
		if (error) clearError();
		setAmount(value);
	};

	// 设置最大值
	const handleSetMax = () => {
		setAmount(tokenBalance);
	};

	// 处理签名转账
	const handleTransfer = async () => {
		if (!recipient || !amount) return;

		const result = await signTransferAuth(recipient, amount, tokenBalance);

		if (result) {
			setRecipient("");
			setAmount("");
			await refreshBalance();
			onSuccess?.();
		}
	};

	return (
		<div className="space-y-6">
			{/* 标题和描述 */}
			<div className="space-y-1">
				<h3 className="text-xl font-bold text-white">免费转账</h3>
				<p className="text-sm text-zinc-400">V2 专属功能 - 零 Gas 费转账</p>
			</div>

			{/* 余额显示 */}
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
						{isLoadingBalance ? (
							<span className="inline-block w-20 h-7 bg-zinc-700 rounded animate-pulse" />
						) : !isConnected ? (
							"-"
						) : (
							Number(tokenBalance).toLocaleString(undefined, {
								maximumFractionDigits: 6,
							})
						)}
					</span>
					<span className="text-sm text-zinc-400">{tokenInfo.symbol}</span>
				</div>
			</div>

			{/* 接收地址输入 */}
			<div className="space-y-2">
				<label
					htmlFor="recipient-address"
					className="block text-sm font-medium text-zinc-300"
				>
					接收地址
				</label>
				<input
					id="recipient-address"
					type="text"
					value={recipient}
					onChange={(e) => handleRecipientChange(e.target.value)}
					placeholder="0x..."
					disabled={isSigning}
					className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-600/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all disabled:opacity-50"
				/>
			</div>

			{/* 金额输入 */}
			<div className="space-y-2">
				<label
					htmlFor="transfer-amount"
					className="block text-sm font-medium text-zinc-300"
				>
					转账数量
				</label>
				<div className="relative">
					<input
						id="transfer-amount"
						type="number"
						value={amount}
						onChange={(e) => handleAmountChange(e.target.value)}
						placeholder="0.0"
						min="0"
						step="any"
						disabled={isSigning}
						className="w-full px-4 py-3 pr-24 bg-zinc-800/50 border border-zinc-600/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
					/>
					<div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
						<button
							type="button"
							onClick={handleSetMax}
							disabled={!isConnected || isSigning}
							className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							MAX
						</button>
						<span className="text-sm text-zinc-400">{tokenInfo.symbol}</span>
					</div>
				</div>
			</div>

			{/* 错误信息显示 */}
			{error && (
				<div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
					<p className="text-sm text-red-400">{error}</p>
				</div>
			)}

			{/* 转账按钮 */}
			<button
				type="button"
				onClick={handleTransfer}
				disabled={isSigning || !recipient || !amount || !isConnected}
				className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/25 disabled:opacity-50"
			>
				{isSigning ? (
					<span className="flex items-center gap-2">
						<svg
							aria-hidden="true"
							className="animate-spin h-5 w-5"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
							/>
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							/>
						</svg>
						签名中...
					</span>
				) : (
					<span>签名转账 {tokenInfo.symbol}</span>
				)}
			</button>

			{/* 签名结果显示 */}
			{payload && (
				<div className="bg-zinc-800/50 border border-zinc-600/50 rounded-xl p-4 space-y-2">
					<div className="flex items-center justify-between">
						<h4 className="text-sm font-medium text-green-400">
							签名成功
						</h4>
						<span className="text-xs text-zinc-500">
							已输出到控制台
						</span>
					</div>
					<div className="text-xs text-zinc-400 space-y-1">
						<p>
							<span className="text-zinc-500">From:</span>{" "}
							{payload.from.slice(0, 10)}...{payload.from.slice(-8)}
						</p>
						<p>
							<span className="text-zinc-500">To:</span>{" "}
							{payload.to.slice(0, 10)}...{payload.to.slice(-8)}
						</p>
						<p>
							<span className="text-zinc-500">Value:</span> {payload.value}
						</p>
						<p>
							<span className="text-zinc-500">Nonce:</span>{" "}
							{payload.nonce.slice(0, 18)}...
						</p>
					</div>
					<pre className="mt-2 p-2 bg-zinc-900/50 rounded-lg text-xs text-zinc-300 overflow-x-auto max-h-40 overflow-y-auto">
						{JSON.stringify(payload, null, 2)}
					</pre>
				</div>
			)}

			{/* 提示信息 */}
			<p className="text-xs text-center text-zinc-500">
				V2 合约支持免 Gas 转账，让代币流转更便捷
			</p>
		</div>
	);
}
