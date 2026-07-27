// 钱包相关
export { useWalletInfo, type WalletInfo } from "./useWalletInfo";

// 合约相关
export {
	useContract,
	useUsdtContract,
	useTokenContract,
	useVaultContract,
	type ContractConfig,
	type UseContractReturn,
} from "./useContract";

// 代币信息
export {
	useTokenInfo,
	type TokenInfo,
	type UseTokenInfoReturn,
} from "./useTokenInfo";

// 代币余额
export {
	useUsdtBalance,
	useTokenBalance,
	type UseTokenBalanceReturn,
} from "./useTokenBalance";

// 授权相关
export { useAllowance, type UseVaultReturn } from "./useAllowance";

// Withdraw 相关
export { useWithdraw, type UseWithdrawReturn } from "./useWithdraw";

// Transfer 相关
export { useTransfer, type UseTransferReturn } from "./useTransfer";

// TransferWithAuthorization 相关 (EIP-3009)
export {
	useTransferWithAuth,
	type TransferAuthDomain,
	type TransferAuthMessage,
	type TransferAuthPayload,
	type UseTransferWithAuthReturn,
} from "./useTransferWithAuth";

// 转账流程 (签名 -> 验证 -> 结算)
export {
	useTransferFlow,
	type TransferStep,
	type TransferResult,
	type TransferParams,
	type UseTransferFlowReturn,
} from "./useTransferFlow";

// ============ V3（Token + LimitGate + RedeemQueue）============
export {
	useV3Contract,
	useV3TokenContract,
	useV3LimitGateContract,
	useV3RedeemQueueContract,
	useV3UsdtContract,
	type UseV3ContractReturn,
} from "./useV3Contract";

export {
	useV3TokenMeta,
	type TokenMeta,
	type UseV3TokenMetaReturn,
} from "./useV3TokenMeta";

export {
	useV3TokenBalance,
	useV3UsdtBalance,
	type UseV3BalanceReturn,
} from "./useV3Balance";

export { useV3Mint, type UseV3MintReturn } from "./useV3Mint";

export { useV3Transfer, type UseV3TransferReturn } from "./useV3Transfer";

export {
	useV3LimitInfo,
	type UseV3LimitInfoReturn,
} from "./useV3LimitInfo";

export {
	useV3Redeem,
	type RedeemOutcome,
	type RedeemPreview,
	type UseV3RedeemReturn,
} from "./useV3Redeem";

export {
	useV3RedeemTickets,
	type V3Ticket,
	type UseV3RedeemTicketsReturn,
} from "./useV3RedeemTickets";

export { useIsV3Admin, type UseIsV3AdminReturn } from "./useIsV3Admin";

export {
	useV3AdminQueue,
	type UseV3AdminQueueReturn,
} from "./useV3AdminQueue";

export {
	useV3AdminLimits,
	type UseV3AdminLimitsReturn,
} from "./useV3AdminLimits";
