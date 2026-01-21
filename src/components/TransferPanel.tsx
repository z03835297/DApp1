"use client";

import { useState } from "react";
import { useWalletInfo, useTokenInfo, useTransfer } from "@/hooks";

interface TransferPanelProps {
	onSuccess?: () => void;
}

export default function TransferPanel({ onSuccess }: TransferPanelProps) {
	const [recipient, setRecipient] = useState("");
	const [amount, setAmount] = useState("");

	const { isConnected } = useWalletInfo();
	const { tokenInfo } = useTokenInfo();
	const {
		isTransferring,
		transfer,
		error,
		clearError,
	} = useTransfer();

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

	// 处理转账
	const handleTransfer = async () => {
		if (!recipient || !amount) return;

		const success = await transfer(recipient, amount);

		if (success) {
			setRecipient("");
			setAmount("");
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

			{/* 功能说明 */}
			<div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
				<div className="flex items-start gap-3">
					<div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
						<svg
							className="w-4 h-4 text-indigo-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<title>信息</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<div>
						<p className="text-sm text-indigo-300 font-medium">免 Gas 转账</p>
						<p className="text-xs text-indigo-400/70 mt-1">
							使用 V2 合约进行转账，无需支付 Gas 费用
						</p>
					</div>
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
					disabled={isTransferring}
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
						disabled={isTransferring}
						className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-600/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
					/>
					<span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
						{tokenInfo.symbol}
					</span>
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
				disabled={
					isTransferring || !recipient || !amount || !isConnected
				}
				className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/25 disabled:opacity-50"
			>
				{isTransferring ? (
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
						转账中...
					</span>
				) : (
					<span>发送 {tokenInfo.symbol}</span>
				)}
			</button>

			{/* 提示信息 */}
			<p className="text-xs text-center text-zinc-500">
				V2 合约支持免 Gas 转账，让代币流转更便捷
			</p>
		</div>
	);
}
