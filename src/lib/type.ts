export enum ContractName {
	TOKEN = "TOKEN",
	USDT = "USDT",
	VAULT = "VAULT",
}

export type ContractAddressType = {
	[ContractName.TOKEN]: string;
	[ContractName.USDT]: string;
	[ContractName.VAULT]: string;
};
