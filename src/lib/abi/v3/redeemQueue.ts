/**
 * V3 RedeemQueue 合约 ABI
 * 来源：Sepolia Etherscan 已验证合约 0x6b4329cd8997d24aad37b3d409e12126312cb32e
 * 构造参数：无
 */
export const REDEEM_QUEUE_ABI = [
	{ inputs: [], stateMutability: "nonpayable", type: "constructor" },
	{ inputs: [], name: "ReentrancyGuardReentrantCall", type: "error" },
	{
		inputs: [{ internalType: "address", name: "token", type: "address" }],
		name: "SafeERC20FailedOperation",
		type: "error",
	},
	{
		anonymous: false,
		inputs: [{ indexed: true, internalType: "uint256", name: "ticketId", type: "uint256" }],
		name: "RedeemApproved",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [{ indexed: true, internalType: "uint256", name: "ticketId", type: "uint256" }],
		name: "RedeemCancelled",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [{ indexed: true, internalType: "uint256", name: "ticketId", type: "uint256" }],
		name: "RedeemClaimed",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [{ indexed: true, internalType: "uint256", name: "ticketId", type: "uint256" }],
		name: "RedeemRejected",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: true, internalType: "uint256", name: "ticketId", type: "uint256" },
			{ indexed: true, internalType: "address", name: "owner", type: "address" },
			{ indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
		],
		name: "RedeemRequested",
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
		inputs: [{ internalType: "uint256", name: "ticketId", type: "uint256" }],
		name: "approve",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ internalType: "uint256", name: "ticketId", type: "uint256" }],
		name: "cancel",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ internalType: "uint256", name: "ticketId", type: "uint256" }],
		name: "claim",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ internalType: "uint256", name: "ticketId", type: "uint256" }],
		name: "getTicket",
		outputs: [
			{
				components: [
					{ internalType: "address", name: "owner", type: "address" },
					{ internalType: "uint216", name: "amount", type: "uint216" },
					{ internalType: "enum IRedeemQueue.TicketStatus", name: "status", type: "uint8" },
				],
				internalType: "struct IRedeemQueue.Ticket",
				name: "",
				type: "tuple",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "nextTicketId",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [{ internalType: "uint256", name: "ticketId", type: "uint256" }],
		name: "reject",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "user", type: "address" },
			{ internalType: "uint256", name: "amount", type: "uint256" },
		],
		name: "requestRedeem",
		outputs: [{ internalType: "uint256", name: "ticketId", type: "uint256" }],
		stateMutability: "nonpayable",
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
	{
		inputs: [],
		name: "totalApproved",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "totalLocked",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
];
