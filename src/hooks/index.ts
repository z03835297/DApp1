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
