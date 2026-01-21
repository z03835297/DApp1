"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AppVersion } from "@/lib/type";

// 创建 Context，默认值为 v1
const VersionContext = createContext<AppVersion>("v1");

interface VersionProviderProps {
	version: AppVersion;
	children: ReactNode;
}

/**
 * 版本 Provider
 * 用于向子组件提供当前版本信息
 */
export function VersionProvider({ version, children }: VersionProviderProps) {
	return (
		<VersionContext.Provider value={version}>
			{children}
		</VersionContext.Provider>
	);
}

/**
 * 获取当前版本的 Hook
 */
export function useVersion(): AppVersion {
	return useContext(VersionContext);
}
