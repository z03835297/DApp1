/**
 * 路由配置文件
 * 用于配置默认版本和路由相关设置
 */

// 版本类型
export type AppVersion = "v1" | "v2";

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
		},
		v2: {
			name: "V2",
			path: "/v2",
			description: "测试版本 - 新功能体验",
			isStable: false,
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
