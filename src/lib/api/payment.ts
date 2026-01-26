/**
 * Payment API - 支付验证和结算接口
 */

/** API 基础 URL */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

/** 支付请求参数 */
export interface PaymentRequest {
	from: string;
	to: string;
	value: string;
	validAfter: number;
	validBefore: number;
	nonce: string;
	signature: string;
}

/** 支付验证响应 */
export interface VerifyResponse {
	success: boolean;
	message?: string;
	data?: {
		isValid: boolean;
		[key: string]: unknown;
	};
}

/** 支付结算响应 */
export interface SettleResponse {
	success: boolean;
	message?: string;
	data?: {
		txHash?: string;
		[key: string]: unknown;
	};
}

/**
 * 验证支付授权
 * 调用后端验证签名是否有效
 */
export async function verifyPayment(
	request: PaymentRequest
): Promise<VerifyResponse> {
	try {
		const response = await fetch(`${API_BASE_URL}/payment/verify`, {
			method: "POST",
			headers: {
				Accept: "*/*",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(request),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`验证请求失败: ${response.status} - ${errorText}`);
		}

		const data = await response.json();

		// 检查响应体中的 success 字段
		if (data.success === false) {
			return {
				success: false,
				message: data.message || "验证失败",
				data,
			};
		}

		return {
			success: true,
			data,
		};
	} catch (error) {
		console.error("Payment verify error:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "验证请求失败",
		};
	}
}

/** 重试配置 */
const SETTLE_MAX_RETRIES = 3;
const SETTLE_RETRY_DELAY_MS = 1000; // 重试间隔 1 秒

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 结算支付（单次尝试）
 */
async function settlePaymentOnce(
	request: PaymentRequest
): Promise<SettleResponse> {
	const response = await fetch(`${API_BASE_URL}/payment/settle`, {
		method: "POST",
		headers: {
			Accept: "*/*",
			"Content-Type": "application/json",
		},
		body: JSON.stringify(request),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`结算请求失败: ${response.status} - ${errorText}`);
	}

	const data = await response.json();

	// 检查响应体中的 success 字段
	if (data.success === false) {
		return {
			success: false,
			message: data.message || "结算失败",
			data,
		};
	}

	return {
		success: true,
		data,
	};
}

/**
 * 结算支付
 * 调用后端执行链上交易
 * 支持重试机制，最多重试 3 次（适用于广播等临时性错误）
 */
export async function settlePayment(
	request: PaymentRequest
): Promise<SettleResponse> {
	let lastError: Error | null = null;

	for (let attempt = 1; attempt <= SETTLE_MAX_RETRIES; attempt++) {
		try {
			console.log(`[Settle] 尝试第 ${attempt}/${SETTLE_MAX_RETRIES} 次...`);

			const result = await settlePaymentOnce(request);

			// 如果返回了明确的业务失败（非网络/广播问题），不重试
			if (!result.success && result.data) {
				console.log(`[Settle] 业务失败，不重试:`, result.message);
				return result;
			}

			if (result.success) {
				if (attempt > 1) {
					console.log(`[Settle] 第 ${attempt} 次尝试成功`);
				}
				return result;
			}

			// 非 success 且无 data，可能是临时问题，继续重试
			lastError = new Error(result.message || "结算失败");
		} catch (error) {
			console.error(`[Settle] 第 ${attempt} 次尝试失败:`, error);
			lastError = error instanceof Error ? error : new Error("结算请求失败");
		}

		// 如果不是最后一次尝试，等待后重试
		if (attempt < SETTLE_MAX_RETRIES) {
			console.log(`[Settle] ${SETTLE_RETRY_DELAY_MS}ms 后重试...`);
			await delay(SETTLE_RETRY_DELAY_MS);
		}
	}

	// 所有重试都失败
	console.error(`[Settle] ${SETTLE_MAX_RETRIES} 次尝试均失败`);
	return {
		success: false,
		message: lastError?.message || `结算失败（已重试 ${SETTLE_MAX_RETRIES} 次）`,
	};
}
