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
