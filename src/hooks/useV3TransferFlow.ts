"use client";

import { useState, useCallback } from "react";
import { useV3TransferWithAuth } from "./useV3TransferWithAuth";
import { useV3TokenBalance } from "./useV3Balance";
import {
	verifyPayment,
	settlePayment,
	type PaymentRequest,
} from "@/lib/api";
import { resolveTransactionHashFromResult } from "@/lib/explorer";
import type {
	TransferStep,
	TransferResult,
	TransferParams,
	UseTransferFlowReturn,
} from "./useTransferFlow";
import { useTranslations } from "next-intl";

export interface UseV3TransferFlowReturn extends UseTransferFlowReturn {
	/** 固定税额（token 单位） */
	taxAmount: string;
	/** 预估对方实际到账（扣除固定税后） */
	estimateReceive: (amount: string) => string | null;
}

/**
 * V3 免 Gas 转账流程
 * 签名 -> 验证 -> 结算（服务端代付 Gas，走 NEXT_PUBLIC_API_URL）
 */
export function useV3TransferFlow(): UseV3TransferFlowReturn {
	const t = useTranslations("errors");
	const [step, setStep] = useState<TransferStep>("idle");
	const [apiError, setApiError] = useState<string | null>(null);
	const [txResult, setTxResult] = useState<TransferResult | null>(null);

	const { balance: tokenBalance, refresh: refreshBalance } = useV3TokenBalance();
	const {
		signTransferAuth,
		payload,
		taxAmount,
		error: signError,
		clearError: clearSignError,
		clearPayload,
	} = useV3TransferWithAuth();

	const isProcessing =
		step === "signing" || step === "verifying" || step === "settling";

	const error = signError || apiError;

	const estimateReceive = useCallback(
		(amount: string): string | null => {
			const num = Number(amount);
			if (!amount || Number.isNaN(num) || num <= 0) return null;
			const receive = num - Number(taxAmount);
			if (receive <= 0) return null;
			return receive.toString();
		},
		[taxAmount],
	);

	const resetState = useCallback(() => {
		setStep("idle");
		setApiError(null);
		setTxResult(null);
		clearPayload();
	}, [clearPayload]);

	const clearError = useCallback(() => {
		clearSignError();
		setApiError(null);
	}, [clearSignError]);

	const executeTransfer = useCallback(
		async (params: TransferParams): Promise<boolean> => {
			const { recipient, amount } = params;

			if (!recipient || !amount) {
				setApiError(t("fillRecipientAndAmount"));
				return false;
			}

			resetState();
			setStep("signing");

			try {
				const signResult = await signTransferAuth(
					recipient,
					amount,
					tokenBalance,
				);

				if (!signResult) {
					setStep("error");
					return false;
				}

				const paymentRequest: PaymentRequest = {
					domain: signResult.domain,
					message: signResult.message,
				};

				setStep("verifying");
				const verifyResult = await verifyPayment(paymentRequest);

				if (!verifyResult.success) {
					setApiError(verifyResult.message || t("verifyFailed"));
					setStep("error");
					return false;
				}

				console.log("=== V3 Verify Result ===");
				console.log(JSON.stringify(verifyResult, null, 2));

				setStep("settling");
				const settleResult = await settlePayment(paymentRequest);

				if (!settleResult.success) {
					setApiError(settleResult.message || t("settleFailed"));
					setStep("error");
					return false;
				}

				console.log("=== V3 Settle Result ===");
				console.log(JSON.stringify(settleResult, null, 2));

				const raw =
					settleResult.data &&
					typeof settleResult.data === "object" &&
					!Array.isArray(settleResult.data)
						? (settleResult.data as Record<string, unknown>)
						: {};
				const inner =
					raw.data &&
					typeof raw.data === "object" &&
					!Array.isArray(raw.data)
						? (raw.data as Record<string, unknown>)
						: {};
				const flat: Record<string, unknown> = { ...raw, ...inner };
				const resolvedHash = resolveTransactionHashFromResult(raw);
				const parsedChain = Number(flat.chainId ?? raw.chainId);
				const resultChainId =
					Number.isFinite(parsedChain) && parsedChain > 0
						? parsedChain
						: paymentRequest.domain.chainId;

				setTxResult({
					...flat,
					...(resolvedHash ? { txHash: resolvedHash } : {}),
					chainId: resultChainId,
				});
				setStep("success");
				await refreshBalance();

				return true;
			} catch (err) {
				console.error("V3 transfer failed:", err);
				setApiError(err instanceof Error ? err.message : t("transferFailed"));
				setStep("error");
				return false;
			}
		},
		[signTransferAuth, tokenBalance, refreshBalance, resetState, t],
	);

	return {
		step,
		isProcessing,
		error,
		payload,
		txResult,
		taxAmount,
		estimateReceive,
		executeTransfer,
		resetState,
		clearError,
	};
}
