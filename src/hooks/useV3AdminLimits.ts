"use client";

import { useState, useCallback } from "react";
import { parseUnits, Contract } from "ethers";
import { useWalletInfo } from "./useWalletInfo";
import { useV3LimitGateContract, useV3TokenContract } from "./useV3Contract";
import { useV3LimitInfo } from "./useV3LimitInfo";
import { getErrorMessage, isValidAmount } from "@/lib/v3/errors";
import { useTranslations } from "next-intl";

export interface UseV3AdminLimitsReturn {
	perTxLimit: string;
	globalDailyLimit: string;
	globalUsedToday: string;
	isLoading: boolean;
	isUpdating: boolean;
	error: string | null;
	refresh: () => Promise<void>;
	setPerTxLimit: (limit: string) => Promise<boolean>;
	setGlobalDailyLimit: (limit: string) => Promise<boolean>;
	clearError: () => void;
}

/**
 * Admin：读写 LimitGate 限额
 */
export function useV3AdminLimits(): UseV3AdminLimitsReturn {
	const t = useTranslations("errors");
	const [isUpdating, setIsUpdating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { getSigner } = useWalletInfo();
	const {
		address: gateAddress,
		abi: gateAbi,
	} = useV3LimitGateContract();
	const { contract: tokenContract } = useV3TokenContract();
	const {
		perTxLimit,
		globalDailyLimit,
		globalUsedToday,
		isLoading,
		refresh,
	} = useV3LimitInfo();

	const clearError = useCallback(() => setError(null), []);

	const setPerTxLimit = useCallback(
		async (limit: string): Promise<boolean> => {
			if (!isValidAmount(limit) && limit !== "0") {
				setError(t("invalidLimit"));
				return false;
			}
			if (!gateAddress || !gateAbi) {
				setError(t("gateNotInit"));
				return false;
			}

			setIsUpdating(true);
			setError(null);

			try {
				const signer = await getSigner();
				if (!signer) {
					setError(t("noSigner"));
					return false;
				}

				const dec = tokenContract
					? Number(await tokenContract.decimals())
					: 6;
				const gate = new Contract(gateAddress, gateAbi, signer);
				const tx = await gate.setPerTxLimit(parseUnits(limit || "0", dec));
				await tx.wait(2);
				await refresh();
				return true;
			} catch (err) {
				console.error("setPerTxLimit failed:", err);
				setError(getErrorMessage(err, t("setPerTxFailed")));
				return false;
			} finally {
				setIsUpdating(false);
			}
		},
		[gateAddress, gateAbi, tokenContract, getSigner, refresh, t],
	);

	const setGlobalDailyLimit = useCallback(
		async (limit: string): Promise<boolean> => {
			if (!isValidAmount(limit) && limit !== "0") {
				setError(t("invalidLimit"));
				return false;
			}
			if (!gateAddress || !gateAbi) {
				setError(t("gateNotInit"));
				return false;
			}

			setIsUpdating(true);
			setError(null);

			try {
				const signer = await getSigner();
				if (!signer) {
					setError(t("noSigner"));
					return false;
				}

				const dec = tokenContract
					? Number(await tokenContract.decimals())
					: 6;
				const gate = new Contract(gateAddress, gateAbi, signer);
				const tx = await gate.setGlobalDailyLimit(
					parseUnits(limit || "0", dec),
				);
				await tx.wait(2);
				await refresh();
				return true;
			} catch (err) {
				console.error("setGlobalDailyLimit failed:", err);
				setError(getErrorMessage(err, t("setDailyFailed")));
				return false;
			} finally {
				setIsUpdating(false);
			}
		},
		[gateAddress, gateAbi, tokenContract, getSigner, refresh, t],
	);

	return {
		perTxLimit,
		globalDailyLimit,
		globalUsedToday,
		isLoading,
		isUpdating,
		error,
		refresh,
		setPerTxLimit,
		setGlobalDailyLimit,
		clearError,
	};
}
