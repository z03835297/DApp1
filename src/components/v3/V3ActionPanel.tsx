"use client";

import { useState } from "react";
import V3MintPanel from "./V3MintPanel";
import V3TransferPanel from "./V3TransferPanel";
import V3RedeemPanel from "./V3RedeemPanel";
import V3RedeemTicketList from "./V3RedeemTicketList";

type V3Tab = "mint" | "transfer" | "redeem" | "tickets";

const TABS: { key: V3Tab; label: string; activeColor: string; bgColor: string; borderColor: string }[] = [
	{
		key: "mint",
		label: "Mint",
		activeColor: "text-emerald-400",
		bgColor: "bg-emerald-500/10",
		borderColor: "border-emerald-400",
	},
	{
		key: "transfer",
		label: "Transfer",
		activeColor: "text-indigo-400",
		bgColor: "bg-indigo-500/10",
		borderColor: "border-indigo-400",
	},
	{
		key: "redeem",
		label: "Redeem",
		activeColor: "text-amber-400",
		bgColor: "bg-amber-500/10",
		borderColor: "border-amber-400",
	},
	{
		key: "tickets",
		label: "Tickets",
		activeColor: "text-cyan-400",
		bgColor: "bg-cyan-500/10",
		borderColor: "border-cyan-400",
	},
];

function SuccessModal({
	isOpen,
	onClose,
	actionType,
}: {
	isOpen: boolean;
	onClose: () => void;
	actionType: V3Tab;
}) {
	if (!isOpen) return null;

	const titles: Record<V3Tab, string> = {
		mint: "Mint 成功！",
		transfer: "Transfer 成功！",
		redeem: "Redeem 已提交！",
		tickets: "操作成功！",
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<button
				type="button"
				className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
				onClick={onClose}
				aria-label="关闭弹窗"
			/>
			<div className="relative bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl border border-zinc-700/50 shadow-2xl p-8 max-w-sm mx-4">
				<h3 className="text-xl font-bold text-white text-center mb-2">
					{titles[actionType]}
				</h3>
				<p className="text-sm text-zinc-400 text-center mb-6">
					交易已确认，请刷新余额查看结果
				</p>
				<button
					type="button"
					onClick={onClose}
					className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90"
				>
					确定
				</button>
			</div>
		</div>
	);
}

export default function V3ActionPanel() {
	const [activeTab, setActiveTab] = useState<V3Tab>("mint");
	const [showSuccess, setShowSuccess] = useState(false);
	const [successAction, setSuccessAction] = useState<V3Tab>("mint");

	const handleSuccess = (action: V3Tab) => {
		setSuccessAction(action);
		setShowSuccess(true);
	};

	const renderPanel = () => {
		switch (activeTab) {
			case "mint":
				return <V3MintPanel onSuccess={() => handleSuccess("mint")} />;
			case "transfer":
				return <V3TransferPanel onSuccess={() => handleSuccess("transfer")} />;
			case "redeem":
				return <V3RedeemPanel onSuccess={() => handleSuccess("redeem")} />;
			case "tickets":
				return <V3RedeemTicketList />;
			default:
				return null;
		}
	};

	return (
		<div className="w-full max-w-md mx-auto">
			<div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl border border-zinc-700/50 shadow-2xl overflow-hidden">
				<div className="flex border-b border-zinc-700/50">
					{TABS.map((tab) => {
						const isActive = activeTab === tab.key;
						return (
							<button
								key={tab.key}
								type="button"
								onClick={() => setActiveTab(tab.key)}
								className={`flex-1 py-3 px-2 text-xs sm:text-sm font-semibold transition-all ${
									isActive
										? `${tab.activeColor} ${tab.bgColor} border-b-2 ${tab.borderColor}`
										: "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/30"
								}`}
							>
								{tab.label}
							</button>
						);
					})}
				</div>
				<div className="p-6">{renderPanel()}</div>
			</div>

			<SuccessModal
				isOpen={showSuccess}
				onClose={() => setShowSuccess(false)}
				actionType={successAction}
			/>
		</div>
	);
}
