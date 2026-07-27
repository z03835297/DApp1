"use client";

import { useState, useEffect, useCallback } from "react";
import { useWalletInfo } from "./useWalletInfo";
import { useV3TokenContract } from "./useV3Contract";

export interface UseIsV3AdminReturn {
	isAdmin: boolean;
	adminAddress: string | null;
	isLoading: boolean;
	refresh: () => Promise<void>;
}

/**
 * 当前连接钱包是否为 V3 Token.admin()
 */
export function useIsV3Admin(): UseIsV3AdminReturn {
	const [isAdmin, setIsAdmin] = useState(false);
	const [adminAddress, setAdminAddress] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const { address, isConnected } = useWalletInfo();
	const { contract: tokenContract, isReady } = useV3TokenContract();

	const refresh = useCallback(async () => {
		if (!isReady || !tokenContract) {
			setIsAdmin(false);
			setAdminAddress(null);
			return;
		}

		setIsLoading(true);
		try {
			const admin = (await tokenContract.admin()) as string;
			setAdminAddress(admin);
			setIsAdmin(
				Boolean(
					isConnected &&
						address &&
						admin.toLowerCase() === address.toLowerCase(),
				),
			);
		} catch (error) {
			console.error("Failed to fetch V3 admin:", error);
			setIsAdmin(false);
			setAdminAddress(null);
		} finally {
			setIsLoading(false);
		}
	}, [tokenContract, isReady, address, isConnected]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	return { isAdmin, adminAddress, isLoading, refresh };
}
