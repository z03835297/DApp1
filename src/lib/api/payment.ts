/**
 * Payment API - 支付验证和结算接口
 */

/** API 基础 URL */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

/** 单次 settle 请求默认最长等待时间（毫秒） */
const DEFAULT_SETTLE_TIMEOUT_MS = 120_000;

/**
 * 单次 settle 请求最长等待时间（毫秒）。
 * 过短会容易在服务端已提交链上、但响应尚未返回时误判失败并触发重试。
 * 可通过环境变量 `NEXT_PUBLIC_SETTLE_TIMEOUT_MS` 覆盖（例如 180000 = 3 分钟）。
 */
const SETTLE_TIMEOUT_MS = (() => {
	const raw = process.env.NEXT_PUBLIC_SETTLE_TIMEOUT_MS;
	if (raw === undefined || raw === "") return DEFAULT_SETTLE_TIMEOUT_MS;
	const n = Number(raw);
	return Number.isFinite(n) && n >= 10_000 ? n : DEFAULT_SETTLE_TIMEOUT_MS;
})();

/** EIP-712 Domain 参数 */
export interface PaymentDomain {
	chainId: number;
	name: string;
	verifyingContract: string;
	version: string;
}

/** 支付消息参数 */
export interface PaymentMessage {
	from: string;
	to: string;
	value: string;
	validAfter: number;
	validBefore: number;
	nonce: string;
	signature: string;
}

/** 支付请求参数 */
export interface PaymentRequest {
	domain: PaymentDomain;
	message: PaymentMessage;
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

class SettleRequestError extends Error {
	readonly retryable: boolean;
	readonly status?: number;

	constructor(message: string, options: { retryable: boolean; status?: number }) {
		super(message);
		this.name = "SettleRequestError";
		this.retryable = options.retryable;
		this.status = options.status;
	}
}

function isAbortError(error: unknown): boolean {
	if (error instanceof DOMException && error.name === "AbortError") return true;
	if (error instanceof Error && error.name === "AbortError") return true;
	return false;
}

/** 网关/服务端暂态，可重试；4xx 业务错误不重试（避免重复广播） */
function isRetryableHttpStatus(status: number): boolean {
	if (status === 408 || status === 425 || status === 429) return true;
	if (status >= 500 && status <= 599) return true;
	return false;
}

/**
 * 与单次授权唯一对应的幂等键（请后端对相同 key 的 settle 返回同一结果，避免客户端重试时重复上链）。
 */
function settleIdempotencyKey(request: PaymentRequest): string {
	return `${request.domain.chainId}:${request.message.nonce}`;
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

/** 重试配置（仅用于网络抖动 / 可重试 HTTP，不用于「客户端等待超时」） */
const SETTLE_MAX_RETRIES = 3;
const SETTLE_RETRY_DELAY_MS = 1000;

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
	request: PaymentRequest,
	signal: AbortSignal
): Promise<SettleResponse> {
	const response = await fetch(`${API_BASE_URL}/payment/settle`, {
		method: "POST",
		headers: {
			Accept: "*/*",
			"Content-Type": "application/json",
			"Idempotency-Key": settleIdempotencyKey(request),
		},
		body: JSON.stringify(request),
		signal,
	});

	if (!response.ok) {
		const errorText = await response.text();
		const retryable = isRetryableHttpStatus(response.status);
		throw new SettleRequestError(
			`结算请求失败: ${response.status} - ${errorText}`,
			{ retryable, status: response.status },
		);
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
 *
 * - 单次请求使用较长超时，减少「链已成功但响应慢」时的误重试。
 * - 若仍超时：不再自动重试 POST（避免与服务端仍在处理的第一笔并发重复提交）；请用户以区块浏览器 / 余额为准。
 * - 重试仅针对网络失败或可重试 HTTP 状态；并请后端对 `Idempotency-Key` 做幂等处理。
 */
export async function settlePayment(
	request: PaymentRequest
): Promise<SettleResponse> {
	let lastError: Error | null = null;

	for (let attempt = 1; attempt <= SETTLE_MAX_RETRIES; attempt++) {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), SETTLE_TIMEOUT_MS);

		try {
			console.log(`[Settle] 尝试第 ${attempt}/${SETTLE_MAX_RETRIES} 次（超时 ${SETTLE_TIMEOUT_MS}ms）...`);

			const result = await settlePaymentOnce(request, controller.signal);
			clearTimeout(timeoutId);

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

			// 非 success 且无 data：疑似暂态，可有限次重试（依赖后端 Idempotency-Key 幂等）
			lastError = new Error(result.message || "结算失败");
		} catch (error) {
			clearTimeout(timeoutId);

			if (isAbortError(error)) {
				console.warn(
					`[Settle] 第 ${attempt} 次在等待 ${SETTLE_TIMEOUT_MS}ms 后超时，中止自动重试以免与服务端仍在处理中的请求重复`,
				);
				return {
					success: false,
					message:
						`结算等待超时（${Math.round(SETTLE_TIMEOUT_MS / 1000)}s）。服务端可能仍在打包或响应较慢，链上也可能已成功；请勿立即重复发起转账，请在区块浏览器确认交易或稍后刷新余额。可在 .env 中增大 NEXT_PUBLIC_SETTLE_TIMEOUT_MS。`,
				};
			}

			if (error instanceof SettleRequestError && !error.retryable) {
				return {
					success: false,
					message: error.message,
				};
			}

			console.error(`[Settle] 第 ${attempt} 次尝试失败:`, error);
			lastError =
				error instanceof Error ? error : new Error("结算请求失败");
		}

		if (attempt < SETTLE_MAX_RETRIES) {
			console.log(`[Settle] ${SETTLE_RETRY_DELAY_MS}ms 后重试...`);
			await delay(SETTLE_RETRY_DELAY_MS);
		}
	}

	console.error(`[Settle] ${SETTLE_MAX_RETRIES} 次尝试均失败`);
	return {
		success: false,
		message:
			lastError?.message || `结算失败（已重试 ${SETTLE_MAX_RETRIES} 次）`,
	};
}
