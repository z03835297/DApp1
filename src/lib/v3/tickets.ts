import type { Contract } from "ethers";
import { formatUnits } from "ethers";
import { V3TicketStatus } from "@/lib/type";

export interface V3Ticket {
	ticketId: string;
	owner: string;
	amount: string;
	rawAmount: bigint;
	status: V3TicketStatus;
}

/**
 * 通过 nextTicketId + getTicket 拉取票据列表（避免 eth_getLogs 区块范围限制）
 * @param ownerFilter 若提供，只返回该 owner 的票据
 */
export async function fetchTicketsFromChain(
	queueContract: Contract,
	decimals: number,
	ownerFilter?: string,
): Promise<V3Ticket[]> {
	const nextId = Number(await queueContract.nextTicketId());
	if (!Number.isFinite(nextId) || nextId <= 0) return [];

	const ownerLower = ownerFilter?.toLowerCase();
	const results: V3Ticket[] = [];

	// nextTicketId 指向下一张未创建 ID；已有票据为 [0, nextId) 或 [1, nextId)
	// 从 0 扫到 nextId-1，status=None 的会跳过
	for (let id = 0; id < nextId; id++) {
		const ticket = await queueContract.getTicket(id);
		const owner = ticket.owner as string;
		const amount = ticket.amount as bigint;
		const status = Number(ticket.status) as V3TicketStatus;

		if (status === V3TicketStatus.None) continue;
		if (ownerLower && owner.toLowerCase() !== ownerLower) continue;

		results.push({
			ticketId: String(id),
			owner,
			amount: formatUnits(amount, decimals),
			rawAmount: amount,
			status,
		});
	}

	results.sort((a, b) => Number(b.ticketId) - Number(a.ticketId));
	return results;
}
