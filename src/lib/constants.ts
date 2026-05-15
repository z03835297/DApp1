import type { VersionedContracts, AppVersion } from "./type";
import { ContractName } from "./type";
import { v1, v2, USDT_ABI, MUSDT_ABI, VAULT_ABI } from "./abi";
import contractsConfig from "../../contracts.json";

/** V2 转账手续费（单位：token） */
export const TRANSFER_FEE = 2;

export enum ChainId {
	MAINNET = 1,
	SEPOLIA = 11155111,
}

/**
 * 合约地址 - 按网络和版本区分
 *
 * 数据来源：项目根目录的 `contracts.json`（已被 .gitignore，作为本地配置文件维护）。
 * 模板见 `contracts.example.json`。
 */
export const CONTRACT_ADDRESS: Record<ChainId, VersionedContracts> =
	contractsConfig as unknown as Record<ChainId, VersionedContracts>;

// ABI - 按网络和版本区分
export const ABI: Record<
	ChainId,
	Record<AppVersion, Record<ContractName, object[]>>
> = {
	[ChainId.MAINNET]: {
		v1: {
			[ContractName.TOKEN]: v1.TOKEN_ABI,
			[ContractName.USDT]: USDT_ABI,
			[ContractName.VAULT]: VAULT_ABI,
		},
		v2: {
			[ContractName.TOKEN]: v2.TOKEN_ABI,
			[ContractName.USDT]: USDT_ABI,
			[ContractName.VAULT]: VAULT_ABI,
		},
	},
	[ChainId.SEPOLIA]: {
		v1: {
			[ContractName.TOKEN]: v1.TOKEN_ABI,
			[ContractName.USDT]: MUSDT_ABI,
			[ContractName.VAULT]: VAULT_ABI,
		},
		v2: {
			[ContractName.TOKEN]: v2.TOKEN_ABI,
			[ContractName.USDT]: MUSDT_ABI,
			[ContractName.VAULT]: VAULT_ABI,
		},
	},
};
