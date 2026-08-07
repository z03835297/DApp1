import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

const cwd = process.cwd();
const contractsPath = path.join(cwd, "contracts.json");
/** standalone 镜像内仅有 server.js + .next/static，不包含 contracts.json（地址已在 build 时打进 bundle） */
const isStandaloneRuntimeDir =
	fs.existsSync(path.join(cwd, "server.js")) &&
	fs.existsSync(path.join(cwd, ".next", "static"));

if (!isStandaloneRuntimeDir && !fs.existsSync(contractsPath)) {
	throw new Error(
		"缺少 contracts.json：请复制 contracts.example.json 为 contracts.json 并填写合约地址后再运行 dev/build/start。" +
			"若在 Cloudflare Pages 等无法预置文件的托管平台构建，请改为设置 CONTRACTS_JSON 环境变量" +
			"（值为 contracts.json 的完整 JSON 内容），`bun run build` 会在构建前自动据此生成该文件（见 scripts/gen-contracts.mjs）。",
	);
}

const nextConfig: NextConfig = {
	output: "standalone",

	// Externalize pino and thread-stream to avoid bundling Node.js native modules
	serverExternalPackages: ["pino", "pino-pretty", "thread-stream"],

	// Explicitly use Turbopack (Next.js 16 default)
	turbopack: {},
};

export default nextConfig;
