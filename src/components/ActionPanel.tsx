"use client";

import { useState } from "react";
import { useWalletInfo, useTokenInfo, useUsdtBalance } from "@/hooks";

type ActionType = "mint" | "withdraw";

export default function ActionPanel() {
  const [activeTab, setActiveTab] = useState<ActionType>("mint");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 使用自定义 hooks
  const { isConnected } = useWalletInfo();
  const { usdtInfo, tokenInfo } = useTokenInfo();
  const { balance: usdtBalance, isLoading: isLoadingBalance, refresh: refreshBalance } = useUsdtBalance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    setIsLoading(true);
    try {
      // TODO: 在这里实现合约交互逻辑
      console.log(`${activeTab} amount:`, amount);
      
      // 示例：使用 ethers 调用合约
      // const provider = new ethers.BrowserProvider(window.ethereum);
      // const signer = await provider.getSigner();
      // const contract = new ethers.Contract(CONTRACT_ADDRESSES.TOKEN_CONTRACT, TOKEN_ABI, signer);
      // if (activeTab === "mint") {
      //   await contract.mint(await signer.getAddress(), ethers.parseEther(amount));
      // } else {
      //   await contract.withdraw(ethers.parseEther(amount));
      // }
    } catch (error) {
      console.error(`${activeTab} failed:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  // 设置最大值（使用 USDT 余额）
  const handleSetMax = () => {
    setAmount(usdtBalance);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl border border-zinc-700/50 shadow-2xl overflow-hidden">
        {/* Tab 切换 */}
        <div className="flex border-b border-zinc-700/50">
          <button
            onClick={() => setActiveTab("mint")}
            type="button"
            className={`flex-1 py-4 px-6 text-sm font-semibold transition-all duration-200 ${
              activeTab === "mint"
                ? "text-emerald-400 bg-emerald-500/10 border-b-2 border-emerald-400"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/30"
            }`}
          >
            Mint
          </button>
          <button
            onClick={() => setActiveTab("withdraw")}
            type="button"
            className={`flex-1 py-4 px-6 text-sm font-semibold transition-all duration-200 ${
              activeTab === "withdraw"
                ? "text-amber-400 bg-amber-500/10 border-b-2 border-amber-400"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/30"
            }`}
          >
            Withdraw
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 标题和描述 */}
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">
              {activeTab === "mint" ? "Mint Tokens" : "Withdraw Tokens"}
            </h3>
            <p className="text-sm text-zinc-400">
              {activeTab === "mint"
                ? "铸造新的代币到你的钱包"
                : "从合约提取代币到你的钱包"}
            </p>
          </div>

          {/* 余额显示 - 仅在 Mint 时显示 */}
          {activeTab === "mint" && (
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
          )}

          {/* 金额输入 */}
          <div className="space-y-2">
            <label htmlFor="amount" className="block text-sm font-medium text-zinc-300">
              数量
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                min="0"
                step="any"
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-600/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              />
              <button
                type="button"
                onClick={handleSetMax}
                disabled={!isConnected || activeTab !== "mint"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                MAX
              </button>
            </div>
            {activeTab === "mint" && amount && (
              <p className="text-xs text-zinc-500">
                你将获得 <span className="text-emerald-400 font-medium">{Number(amount).toLocaleString(undefined, { maximumFractionDigits: 6 })}</span> {tokenInfo.symbol}
              </p>
            )}
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={isLoading || !amount}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              activeTab === "mint"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25"
                : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
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
                处理中...
              </span>
            ) : activeTab === "mint" ? (
              "Mint"
            ) : (
              "Withdraw"
            )}
          </button>

          {/* 提示信息 */}
          <p className="text-xs text-center text-zinc-500">
            请确保钱包已连接且有足够的 Gas 费用
          </p>
        </form>
      </div>
    </div>
  );
}
