"use client";

import { useState, useEffect, useCallback } from "react";
import { Contract } from "ethers";
import { useWalletInfo } from "./useWalletInfo";
import {
	useV3RedeemQueueContract,
	useV3TokenContract,
} from "./useV3Contract";
import { getErrorMessage } from "@/lib/v3/errors";
import {
	fetchTicketsFromChain,
	type V3Ticket,
} from "@/lib/v3/tickets";
import { useTranslations } from "next-intl";

export type { V3Ticket };

export interface UseV3RedeemTicketsReturn {
	tickets: V3Ticket[];
	isLoading: boolean;
	isActing: boolean;
	error: string | null;
	refresh: () => Promise<void>;
	claim: (ticketId: string) => Promise<boolean>;
	cancel: (ticketId: string) => Promise<boolean>;
	clearError: () => void;
}

/**
 * 用户自己的赎回票据列表（事件扫描 + getTicket 兜底）
 */
export function useV3RedeemTickets(): UseV3RedeemTicketsReturn {
	const t = useTranslations("errors");
	const [tickets, setTickets] = useState<V3Ticket[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isActing, setIsActing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { address, getSigner, isConnected } = useWalletInfo();
	const {
		contract: queueContract,
		address: queueAddress,
		abi: queueAbi,
		isReady,
	} = useV3RedeemQueueContract();
	const { contract: tokenContract } = useV3TokenContract();

	const clearError = useCallback(() => setError(null), []);

	const refresh = useCallback(async () => {
		if (!isReady || !queueContract || !address || !isConnected) {
			setTickets([]);
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const dec = tokenContract
				? Number(await tokenContract.decimals())
				: 6;

			// 用 nextTicketId + getTicket，避免 eth_getLogs 从 0 扫到 latest 被 RPC 限流
			const results = await fetchTicketsFromChain(
				queueContract,
				dec,
				address,
			);
			setTickets(results);
		} catch (err) {
			console.error("Failed to fetch redeem tickets:", err);
			setError(getErrorMessage(err, t("loadTicketsFailed")));
		} finally {
			setIsLoading(false);
		}
	}, [queueContract, tokenContract, address, isConnected, isReady, t]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const claim = useCallback(
		async (ticketId: string): Promise<boolean> => {
			if (!queueAddress || !queueAbi) {
				setError(t("queueNotInit"));
				return false;
			}

			setIsActing(true);
			setError(null);

			try {
				const signer = await getSigner();
				if (!signer) {
					setError(t("noSigner"));
					return false;
				}
				const queue = new Contract(queueAddress, queueAbi, signer);
				const tx = await queue.claim(ticketId);
				await tx.wait(2);
				await refresh();
				return true;
			} catch (err) {
				console.error("claim failed:", err);
				setError(getErrorMessage(err, t("claimFailed")));
				return false;
			} finally {
				setIsActing(false);
			}
		},
		[queueAddress, queueAbi, getSigner, refresh, t],
	);

	const cancel = useCallback(
		async (ticketId: string): Promise<boolean> => {
			if (!queueAddress || !queueAbi) {
				setError(t("queueNotInit"));
				return false;
			}

			setIsActing(true);
			setError(null);

			try {
				const signer = await getSigner();
				if (!signer) {
					setError(t("noSigner"));
					return false;
				}
				const queue = new Contract(queueAddress, queueAbi, signer);
				const tx = await queue.cancel(ticketId);
				await tx.wait(2);
				await refresh();
				return true;
			} catch (err) {
				console.error("cancel failed:", err);
				setError(getErrorMessage(err, t("cancelFailed")));
				return false;
			} finally {
				setIsActing(false);
			}
		},
		[queueAddress, queueAbi, getSigner, refresh, t],
	);

	return {
		tickets,
		isLoading,
		isActing,
		error,
		refresh,
		claim,
		cancel,
		clearError,
	};
}
