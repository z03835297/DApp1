import type { VersionedContracts, AppVersion, V3ContractAddressType } from "./type";
import { ContractName, V3ContractName } from "./type";
import { v1, v2, v3, USDT_ABI, MUSDT_ABI, VAULT_ABI } from "./abi";
import contractsConfig from "../../contracts.json";

/** V2 转账手续费（单位：token） */
export const TRANSFER_FEE = 2;

export enum ChainId {
	MAINNET = 1,
	SEPOLIA = 11155111,
}

/**
 * 区块浏览器根地址（与 wagmi 配置的 Mainnet / Sepolia 对应）。
 *
 * 示例：
 * - 主网交易：`https://etherscan.io/tx/0x089b337ae4d2737161fffac3fe4eb67660c31c0258721af81d4d2ddd08d2bee8`
 * - Sepolia：`https://sepolia.etherscan.io/tx/...`
 */
export const BLOCK_EXPLORER_BASE_URL: Record<ChainId, string> = {
	[ChainId.MAINNET]: "https://etherscan.io",
	[ChainId.SEPOLIA]: "https://sepolia.etherscan.io",
};

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

// ============ V3（Token + LimitGate + RedeemQueue 三合约架构）============
// v3 已部署在 Mainnet 与 Sepolia；合约集合与 v1/v2 不同，单独维护地址与 ABI 查表，
// 不复用 CONTRACT_ADDRESS / ABI（避免为 v1/v2 引入不存在的字段）。

/**
 * V3 合约地址 - 按链区分
 * 数据来源同样是 `contracts.json` 的 `v3` 字段。
 */
export const V3_CONTRACT_ADDRESS: Partial<Record<ChainId, V3ContractAddressType>> =
	Object.fromEntries(
		Object.entries(contractsConfig as Record<string, Record<string, unknown>>)
			.filter(([, versions]) => versions.v3)
			.map(([chainId, versions]) => [
				Number(chainId),
				versions.v3 as V3ContractAddressType,
			]),
	);

/** V3 核心合约 ABI（Token / LimitGate / RedeemQueue） */
export const V3_ABI: Record<
	Exclude<V3ContractName, V3ContractName.USDT>,
	object[]
> = {
	[V3ContractName.TOKEN]: v3.TOKEN_ABI,
	[V3ContractName.LIMIT_GATE]: v3.LIMIT_GATE_ABI,
	[V3ContractName.REDEEM_QUEUE]: v3.REDEEM_QUEUE_ABI,
};

/** V3 USDT ABI：Mainnet 用真实 USDT，Sepolia 用 mUSDT */
export const V3_USDT_ABI: Record<ChainId, object[]> = {
	[ChainId.MAINNET]: USDT_ABI,
	[ChainId.SEPOLIA]: MUSDT_ABI,
};
