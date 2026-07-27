"use client";

import { useState, useEffect, useCallback } from "react";
import { Contract } from "ethers";
import { useWalletInfo } from "./useWalletInfo";
import {
	useV3RedeemQueueContract,
	useV3TokenContract,
} from "./useV3Contract";
import { V3TicketStatus } from "@/lib/type";
import { getErrorMessage } from "@/lib/v3/errors";
import {
	fetchTicketsFromChain,
	type V3Ticket,
} from "@/lib/v3/tickets";

export interface UseV3AdminQueueReturn {
	tickets: V3Ticket[];
	pendingTickets: V3Ticket[];
	isLoading: boolean;
	isActing: boolean;
	error: string | null;
	refresh: () => Promise<void>;
	approve: (ticketId: string) => Promise<boolean>;
	reject: (ticketId: string) => Promise<boolean>;
	clearError: () => void;
}

/**
 * Admin 视角：全量赎回队列 + approve / reject
 */
export function useV3AdminQueue(): UseV3AdminQueueReturn {
	const [tickets, setTickets] = useState<V3Ticket[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isActing, setIsActing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { getSigner, isConnected } = useWalletInfo();
	const {
		contract: queueContract,
		address: queueAddress,
		abi: queueAbi,
		isReady,
	} = useV3RedeemQueueContract();
	const { contract: tokenContract } = useV3TokenContract();

	const clearError = useCallback(() => setError(null), []);

	const refresh = useCallback(async () => {
		if (!isReady || !queueContract || !isConnected) {
			setTickets([]);
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const dec = tokenContract
				? Number(await tokenContract.decimals())
				: 6;

			// 用 nextTicketId + getTicket，避免 eth_getLogs 区块范围限制
			const results = await fetchTicketsFromChain(queueContract, dec);
			setTickets(results);
		} catch (err) {
			console.error("Failed to fetch admin queue:", err);
			setError(getErrorMessage(err, "加载审批队列失败"));
		} finally {
			setIsLoading(false);
		}
	}, [queueContract, tokenContract, isConnected, isReady]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const approve = useCallback(
		async (ticketId: string): Promise<boolean> => {
			if (!queueAddress || !queueAbi) {
				setError("RedeemQueue 未初始化");
				return false;
			}

			setIsActing(true);
			setError(null);

			try {
				const signer = await getSigner();
				if (!signer) {
					setError("无法获取签名器，请确保钱包已连接");
					return false;
				}
				const queue = new Contract(queueAddress, queueAbi, signer);
				const tx = await queue.approve(ticketId);
				await tx.wait(2);
				await refresh();
				return true;
			} catch (err) {
				console.error("approve failed:", err);
				setError(getErrorMessage(err, "Approve 失败"));
				return false;
			} finally {
				setIsActing(false);
			}
		},
		[queueAddress, queueAbi, getSigner, refresh],
	);

	const reject = useCallback(
		async (ticketId: string): Promise<boolean> => {
			if (!queueAddress || !queueAbi) {
				setError("RedeemQueue 未初始化");
				return false;
			}

			setIsActing(true);
			setError(null);

			try {
				const signer = await getSigner();
				if (!signer) {
					setError("无法获取签名器，请确保钱包已连接");
					return false;
				}
				const queue = new Contract(queueAddress, queueAbi, signer);
				const tx = await queue.reject(ticketId);
				await tx.wait(2);
				await refresh();
				return true;
			} catch (err) {
				console.error("reject failed:", err);
				setError(getErrorMessage(err, "Reject 失败"));
				return false;
			} finally {
				setIsActing(false);
			}
		},
		[queueAddress, queueAbi, getSigner, refresh],
	);

	const pendingTickets = tickets.filter(
		(t) => t.status === V3TicketStatus.Pending,
	);

	return {
		tickets,
		pendingTickets,
		isLoading,
		isActing,
		error,
		refresh,
		approve,
		reject,
		clearError,
	};
}
