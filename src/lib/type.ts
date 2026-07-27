export enum ContractName {
	TOKEN = "TOKEN",
	USDT = "USDT",
	VAULT = "VAULT",
}

// 版本类型
export type AppVersion = "v1" | "v2";

// 功能类型
export type Feature = "mint" | "withdraw" | "transfer";

export type ContractAddressType = {
	[ContractName.TOKEN]: string;
	[ContractName.USDT]: string;
	[ContractName.VAULT]: string;
};

// 按版本区分的合约配置
export type VersionedContracts = Record<AppVersion, ContractAddressType>;

// ============ V3（Token + LimitGate + RedeemQueue 三合约架构）============
// v3 的合约集合与 v1/v2 的 {TOKEN, USDT, VAULT} 三元组不同，单独定义类型，
// 不复用 ContractName / ContractAddressType / VersionedContracts。

export enum V3ContractName {
	TOKEN = "TOKEN",
	LIMIT_GATE = "LIMIT_GATE",
	REDEEM_QUEUE = "REDEEM_QUEUE",
	USDT = "USDT",
}

export type V3ContractAddressType = Record<V3ContractName, string>;

/**
 * RedeemQueue 票据状态机（顺序与合约 enum 完全一致，不可调整）
 * None -> Pending -> Approved -> Claimed
 *                  -> Rejected
 *          Pending/Approved -> Cancelled（持有人主动取消）
 */
export enum V3TicketStatus {
	None = 0,
	Pending = 1,
	Approved = 2,
	Claimed = 3,
	Cancelled = 4,
	Rejected = 5,
}
