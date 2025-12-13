"use client";

import { useState } from "react";
import { useWalletInfo, useTokenInfo, useTokenBalance, useWithdraw } from "@/hooks";

interface WithdrawPanelProps {
  onSuccess?: () => void;
}

export default function WithdrawPanel({ onSuccess }: WithdrawPanelProps) {
  const [amount, setAmount] = useState("");

  // 使用自定义 hooks
  const { isConnected } = useWalletInfo();
  const { usdtInfo, tokenInfo } = useTokenInfo();
  const { balance: tokenBalance, isLoading: isLoadingBalance, refresh: refreshBalance } = useTokenBalance();
  const { 
    isWithdrawing, 
    withdraw, 
    error,
    clearError 
  } = useWithdraw();

  // 当金额改变时清除错误
  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (error) {
      clearError();
    }
  };

  // 执行 Withdraw（传递余额进行验证）
  const handleWithdraw = async () => {
    if (!amount) return;
    const success = await withdraw(amount, tokenBalance);
    if (success) {
      // Withdraw 成功后刷新余额并清空输入
      await refreshBalance();
      setAmount("");
      onSuccess?.();
    }
  };

  // 设置最大值（使用 Token 余额）
  const handleSetMax = () => {
    setAmount(tokenBalance);
  };

  return (
    <div className="space-y-6">
      {/* 标题和描述 */}
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-white">Withdraw {usdtInfo.symbol}</h3>
        <p className="text-sm text-zinc-400">将代币兑换回 {usdtInfo.symbol}</p>
      </div>

      {/* 余额显示 */}
      <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-400">{tokenInfo.name} 余额</span>
          <button
            type="button"
            onClick={refreshBalance}
            disabled={isLoadingBalance || !isConnected}
            className="text-xs text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50"
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
              Number(tokenBalance).toLocaleString(undefined, { maximumFractionDigits: 6 })
            )}
          </span>
          <span className="text-sm text-zinc-400">{tokenInfo.symbol}</span>
        </div>
        <div className="mt-3 pt-3 border-t border-zinc-700/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">可兑换 {usdtInfo.name}</span>
            <span className="text-xs text-zinc-500">1:1 兑换</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-semibold text-amber-400">
              {isLoadingBalance ? (
                <span className="inline-block w-16 h-5 bg-zinc-700 rounded animate-pulse" />
              ) : !isConnected ? (
                "-"
              ) : (
                Number(tokenBalance).toLocaleString(undefined, { maximumFractionDigits: 6 })
              )}
            </span>
            <span className="text-sm text-zinc-400">{usdtInfo.symbol}</span>
          </div>
        </div>
      </div>

      {/* 金额输入 */}
      <div className="space-y-2">
        <label htmlFor="withdraw-amount" className="block text-sm font-medium text-zinc-300">
          数量
        </label>
        <div className="relative">
          <input
            id="withdraw-amount"
            type="number"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0.0"
            min="0"
            step="any"
            disabled={isWithdrawing}
            className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-600/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={handleSetMax}
            disabled={!isConnected || isWithdrawing}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            MAX
          </button>
        </div>
        {amount && (
          <p className="text-xs text-zinc-500">
            你将获得 <span className="text-amber-400 font-medium">{Number(amount).toLocaleString(undefined, { maximumFractionDigits: 6 })}</span> {usdtInfo.symbol}
          </p>
        )}
      </div>

      {/* 错误信息显示 */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Withdraw 按钮 */}
      <button
        type="button"
        onClick={handleWithdraw}
        disabled={isWithdrawing || !amount || !isConnected}
        className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 disabled:opacity-50"
      >
        {isWithdrawing ? (
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
            Withdrawing...
          </span>
        ) : (
          <span>Withdraw {tokenInfo.symbol}</span>
        )}
      </button>

      {/* 提示信息 */}
      <p className="text-xs text-center text-zinc-500">
        将 {tokenInfo.symbol} 兑换回 {usdtInfo.symbol}，无需授权
      </p>
    </div>
  );
}
