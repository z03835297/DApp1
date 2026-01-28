"use client";

import { useState, useCallback } from "react";
import { useTransferWithAuth, type TransferAuthPayload } from "./useTransferWithAuth";
import { useTokenBalance } from "./useTokenBalance";
import {
	verifyPayment,
	settlePayment,
	type PaymentRequest,
} from "@/lib/api";

/** 转账流程状态 */
export type TransferStep = "idle" | "signing" | "verifying" | "settling" | "success" | "error";

/** 转账结果 */
export interface TransferResult {
	txHash?: string;
	[key: string]: unknown;
}

/** 转账参数 */
export interface TransferParams {
	recipient: string;
	amount: string;
}

/** useTransferFlow 返回类型 */
export interface UseTransferFlowReturn {
	/** 当前步骤 */
	step: TransferStep;
	/** 是否正在处理中 */
	isProcessing: boolean;
	/** 错误信息（包括签名错误和 API 错误） */
	error: string | null;
	/** 签名 payload（用于调试显示） */
	payload: TransferAuthPayload | null;
	/** 转账结果 */
	txResult: TransferResult | null;
	/** 执行转账 */
	executeTransfer: (params: TransferParams) => Promise<boolean>;
	/** 重置状态 */
	resetState: () => void;
	/** 清除错误 */
	clearError: () => void;
}

/**
 * 转账流程 Hook
 * 封装完整的签名 -> 验证 -> 结算流程
 */
export function useTransferFlow(): UseTransferFlowReturn {
	const [step, setStep] = useState<TransferStep>("idle");
	const [apiError, setApiError] = useState<string | null>(null);
	const [txResult, setTxResult] = useState<TransferResult | null>(null);

	const { balance: tokenBalance, refresh: refreshBalance } = useTokenBalance();
	const {
		signTransferAuth,
		payload,
		error: signError,
		clearError: clearSignError,
		clearPayload,
	} = useTransferWithAuth();

	// 是否正在处理中
	const isProcessing = step === "signing" || step === "verifying" || step === "settling";

	// 合并错误信息
	const error = signError || apiError;

	// 重置状态
	const resetState = useCallback(() => {
		setStep("idle");
		setApiError(null);
		setTxResult(null);
		clearPayload();
	}, [clearPayload]);

	// 清除错误
	const clearError = useCallback(() => {
		clearSignError();
		setApiError(null);
	}, [clearSignError]);

	// 执行转账流程
	const executeTransfer = useCallback(
		async (params: TransferParams): Promise<boolean> => {
			const { recipient, amount } = params;

			if (!recipient || !amount) {
				setApiError("请填写接收地址和金额");
				return false;
			}

			// 重置状态
			resetState();
			setStep("signing");

			try {
				// Step 1: 签名
				const signResult = await signTransferAuth(recipient, amount, tokenBalance);

				if (!signResult) {
					setStep("error");
					return false;
				}

				// 构建 API 请求参数（signResult 已包含 domain 和 message）
				const paymentRequest: PaymentRequest = {
					domain: signResult.domain,
					message: signResult.message,
				};


				// Step 2: 验证
				setStep("verifying");
				const verifyResult = await verifyPayment(paymentRequest);

				if (!verifyResult.success) {
					setApiError(verifyResult.message || "验证失败");
					setStep("error");
					return false;
				}

				console.log("=== Verify Result ===");
				console.log(JSON.stringify(verifyResult, null, 2));

				// Step 3: 结算
				setStep("settling");
				const settleResult = await settlePayment(paymentRequest);

				if (!settleResult.success) {
					setApiError(settleResult.message || "结算失败");
					setStep("error");
					return false;
				}

				console.log("=== Settle Result ===");
				console.log(JSON.stringify(settleResult, null, 2));

				// 成功
				setTxResult(settleResult.data || {});
				setStep("success");
				await refreshBalance();

				return true;
			} catch (err) {
				console.error("Transfer failed:", err);
				setApiError(err instanceof Error ? err.message : "转账失败");
				setStep("error");
				return false;
			}
		},
		[signTransferAuth, tokenBalance, refreshBalance, resetState]
	);

	return {
		step,
		isProcessing,
		error,
		payload,
		txResult,
		executeTransfer,
		resetState,
		clearError,
	};
}
