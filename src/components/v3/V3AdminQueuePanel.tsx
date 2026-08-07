"use client";

import { useTranslations } from "next-intl";
import { useV3AdminQueue } from "@/hooks";
import { V3TicketStatus } from "@/lib/type";

const STATUS_COLOR: Record<V3TicketStatus, string> = {
	[V3TicketStatus.None]: "text-zinc-400",
	[V3TicketStatus.Pending]: "text-amber-400",
	[V3TicketStatus.Approved]: "text-emerald-400",
	[V3TicketStatus.Claimed]: "text-zinc-400",
	[V3TicketStatus.Cancelled]: "text-zinc-500",
	[V3TicketStatus.Rejected]: "text-red-400",
};

const STATUS_KEYS: Record<V3TicketStatus, string> = {
	[V3TicketStatus.None]: "None",
	[V3TicketStatus.Pending]: "Pending",
	[V3TicketStatus.Approved]: "Approved",
	[V3TicketStatus.Claimed]: "Claimed",
	[V3TicketStatus.Cancelled]: "Cancelled",
	[V3TicketStatus.Rejected]: "Rejected",
};

function shortAddr(addr: string) {
	return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function V3AdminQueuePanel() {
	const t = useTranslations("v3.adminQueuePanel");
	const tStatus = useTranslations("ticketStatus");
	const tCommon = useTranslations("common");
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
					<h3 className="text-lg font-bold text-white">{t("title")}</h3>
					<p className="text-sm text-zinc-400 mt-1">
						{t("description", { count: pendingTickets.length })}
					</p>
				</div>
				<button
					type="button"
					onClick={refresh}
					disabled={isLoading}
					className="text-xs text-violet-400 hover:text-violet-300 disabled:opacity-50"
				>
					{isLoading ? t("loading") : tCommon("refresh")}
				</button>
			</div>

			{error && (
				<div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
					<p className="text-sm text-red-400">{error}</p>
				</div>
			)}

			{isLoading && tickets.length === 0 ? (
				<p className="text-sm text-zinc-500 text-center py-8">
					{t("loadingQueue")}
				</p>
			) : tickets.length === 0 ? (
				<p className="text-sm text-zinc-500 text-center py-8">{t("empty")}</p>
			) : (
				<ul className="space-y-3 max-h-[28rem] overflow-y-auto">
					{tickets.map((ticket) => {
						const isPending = ticket.status === V3TicketStatus.Pending;
						return (
							<li
								key={ticket.ticketId}
								className="bg-zinc-800/40 border border-zinc-700/40 rounded-xl p-4 space-y-3"
							>
								<div className="flex items-center justify-between">
									<span className="text-sm font-semibold text-white">
										#{ticket.ticketId}
									</span>
									<span
										className={`text-xs font-medium ${STATUS_COLOR[ticket.status]}`}
									>
										{tStatus(STATUS_KEYS[ticket.status])}
									</span>
								</div>
								<div className="text-sm text-zinc-300 space-y-1">
									<p>{t("amount", { amount: ticket.amount })}</p>
									<p className="font-mono text-xs text-zinc-500">
										{t("owner", { address: shortAddr(ticket.owner) })}
									</p>
								</div>
								{isPending && (
									<div className="flex gap-2">
										<button
											type="button"
											disabled={isActing}
											onClick={() => approve(ticket.ticketId)}
											className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
										>
											{t("approve")}
										</button>
										<button
											type="button"
											disabled={isActing}
											onClick={() => reject(ticket.ticketId)}
											className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50"
										>
											{t("reject")}
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
