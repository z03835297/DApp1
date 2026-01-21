import type { VersionedContracts, AppVersion } from "./type";
import { ContractName } from "./type";
import { TOKEN_ABI, USDT_ABI, VAULT_ABI, MUSDT_ABI } from "./abi";

export enum ChainId {
	MAINNET = 1,
	SEPOLIA = 11155111,
}

// 合约地址 - 按网络和版本区分
export const CONTRACT_ADDRESS: Record<ChainId, VersionedContracts> = {
	[ChainId.MAINNET]: {
		v1: {
			[ContractName.TOKEN]: "0xba08Bbc0ed9D61238353629d06d55F89bA9F0ba3", // V1 主网代币合约地址
			[ContractName.USDT]: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // V1 主网 USDT 合约地址
			[ContractName.VAULT]: "0x09568402dF3D4b8233eCf00b70FA34823C57C9B5", // V1 主网 Vault 合约地址
		},
		v2: {
			[ContractName.TOKEN]: "xxxx", // V2 主网代币合约地址
			[ContractName.USDT]: "xxxx", // V2 主网 USDT 合约地址
			[ContractName.VAULT]: "xxxx", // V2 主网 Vault 合约地址
		},
	},
	[ChainId.SEPOLIA]: {
		v1: {
			[ContractName.TOKEN]: "0xd6806a129E91077cCdbe055ec48b3FE3cdc9Ab5A", // V1 Sepolia 测试网代币合约地址
			[ContractName.USDT]: "0x4920E3E1E7c4D13c01188CfC7723873eef6639Bc", // V1 Sepolia 测试网 USDT 合约地址
			[ContractName.VAULT]: "0x7695b38d2A3308Cf45BFfdD8c297015F82708787", // V1 Sepolia 测试网 Vault 合约地址
		},
		v2: {
			[ContractName.TOKEN]: "xxxx", // V2 Sepolia 测试网代币合约地址
			[ContractName.USDT]: "xxxx", // V2 Sepolia 测试网 USDT 合约地址
			[ContractName.VAULT]: "xxxx", // V2 Sepolia 测试网 Vault 合约地址
		},
	},
};

// ABI - 按网络和版本区分
export const ABI: Record<
	ChainId,
	Record<AppVersion, Record<ContractName, object[]>>
> = {
	[ChainId.MAINNET]: {
		v1: {
			[ContractName.TOKEN]: TOKEN_ABI,
			[ContractName.USDT]: USDT_ABI,
			[ContractName.VAULT]: VAULT_ABI,
		},
		v2: {
			[ContractName.TOKEN]: TOKEN_ABI, // V2 如果 ABI 相同可复用
			[ContractName.USDT]: USDT_ABI,
			[ContractName.VAULT]: VAULT_ABI,
		},
	},
	[ChainId.SEPOLIA]: {
		v1: {
			[ContractName.TOKEN]: TOKEN_ABI,
			[ContractName.USDT]: MUSDT_ABI,
			[ContractName.VAULT]: VAULT_ABI,
		},
		v2: {
			[ContractName.TOKEN]: TOKEN_ABI,
			[ContractName.USDT]: MUSDT_ABI,
			[ContractName.VAULT]: VAULT_ABI,
		},
	},
};
