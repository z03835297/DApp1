"use client";

import { useState } from "react";
import { useWalletInfo, useTokenInfo, useUsdtBalance, useAllowance } from "@/hooks";

interface MintPanelProps {
  onSuccess?: () => void;
}

export default function MintPanel({ onSuccess }: MintPanelProps) {
  const [amount, setAmount] = useState("");

  // 使用自定义 hooks
  const { isConnected } = useWalletInfo();
  const { usdtInfo, tokenInfo } = useTokenInfo();
  const { balance: usdtBalance, isLoading: isLoadingBalance, refresh: refreshBalance } = useUsdtBalance();
  const { 
    isApproving, 
    isApproved, 
    isMinting, 
    approve, 
    mint, 
    reset,
    error 
  } = useAllowance();

  // 当金额改变时重置授权状态
  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (isApproved) {
      reset();
    }
  };

  // Step 1: 授权（传递余额进行验证）
  const handleApprove = async () => {
    if (!amount) return;
    await approve(amount, usdtBalance);
  };

  // Step 2: Mint
  const handleMint = async () => {
    if (!amount) return;
    const success = await mint(amount);
    if (success) {
      // Mint 成功后刷新余额并清空输入
      await refreshBalance();
      setAmount("");
      onSuccess?.();
    }
  };

  // 设置最大值（使用 USDT 余额）
  const handleSetMax = () => {
    setAmount(usdtBalance);
  };

  return (
    <div className="space-y-6">
      {/* 标题和描述 */}
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-white">Mint Tokens</h3>
        <p className="text-sm text-zinc-400">铸造新的代币到你的钱包</p>
      </div>

      {/* 余额显示 */}
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
              Number(usdtBalance).toLocaleString(undefined, { maximumFractionDigits: 6 })
            )}
          </span>
          <span className="text-sm text-zinc-400">{usdtInfo.symbol}</span>
        </div>
        <div className="mt-3 pt-3 border-t border-zinc-700/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">可兑换 {tokenInfo.name}</span>
            <span className="text-xs text-zinc-500">1:1 兑换</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-semibold text-emerald-400">
              {isLoadingBalance ? (
                <span className="inline-block w-16 h-5 bg-zinc-700 rounded animate-pulse" />
              ) : !isConnected ? (
                "-"
              ) : (
                Number(usdtBalance).toLocaleString(undefined, { maximumFractionDigits: 6 })
              )}
            </span>
            <span className="text-sm text-zinc-400">{tokenInfo.symbol}</span>
          </div>
        </div>
      </div>

      {/* 金额输入 */}
      <div className="space-y-2">
        <label htmlFor="mint-amount" className="block text-sm font-medium text-zinc-300">
          数量
        </label>
        <div className="relative">
          <input
            id="mint-amount"
            type="number"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0.0"
            min="0"
            step="any"
            disabled={isApproving || isMinting}
            className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-600/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSetMax}
            disabled={!isConnected || isApproving || isMinting}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            MAX
          </button>
        </div>
        {amount && (
          <p className="text-xs text-zinc-500">
            你将获得 <span className="text-emerald-400 font-medium">{Number(amount).toLocaleString(undefined, { maximumFractionDigits: 6 })}</span> {tokenInfo.symbol}
          </p>
        )}
      </div>

      {/* 错误信息显示 */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* 两步操作按钮 */}
      <div className="space-y-3">
        {/* Step 1: 授权按钮 */}
        <button
          type="button"
          onClick={handleApprove}
          disabled={isApproving || isApproved || !amount || !isConnected}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-3 ${
            isApproved
              ? "bg-emerald-600/20 border-2 border-emerald-500 text-emerald-400"
              : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/25 disabled:opacity-50"
          }`}
        >
          {/* Step 标识 */}
          <span className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
            isApproved 
              ? "bg-emerald-500 text-white" 
              : "bg-white/20 text-white"
          }`}>
            {isApproved ? "✓" : "1"}
          </span>
          
          {isApproving ? (
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
              授权中...
            </span>
          ) : isApproved ? (
            <span>授权完成</span>
          ) : (
            <span>授权 {usdtInfo.symbol}</span>
          )}
        </button>

        {/* Step 2: Mint 按钮 */}
        <button
          type="button"
          onClick={handleMint}
          disabled={isMinting || !isApproved || !amount || !isConnected}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-3 ${
            !isApproved
              ? "bg-zinc-700 text-zinc-400 opacity-50"
              : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25"
          }`}
        >
          {/* Step 标识 */}
          <span className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
            isApproved 
              ? "bg-white/20 text-white" 
              : "bg-zinc-600 text-zinc-400"
          }`}>
            2
          </span>
          
          {isMinting ? (
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
              Minting...
            </span>
          ) : (
            <span>Mint {tokenInfo.symbol}</span>
          )}
        </button>
      </div>

      {/* 提示信息 */}
      <p className="text-xs text-center text-zinc-500">
        Step 1: 授权 USDT → Step 2: Mint 代币
      </p>
    </div>
  );
}

