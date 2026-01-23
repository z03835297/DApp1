"use client";

import { useState, useCallback } from "react";
import { parseUnits, randomBytes, hexlify, Signature } from "ethers";
import { useWalletInfo } from "./useWalletInfo";
import { useTokenContract } from "./useContract";
import { TRANSFER_FEE } from "@/lib/constants";

export interface TransferAuthPayload {
	/** 发送者地址 */
	from: string;
	/** 接收者地址 */
	to: string;
	/** 转账金额 (wei) */
	value: string;
	/** 生效时间戳 */
	validAfter: number;
	/** 失效时间戳 */
	validBefore: number;
	/** 唯一 nonce (bytes32) */
	nonce: string;
	/** 签名 v */
	v: number;
	/** 签名 r */
	r: string;
	/** 签名 s */
	s: string;
}

export interface UseTransferWithAuthReturn {
	/** 是否正在签名 */
	isSigning: boolean;
	/** 错误信息 */
	error: string | null;
	/** 签名结果 */
	payload: TransferAuthPayload | null;
	/** 执行签名 */
	signTransferAuth: (
		to: string,
		amount: string,
		userBalance?: string,
	) => Promise<TransferAuthPayload | null>;
	/** 清除错误 */
	clearError: () => void;
	/** 清除 payload */
	clearPayload: () => void;
}

/**
 * 验证地址格式是否有效
 */
function isValidAddress(address: string): boolean {
	return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * 验证金额输入是否有效
 */
function isValidAmount(amount: string): boolean {
	if (!amount || amount.trim() === "") return false;
	if (!/^\d*\.?\d*$/.test(amount)) return false;
	const num = Number(amount);
	if (Number.isNaN(num) || !Number.isFinite(num)) return false;
	if (num <= 0) return false;
	return true;
}

/**
 * TransferWithAuthorization 签名 Hook (EIP-3009)
 * 用于 V2 免 Gas 转账功能
 */
export function useTransferWithAuth(): UseTransferWithAuthReturn {
	const [isSigning, setIsSigning] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [payload, setPayload] = useState<TransferAuthPayload | null>(null);

	const { address, getSigner } = useWalletInfo();
	const { address: tokenAddress, contract: tokenContract } = useTokenContract();

	const signTransferAuth = useCallback(
		async (
			to: string,
			amount: string,
			userBalance?: string,
		): Promise<TransferAuthPayload | null> => {
			// 地址验证
			if (!isValidAddress(to)) {
				setError("请输入有效的钱包地址");
				return null;
			}

			// 金额验证
			if (!isValidAmount(amount)) {
				setError("请输入有效的正数金额");
				return null;
			}

			// 余额验证（如果提供了余额）- 需要检查 金额 + 手续费
			if (
				userBalance !== undefined &&
				Number(amount) + TRANSFER_FEE > Number(userBalance)
			) {
				setError(`余额不足（需要额外 ${TRANSFER_FEE} token 手续费）`);
				return null;
			}

			if (!address || !tokenAddress || !tokenContract) {
				setError("请先连接钱包");
				return null;
			}

			setIsSigning(true);
			setError(null);

			try {
				const signer = await getSigner();
				if (!signer) {
					setError("无法获取签名器，请确保钱包已连接");
					return null;
				}

				// 获取 token decimals
				const decimals = await tokenContract.decimals();
				// 签名的金额需要包含手续费
				const totalAmount = Number(amount) + TRANSFER_FEE;
				const value = parseUnits(totalAmount.toString(), Number(decimals));

				// 生成随机 nonce (bytes32)
				const nonce = hexlify(randomBytes(32));

				// 设置时间窗口 (validAfter: 现在, validBefore: 5分钟后)
				const now = Math.floor(Date.now() / 1000);
				const validAfter = now;
				const validBefore = now + 900; // 5 分钟有效期

				// 获取 EIP-712 domain 信息
				// eip712Domain() 返回: [fields, name, version, chainId, verifyingContract, salt, extensions]
				const domainData = await tokenContract.eip712Domain();

				const domain = {
					name: domainData[1] as string,
					version: domainData[2] as string,
					chainId: Number(domainData[3]),
					verifyingContract: domainData[4] as string,
				};

				console.log("=== Domain ===", domain);

				// EIP-3009 TransferWithAuthorization types
				const types = {
					TransferWithAuthorization: [
						{ name: "from", type: "address" },
						{ name: "to", type: "address" },
						{ name: "value", type: "uint256" },
						{ name: "validAfter", type: "uint256" },
						{ name: "validBefore", type: "uint256" },
						{ name: "nonce", type: "bytes32" },
					],
				};

				const message = {
					from: address,
					to,
					value: value.toString(),
					validAfter,
					validBefore,
					nonce,
				};

				console.log("=== EIP-712 Domain ===");
				console.log(JSON.stringify(domain, null, 2));
				console.log("=== Message ===");
				console.log(JSON.stringify(message, null, 2));

				// 使用 EIP-712 签名
				const signature = await signer.signTypedData(domain, types, message);
				console.log("=== Raw Signature ===");
				console.log(signature);

				// 解析签名
				const sig = Signature.from(signature);

				const result: TransferAuthPayload = {
					from: address,
					to,
					value: value.toString(),
					validAfter,
					validBefore,
					nonce,
					v: sig.v,
					r: sig.r,
					s: sig.s,
				};

				setPayload(result);

				console.log("=== TransferWithAuthorization Payload ===");
				console.log(JSON.stringify(result, null, 2));

				return result;
			} catch (err) {
				console.error("Signing failed:", err);
				if (err instanceof Error) {
					// 用户取消签名
					if (
						err.message.includes("user rejected") ||
						err.message.includes("User rejected")
					) {
						setError("用户取消签名");
					} else {
						setError(err.message);
					}
				} else {
					setError("签名失败，请稍后重试");
				}
				return null;
			} finally {
				setIsSigning(false);
			}
		},
		[address, tokenAddress, tokenContract, getSigner],
	);

	const clearError = useCallback(() => setError(null), []);
	const clearPayload = useCallback(() => setPayload(null), []);

	return {
		isSigning,
		error,
		payload,
		signTransferAuth,
		clearError,
		clearPayload,
	};
}
