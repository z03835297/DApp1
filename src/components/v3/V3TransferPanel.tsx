"use client";

import { useState } from "react";
import { useChainId } from "wagmi";
import { useTranslations } from "next-intl";
import {
	useWalletInfo,
	useV3TokenMeta,
	useV3TokenBalance,
	useV3TransferFlow,
} from "@/hooks";
import { getTransactionExplorerUrl, getDisplayTxHash } from "@/lib/explorer";

interface V3TransferPanelProps {
	onSuccess?: () => void;
}

export default function V3TransferPanel({ onSuccess }: V3TransferPanelProps) {
	const t = useTranslations("v3.transferPanel");
	const tCommon = useTranslations("common");
	const [recipient, setRecipient] = useState("");
	const [amount, setAmount] = useState("");
	const [copied, setCopied] = useState(false);

	const { isConnected } = useWalletInfo();
	const { tokenInfo } = useV3TokenMeta();
	const {
		balance: tokenBalance,
		isLoading: isLoadingBalance,
		refresh: refreshBalance,
	} = useV3TokenBalance();
	const {
		step,
		isProcessing,
		error,
		payload,
		txResult,
		taxAmount,
		estimateReceive,
		executeTransfer,
		resetState,
		clearError,
	} = useV3TransferFlow();

	const walletChainId = useChainId();
	const receive = estimateReceive(amount);

	const handleRecipientChange = (value: string) => {
		if (error) clearError();
		if (step === "success" || step === "error") resetState();
		setRecipient(value);
	};

	const handleAmountChange = (value: string) => {
		if (error) clearError();
		if (step === "success" || step === "error") resetState();
		setAmount(value);
	};

	const handleCopyHash = async (hash: string) => {
		try {
			await navigator.clipboard.writeText(hash);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const displayTxHash = txResult ? getDisplayTxHash(txResult) : null;
	const explorerChainId =
		typeof txResult?.chainId === "number" && txResult.chainId > 0
			? txResult.chainId
			: walletChainId;

	const successTxExplorerUrl =
		step === "success" && displayTxHash
			? getTransactionExplorerUrl(explorerChainId, displayTxHash)
			: null;

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
			<div className="space-y-1">
				<h3 className="text-xl font-bold text-white">{t("title")}</h3>
				<p className="text-sm text-zinc-400">{t("description")}</p>
			</div>

			<div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30">
				<div className="flex items-center justify-between mb-2">
					<span className="text-sm text-zinc-400">
						{t("balance", { name: tokenInfo.name })}
					</span>
					<button
						type="button"
						onClick={refreshBalance}
						disabled={isLoadingBalance || !isConnected}
						className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
					>
						{isLoadingBalance ? tCommon("refreshing") : tCommon("refresh")}
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
				{Number(taxAmount) > 0 && (
					<p className="mt-2 text-xs text-zinc-500">
						{t("taxNotice", { tax: taxAmount, symbol: tokenInfo.symbol })}
					</p>
				)}
			</div>

			<div className="space-y-2">
				<label
					htmlFor="v3-recipient"
					className="block text-sm font-medium text-zinc-300"
				>
					{t("recipient")}
				</label>
				<input
					id="v3-recipient"
					type="text"
					value={recipient}
					onChange={(e) => handleRecipientChange(e.target.value)}
					placeholder="0x..."
					disabled={isProcessing}
					className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-600/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50"
				/>
			</div>

			<div className="space-y-2">
				<label
					htmlFor="v3-transfer-amount"
					className="block text-sm font-medium text-zinc-300"
				>
					{t("amount")}
				</label>
				<div className="relative">
					<input
						id="v3-transfer-amount"
						type="number"
						value={amount}
						onChange={(e) => handleAmountChange(e.target.value)}
						placeholder="0.0"
						min="0"
						step="any"
						disabled={isProcessing}
						className="w-full px-4 py-3 pr-16 bg-zinc-800/50 border border-zinc-600/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
					/>
					<button
						type="button"
						onClick={() => setAmount(tokenBalance)}
						disabled={!isConnected || isProcessing}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
					>
						{tCommon("max")}
					</button>
				</div>
			</div>

			{amount && Number(amount) > 0 && (
				<div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30 space-y-1 text-sm">
					<div className="flex justify-between">
						<span className="text-zinc-400">{t("sendAmount")}</span>
						<span className="text-white">
							{amount} {tokenInfo.symbol}
						</span>
					</div>
					{Number(taxAmount) > 0 && (
						<div className="flex justify-between">
							<span className="text-zinc-400">{t("tax")}</span>
							<span className="text-yellow-400">
								- {taxAmount} {tokenInfo.symbol}
							</span>
						</div>
					)}
					<div className="flex justify-between font-medium border-t border-zinc-700/50 pt-1">
						<span className="text-zinc-300">{t("estimatedReceive")}</span>
						<span className="text-white">
							{receive
								? `${receive} ${tokenInfo.symbol}`
								: t("amountMustExceedTax")}
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
					isProcessing ||
					!recipient ||
					!amount ||
					!isConnected ||
					!receive
				}
				className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/25"
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
						{step === "signing" && t("signing")}
						{step === "verifying" && t("verifying")}
						{step === "settling" && t("settling")}
					</span>
				) : (
					<span>{t("signAndTransfer", { symbol: tokenInfo.symbol })}</span>
				)}
			</button>

			{step === "success" && txResult && (
				<div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 space-y-2">
					<div className="flex items-center justify-between">
						<h4 className="text-sm font-medium text-green-400">
							{t("transferSuccess")}
						</h4>
						<button
							type="button"
							onClick={resetState}
							className="text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
						>
							{t("close")}
						</button>
					</div>
					{displayTxHash && (
						<div className="text-xs text-zinc-400">
							<div className="flex items-center gap-2 flex-wrap">
								<span className="text-zinc-500">{t("txHash")}</span>
								{successTxExplorerUrl ? (
									<a
										href={successTxExplorerUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="font-mono text-zinc-300 hover:text-indigo-400 underline-offset-2 hover:underline transition-colors"
										title={t("viewOnExplorer")}
									>
										{displayTxHash.slice(0, 10)}...
										{displayTxHash.slice(-8)}
									</a>
								) : (
									<span className="font-mono text-zinc-300">
										{displayTxHash.slice(0, 10)}...
										{displayTxHash.slice(-8)}
									</span>
								)}
								<button
									type="button"
									onClick={() => handleCopyHash(displayTxHash)}
									className="inline-flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
									title={t("copyFullHash")}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-3.5 w-3.5"
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
									<span className="text-green-400 text-xs">
										{tCommon("copied")}
									</span>
								)}
							</div>
						</div>
					)}
					<p className="text-xs text-green-400/80">{t("submittedHint")}</p>
				</div>
			)}

			{payload && step !== "success" && (
				<div className="bg-zinc-800/50 border border-zinc-600/50 rounded-xl p-4 space-y-2">
					<div className="flex items-center justify-between">
						<h4 className="text-sm font-medium text-yellow-400">
							{step === "verifying"
								? t("debugVerifying")
								: step === "settling"
									? t("debugSettling")
									: t("debugSigned")}
						</h4>
						<span className="text-xs text-zinc-500">{t("outputToConsole")}</span>
					</div>
					<div className="text-xs text-zinc-400 space-y-1">
						<p>
							<span className="text-zinc-500">From:</span>{" "}
							{payload.message.from.slice(0, 10)}...
							{payload.message.from.slice(-8)}
						</p>
						<p>
							<span className="text-zinc-500">To:</span>{" "}
							{payload.message.to.slice(0, 10)}...
							{payload.message.to.slice(-8)}
						</p>
						<p>
							<span className="text-zinc-500">Value:</span>{" "}
							{payload.message.value}
						</p>
						<p>
							<span className="text-zinc-500">Nonce:</span>{" "}
							{payload.message.nonce.slice(0, 18)}...
						</p>
					</div>
				</div>
			)}

			<p className="text-xs text-center text-zinc-500">{t("hint")}</p>
		</div>
	);
}
