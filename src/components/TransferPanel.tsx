"use client";

import { useState } from "react";
import {
	useWalletInfo,
	useTokenInfo,
	useTokenBalance,
	useTransferFlow,
} from "@/hooks";
import { TRANSFER_FEE } from "@/lib/constants";

interface TransferPanelProps {
	onSuccess?: () => void;
}

export default function TransferPanel({ onSuccess }: TransferPanelProps) {
	const [recipient, setRecipient] = useState("");
	const [amount, setAmount] = useState("");
	const [copied, setCopied] = useState(false);

	const { isConnected } = useWalletInfo();
	const { tokenInfo } = useTokenInfo();
	const {
		balance: tokenBalance,
		isLoading: isLoadingBalance,
		refresh: refreshBalance,
	} = useTokenBalance();

	const {
		step,
		isProcessing,
		error,
		payload,
		txResult,
		executeTransfer,
		resetState,
		clearError,
	} = useTransferFlow();

	// 处理接收地址变化
	const handleRecipientChange = (value: string) => {
		if (error) clearError();
		if (step === "success" || step === "error") resetState();
		setRecipient(value);
	};

	// 处理金额变化
	const handleAmountChange = (value: string) => {
		if (error) clearError();
		if (step === "success" || step === "error") resetState();
		setAmount(value);
	};

	// 设置最大值（扣除手续费）
	const handleSetMax = () => {
		const maxAmount = Math.max(0, Number(tokenBalance) - TRANSFER_FEE);
		setAmount(maxAmount.toString());
	};

	// 复制交易哈希
	const handleCopyHash = async (hash: string) => {
		try {
			await navigator.clipboard.writeText(hash);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	// 处理转账
	const handleTransfer = async () => {
		const success = await executeTransfer({ recipient, amount });
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
					disabled={isProcessing}
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
						disabled={isProcessing}
						className="w-full px-4 py-3 pr-24 bg-zinc-800/50 border border-zinc-600/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
					/>
					<div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
						<button
							type="button"
							onClick={handleSetMax}
							disabled={!isConnected || isProcessing}
							className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							MAX
						</button>
						<span className="text-sm text-zinc-400">{tokenInfo.symbol}</span>
					</div>
				</div>
			</div>

			{/* 手续费和总计显示 */}
			{amount && Number(amount) > 0 && (
				<div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30 space-y-2">
					<div className="flex items-center justify-between text-sm">
						<span className="text-zinc-400">转账金额</span>
						<span className="text-white">
							{Number(amount).toLocaleString()} {tokenInfo.symbol}
						</span>
					</div>
					<div className="flex items-center justify-between text-sm">
						<span className="text-zinc-400">手续费</span>
						<span className="text-yellow-400">
							+ {TRANSFER_FEE} {tokenInfo.symbol}
						</span>
					</div>
					<div className="border-t border-zinc-700/50 pt-2 flex items-center justify-between text-sm font-medium">
						<span className="text-zinc-300">总计扣除</span>
						<span className="text-white">
							{(Number(amount) + TRANSFER_FEE).toLocaleString()} {tokenInfo.symbol}
						</span>
					</div>
					{/* 余额不足警告 */}
					{Number(amount) + TRANSFER_FEE > Number(tokenBalance) && (
						<p className="text-xs text-red-400">
							余额不足，需要 {(Number(amount) + TRANSFER_FEE).toLocaleString()}{" "}
							{tokenInfo.symbol}
						</p>
					)}
				</div>
			)}

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
					isProcessing ||
					!recipient ||
					!amount ||
					!isConnected ||
					Number(amount) + TRANSFER_FEE > Number(tokenBalance)
				}
				className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/25 disabled:opacity-50"
			>
				{isProcessing ? (
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
						{step === "signing" && "签名中..."}
						{step === "verifying" && "验证中..."}
						{step === "settling" && "转账中..."}
					</span>
				) : (
					<span>签名转账 {tokenInfo.symbol}</span>
				)}
			</button>

			{/* 转账成功显示 */}
			{step === "success" && txResult && (
				<div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 space-y-2">
					<div className="flex items-center justify-between">
						<h4 className="text-sm font-medium text-green-400">
							转账成功
						</h4>
						<button
							type="button"
							onClick={resetState}
							className="text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
						>
							关闭
						</button>
					</div>
					{txResult.txHash && (
						<div className="text-xs text-zinc-400">
							<div className="flex items-center gap-2">
								<span className="text-zinc-500">交易哈希:</span>
								<button
									type="button"
									onClick={() => handleCopyHash(txResult.txHash as string)}
									className="font-mono hover:text-white transition-colors cursor-pointer flex items-center gap-1 group"
									title="点击复制"
								>
									{txResult.txHash.slice(0, 10)}...{txResult.txHash.slice(-8)}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-opacity"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-hidden="true"
									>
										{copied ? (
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M5 13l4 4L19 7"
											/>
										) : (
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
											/>
										)}
									</svg>
								</button>
								{copied && (
									<span className="text-green-400 text-xs">已复制</span>
								)}
							</div>
						</div>
					)}
					<p className="text-xs text-green-400/80">
						交易已提交到区块链，请稍候刷新余额查看结果
					</p>
				</div>
			)}

			{/* 签名结果显示（调试用） */}
			{payload && step !== "success" && (
				<div className="bg-zinc-800/50 border border-zinc-600/50 rounded-xl p-4 space-y-2">
					<div className="flex items-center justify-between">
						<h4 className="text-sm font-medium text-yellow-400">
							{step === "verifying" ? "验证中..." : step === "settling" ? "结算中..." : "签名完成"}
						</h4>
						<span className="text-xs text-zinc-500">
							已输出到控制台
						</span>
					</div>
					<div className="text-xs text-zinc-400 space-y-1">
						<p>
							<span className="text-zinc-500">From:</span>{" "}
							{payload.message.from.slice(0, 10)}...{payload.message.from.slice(-8)}
						</p>
						<p>
							<span className="text-zinc-500">To:</span>{" "}
							{payload.message.to.slice(0, 10)}...{payload.message.to.slice(-8)}
						</p>
						<p>
							<span className="text-zinc-500">Value:</span> {payload.message.value}
						</p>
						<p>
							<span className="text-zinc-500">Nonce:</span>{" "}
							{payload.message.nonce.slice(0, 18)}...
						</p>
					</div>
				</div>
			)}

			{/* 提示信息 */}
			<p className="text-xs text-center text-zinc-500">
				V2 合约支持免 Gas 转账，让代币流转更便捷
			</p>
		</div>
	);
}
