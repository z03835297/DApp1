"use client";

import { useTranslations } from "next-intl";
import { useV3RedeemTickets } from "@/hooks";
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

export default function V3RedeemTicketList() {
	const t = useTranslations("v3.ticketList");
	const tStatus = useTranslations("ticketStatus");
	const tCommon = useTranslations("common");
	const {
		tickets,
		isLoading,
		isActing,
		error,
		refresh,
		claim,
		cancel,
	} = useV3RedeemTickets();

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between gap-4">
				<div className="space-y-1">
					<h3 className="text-xl font-bold text-white">{t("title")}</h3>
					<p className="text-sm text-zinc-400">{t("description")}</p>
				</div>
				<button
					type="button"
					onClick={refresh}
					disabled={isLoading}
					className="text-xs text-amber-400 hover:text-amber-300 disabled:opacity-50"
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
					{t("loadingTickets")}
				</p>
			) : tickets.length === 0 ? (
				<p className="text-sm text-zinc-500 text-center py-8">{t("empty")}</p>
			) : (
				<ul className="space-y-3">
					{tickets.map((ticket) => {
						const canClaim = ticket.status === V3TicketStatus.Approved;
						const canCancel =
							ticket.status === V3TicketStatus.Pending ||
							ticket.status === V3TicketStatus.Approved;

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
								<p className="text-sm text-zinc-300">
									{t("amount", { amount: ticket.amount })}
								</p>
								{(canClaim || canCancel) && (
									<div className="flex gap-2">
										{canClaim && (
											<button
												type="button"
												disabled={isActing}
												onClick={() => claim(ticket.ticketId)}
												className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
											>
												{t("claim")}
											</button>
										)}
										{canCancel && (
											<button
												type="button"
												disabled={isActing}
												onClick={() => cancel(ticket.ticketId)}
												className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-zinc-600 hover:bg-zinc-500 disabled:opacity-50"
											>
												{t("cancel")}
											</button>
										)}
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
