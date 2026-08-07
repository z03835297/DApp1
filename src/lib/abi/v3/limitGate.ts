/**
 * V3 LimitGate 合约 ABI
 * 来源：Sepolia Etherscan 已验证合约 0x8a78621620c0e27b0e30c62f0d12eade5c6da8a1
 * 构造参数：(perTxLimit_, globalDailyLimit_)
 */
export const LIMIT_GATE_ABI = [
	{
		inputs: [
			{ internalType: "uint256", name: "perTxLimit_", type: "uint256" },
			{ internalType: "uint256", name: "globalDailyLimit_", type: "uint256" },
		],
		stateMutability: "nonpayable",
		type: "constructor",
	},
	{ inputs: [], name: "ReentrancyGuardReentrantCall", type: "error" },
	{
		inputs: [{ internalType: "address", name: "token", type: "address" }],
		name: "SafeERC20FailedOperation",
		type: "error",
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: true, internalType: "address", name: "user", type: "address" },
			{ indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
			{ indexed: true, internalType: "uint40", name: "dayId", type: "uint40" },
		],
		name: "Consumed",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [{ indexed: false, internalType: "uint256", name: "limit", type: "uint256" }],
		name: "GlobalDailyLimitSet",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [{ indexed: false, internalType: "uint256", name: "limit", type: "uint256" }],
		name: "PerTxLimitSet",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [{ indexed: true, internalType: "address", name: "token", type: "address" }],
		name: "TokenBound",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: true, internalType: "address", name: "token", type: "address" },
			{ indexed: true, internalType: "address", name: "to", type: "address" },
			{ indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
		],
		name: "TokenRescued",
		type: "event",
	},
	{
		inputs: [],
		name: "admin",
		outputs: [{ internalType: "address", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "", type: "address" },
			{ internalType: "uint256", name: "amount", type: "uint256" },
		],
		name: "checkLimits",
		outputs: [
			{ internalType: "bool", name: "userOk", type: "bool" },
			{ internalType: "bool", name: "globalOk", type: "bool" },
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "user", type: "address" },
			{ internalType: "uint256", name: "amount", type: "uint256" },
		],
		name: "consume",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "globalDailyLimit",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "globalUsedToday",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "perTxLimit",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "token", type: "address" },
			{ internalType: "address", name: "to", type: "address" },
		],
		name: "rescueToken",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ internalType: "uint256", name: "limit", type: "uint256" }],
		name: "setGlobalDailyLimit",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ internalType: "uint256", name: "limit", type: "uint256" }],
		name: "setPerTxLimit",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ internalType: "address", name: "token_", type: "address" }],
		name: "setToken",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "tokenContract",
		outputs: [{ internalType: "address", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
];
