/**
 * 路由配置文件
 * 用于配置默认版本和路由相关设置
 */

import type { AppVersion, Feature } from "./type";

// 路由配置
export const routerConfig = {
	// 默认版本 - 修改此值可切换默认版本
	defaultVersion: "v2" as AppVersion,

	// 版本信息
	versions: {
		v1: {
			name: "V1",
			path: "/v1",
			description: "稳定版本",
			isStable: true,
			// V1 支持的功能
			features: ["mint", "withdraw"] as Feature[],
		},
		v2: {
			name: "V2",
			path: "/v2",
			description: "免 Gas 转账",
			isStable: false,
			// V2 支持的功能（多了 transfer）
			features: ["mint", "withdraw", "transfer"] as Feature[],
		},
	},
} as const;

// 获取默认版本路径
export function getDefaultVersionPath(): string {
	return routerConfig.versions[routerConfig.defaultVersion].path;
}

// 获取版本信息
export function getVersionInfo(version: AppVersion) {
	return routerConfig.versions[version];
}

// 获取所有版本列表
export function getAllVersions() {
	return Object.entries(routerConfig.versions).map(([key, value]) => ({
		key: key as AppVersion,
		...value,
	}));
}

// 检查是否为有效版本
export function isValidVersion(version: string): version is AppVersion {
	return version === "v1" || version === "v2";
}

// 检查版本是否支持某功能
export function hasFeature(version: AppVersion, feature: Feature): boolean {
	return routerConfig.versions[version].features.includes(feature);
}

// 获取版本支持的所有功能
export function getFeatures(version: AppVersion): readonly Feature[] {
	return routerConfig.versions[version].features;
}
