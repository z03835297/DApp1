import type { Contract } from "ethers";

/**
 * 读取 V3 Token 固定税额。
 *
 * Sepolia 已重新部署为跟 Mainnet 字节码一致的合约（2026-08-06 起
 * `0x447aa44242d6f14edf88c0f6b67c3d0ad2113b3a`），`taxAmount()` 已被移除，
 * 两条链现在都只有 `tax()`。保留 `taxAmount()` fallback 只是为了兼容极端情况下
 * 还连着旧合约实例的场景，正常路径不会走到。
 */
export async function readTokenTax(contract: Contract): Promise<bigint> {
	try {
		return (await contract.tax()) as bigint;
	} catch {
		return (await contract.taxAmount()) as bigint;
	}
}
