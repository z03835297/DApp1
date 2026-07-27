"use client";

import { useV3AdminQueue } from "@/hooks";
import { V3TicketStatus } from "@/lib/type";

const STATUS_LABEL: Record<V3TicketStatus, string> = {
	[V3TicketStatus.None]: "None",
	[V3TicketStatus.Pending]: "Pending",
	[V3TicketStatus.Approved]: "Approved",
	[V3TicketStatus.Claimed]: "Claimed",
	[V3TicketStatus.Cancelled]: "Cancelled",
	[V3TicketStatus.Rejected]: "Rejected",
};

const STATUS_COLOR: Record<V3TicketStatus, string> = {
	[V3TicketStatus.None]: "text-zinc-400",
	[V3TicketStatus.Pending]: "text-amber-400",
	[V3TicketStatus.Approved]: "text-emerald-400",
	[V3TicketStatus.Claimed]: "text-zinc-400",
	[V3TicketStatus.Cancelled]: "text-zinc-500",
	[V3TicketStatus.Rejected]: "text-red-400",
};

function shortAddr(addr: string) {
	return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function V3AdminQueuePanel() {
	const {
		tickets,
		pendingTickets,
		isLoading,
		isActing,
		error,
		refresh,
		approve,
		reject,
	} = useV3AdminQueue();

	return (
		<div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl border border-zinc-700/50 p-6 space-y-6">
			<div className="flex items-start justify-between">
				<div>
					<h3 className="text-lg font-bold text-white">审批队列</h3>
					<p className="text-sm text-zinc-400 mt-1">
						Pending 票据可 approve / reject（当前 Pending：
						{pendingTickets.length}）
					</p>
				</div>
				<button
					type="button"
					onClick={refresh}
					disabled={isLoading}
					className="text-xs text-violet-400 hover:text-violet-300 disabled:opacity-50"
				>
					{isLoading ? "加载中..." : "刷新"}
				</button>
			</div>

			{error && (
				<div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
					<p className="text-sm text-red-400">{error}</p>
				</div>
			)}

			{isLoading && tickets.length === 0 ? (
				<p className="text-sm text-zinc-500 text-center py-8">加载队列中...</p>
			) : tickets.length === 0 ? (
				<p className="text-sm text-zinc-500 text-center py-8">暂无票据</p>
			) : (
				<ul className="space-y-3 max-h-[28rem] overflow-y-auto">
					{tickets.map((t) => {
						const isPending = t.status === V3TicketStatus.Pending;
						return (
							<li
								key={t.ticketId}
								className="bg-zinc-800/40 border border-zinc-700/40 rounded-xl p-4 space-y-3"
							>
								<div className="flex items-center justify-between">
									<span className="text-sm font-semibold text-white">
										#{t.ticketId}
									</span>
									<span
										className={`text-xs font-medium ${STATUS_COLOR[t.status]}`}
									>
										{STATUS_LABEL[t.status]}
									</span>
								</div>
								<div className="text-sm text-zinc-300 space-y-1">
									<p>金额：{t.amount}</p>
									<p className="font-mono text-xs text-zinc-500">
										Owner：{shortAddr(t.owner)}
									</p>
								</div>
								{isPending && (
									<div className="flex gap-2">
										<button
											type="button"
											disabled={isActing}
											onClick={() => approve(t.ticketId)}
											className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
										>
											Approve
										</button>
										<button
											type="button"
											disabled={isActing}
											onClick={() => reject(t.ticketId)}
											className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50"
										>
											Reject
										</button>
									</div>
								)}
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
