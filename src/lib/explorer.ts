import { BLOCK_EXPLORER_BASE_URL, type ChainId } from "./constants";

/** 规范化为 Etherscan 可用的 0x + 64 位十六进制 */
export function normalizeTransactionHash(hash: string): string | null {
	const s = hash.trim();
	if (/^0x[a-fA-F0-9]{64}$/i.test(s)) return s;
	if (/^[a-fA-F0-9]{64}$/i.test(s)) return `0x${s}`;
	return null;
}

/**
 * 从结算接口返回体中解析交易哈希（支持 txHash / txid、嵌套 data 等）。
 */
export function resolveTransactionHashFromResult(
	result: Record<string, unknown> | null | undefined,
): string | null {
	if (!result) return null;
	const inner =
		result.data && typeof result.data === "object" && !Array.isArray(result.data)
			? (result.data as Record<string, unknown>)
			: null;
	const buckets: Record<string, unknown>[] = [result];
	if (inner) buckets.push(inner);

	for (const obj of buckets) {
		for (const key of ["txHash", "txid", "transactionHash", "tx_id"]) {
			const v = obj[key];
			if (typeof v === "string") {
				const n = normalizeTransactionHash(v);
				if (n) return n;
			}
		}
	}
	return null;
}

/** 转账成功卡片展示用：优先规范化字段 */
export function getDisplayTxHash(
	result:
		| ({ txHash?: string } & Record<string, unknown>)
		| null
		| undefined,
): string | null {
	if (!result) return null;
	const fromApi = resolveTransactionHashFromResult(result);
	if (fromApi) return fromApi;
	if (result.txHash)
		return normalizeTransactionHash(result.txHash);
	return null;
}

/**
 * 返回对应链的交易详情页 URL（Etherscan / Sepolia Etherscan 等）。
 */
export function getTransactionExplorerUrl(
	chainId: number,
	txHash: string,
): string | null {
	const baseUrl = BLOCK_EXPLORER_BASE_URL[chainId as ChainId];
	const normalized = normalizeTransactionHash(txHash);
	if (!baseUrl || !normalized) return null;
	return `${baseUrl}/tx/${normalized}`;
}
