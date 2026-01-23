"use client";

import { useState } from "react";
import MintPanel from "./MintPanel";
import WithdrawPanel from "./WithdrawPanel";
import TransferPanel from "./TransferPanel";
import { useVersion } from "@/context";
import { hasFeature } from "@/lib/router";
import type { Feature } from "@/lib/type";

type ActionType = Feature;

// Tab 配置
const TAB_CONFIG: Record<Feature, { label: string; activeColor: string; bgColor: string; borderColor: string }> = {
  mint: {
    label: "Mint",
    activeColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-400",
  },
  withdraw: {
    label: "Withdraw",
    activeColor: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-400",
  },
  transfer: {
    label: "Transfer",
    activeColor: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-400",
  },
};

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

  const config: Record<ActionType, { title: string; message: string; bgColor: string; iconBg: string; iconColor: string }> = {
    mint: {
      title: "Mint 成功！",
      message: "代币已成功铸造到你的钱包",
      bgColor: "from-emerald-500 to-teal-500",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-400",
    },
    withdraw: {
      title: "Withdraw 成功！",
      message: "代币已成功兑换回 USDT",
      bgColor: "from-amber-500 to-orange-500",
      iconBg: "bg-amber-500/20",
      iconColor: "text-amber-400",
    },
    transfer: {
      title: "Transfer 成功！",
      message: "代币已成功转账",
      bgColor: "from-indigo-500 to-purple-500",
      iconBg: "bg-indigo-500/20",
      iconColor: "text-indigo-400",
    },
  };

  const { title, message, bgColor, iconBg, iconColor } = config[actionType];

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
  const version = useVersion();
  const [activeTab, setActiveTab] = useState<ActionType>("mint");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successAction, setSuccessAction] = useState<ActionType>("mint");

  // 获取当前版本可用的功能
  const allFeatures: Feature[] = ["mint", "withdraw", "transfer"];
  const availableFeatures = allFeatures.filter((feature) =>
    hasFeature(version, feature)
  );

  // 计算有效的 tab（如果当前 tab 不可用，使用第一个可用的）
  const effectiveTab = availableFeatures.includes(activeTab)
    ? activeTab
    : availableFeatures[0];

  const handleSuccess = (action: ActionType) => {
    setSuccessAction(action);
    setShowSuccess(true);
  };

  // 渲染对应的面板
  const renderPanel = () => {
    switch (effectiveTab) {
      case "mint":
        return <MintPanel onSuccess={() => handleSuccess("mint")} />;
      case "withdraw":
        return <WithdrawPanel onSuccess={() => handleSuccess("withdraw")} />;
      case "transfer":
        return <TransferPanel onSuccess={() => handleSuccess("transfer")} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl border border-zinc-700/50 shadow-2xl overflow-hidden">
        {/* Tab 切换 */}
        <div className="flex border-b border-zinc-700/50">
          {availableFeatures.map((feature) => {
            const config = TAB_CONFIG[feature];
            const isActive = effectiveTab === feature;

            return (
              <button
                key={feature}
                onClick={() => setActiveTab(feature)}
                type="button"
                className={`flex-1 py-4 px-6 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? `${config.activeColor} ${config.bgColor} border-b-2 ${config.borderColor}`
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/30"
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>

        {/* 表单内容 */}
        <div className="p-6">{renderPanel()}</div>
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
