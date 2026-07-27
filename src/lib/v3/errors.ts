/**
 * V3 共享错误处理 / 校验工具
 */

export function isValidAmount(amount: string): boolean {
	if (!amount || amount.trim() === "") return false;
	if (!/^\d*\.?\d*$/.test(amount)) return false;
	const num = Number(amount);
	if (Number.isNaN(num) || !Number.isFinite(num)) return false;
	if (num <= 0) return false;
	return true;
}

export function isValidAddress(address: string): boolean {
	return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function getErrorMessage(err: unknown, defaultMsg: string): string {
	if (err instanceof Error) return err.message;
	if (typeof err === "string") return err;
	if (err && typeof err === "object" && "message" in err) {
		return String((err as { message: unknown }).message);
	}
	return defaultMsg;
}
