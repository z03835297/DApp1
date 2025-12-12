"use client";

import { useState } from "react";
import MintPanel from "./MintPanel";
import WithdrawPanel from "./WithdrawPanel";

type ActionType = "mint" | "withdraw";

// 成功弹窗组件
function SuccessModal({ 
  isOpen, 
  onClose, 
  actionType 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  actionType: ActionType;
}) {
  if (!isOpen) return null;

  const isMint = actionType === "mint";
  const title = isMint ? "Mint 成功！" : "Withdraw 成功！";
  const message = isMint 
    ? "代币已成功铸造到你的钱包" 
    : "代币已成功兑换回 USDT";
  const bgColor = isMint ? "from-emerald-500 to-teal-500" : "from-amber-500 to-orange-500";
  const iconBg = isMint ? "bg-emerald-500/20" : "bg-amber-500/20";
  const iconColor = isMint ? "text-emerald-400" : "text-amber-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <button 
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
        onClick={onClose}
        aria-label="关闭弹窗"
      />
      
      {/* 弹窗内容 */}
      <div className="relative bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl border border-zinc-700/50 shadow-2xl p-8 max-w-sm mx-4 animate-in fade-in zoom-in duration-200">
        {/* 成功图标 */}
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${iconBg} flex items-center justify-center`}>
          <svg 
            className={`w-8 h-8 ${iconColor}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <title>成功</title>
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>
        
        {/* 标题 */}
        <h3 className="text-xl font-bold text-white text-center mb-2">
          {title}
        </h3>
        
        {/* 描述 */}
        <p className="text-sm text-zinc-400 text-center mb-6">
          {message}
        </p>
        
        {/* 关闭按钮 */}
        <button
          type="button"
          onClick={onClose}
          className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 bg-gradient-to-r ${bgColor} hover:opacity-90 shadow-lg`}
        >
          确定
        </button>
      </div>
    </div>
  );
}

export default function ActionPanel() {
  const [activeTab, setActiveTab] = useState<ActionType>("mint");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successAction, setSuccessAction] = useState<ActionType>("mint");

  const handleSuccess = (action: ActionType) => {
    setSuccessAction(action);
    setShowSuccess(true);
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
        <div className="p-6">
          {activeTab === "mint" 
            ? <MintPanel onSuccess={() => handleSuccess("mint")} /> 
            : <WithdrawPanel onSuccess={() => handleSuccess("withdraw")} />
          }
        </div>
      </div>

      {/* 成功弹窗 */}
      <SuccessModal 
        isOpen={showSuccess} 
        onClose={() => setShowSuccess(false)} 
        actionType={successAction}
      />
    </div>
  );
}
