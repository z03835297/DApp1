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

/**
 * Cloudflare Pages 在构建时会自动注入 `CF_PAGES=1`。
 *
 * 本应用没有任何 API 路由 / middleware / 动态路由参数，纯客户端渲染
 * （wagmi + RainbowKit，后端 API 通过 NEXT_PUBLIC_API_URL 由浏览器直连），
 * 因此不需要 Cloudflare Pages 的 Workers/Functions（SSR）能力，也不建议使用
 * `@cloudflare/next-on-pages`：本项目依赖的 pino / thread-stream 等 Node 原生模块
 * 在 Workers 运行时里无法运行，且该适配器对 Next.js 新版本的支持并不稳定。
 *
 * 在 Cloudflare Pages 上改用纯静态导出（`output: "export"`），Build command 用
 * `bun run build`、Build output directory 填 `out` 即可，完全规避上述兼容性问题。
 * 本地 / Docker 场景（standalone Node 服务器）不受影响，仍使用 `output: "standalone"`。
 */
const isCloudflarePages = process.env.CF_PAGES === "1";

const nextConfig: NextConfig = {
	output: isCloudflarePages ? "export" : "standalone",

	// 静态导出模式下没有 Next.js 的图片优化服务器，交给浏览器直接加载原图
	images: isCloudflarePages ? { unoptimized: true } : undefined,

	// Externalize pino and thread-stream to avoid bundling Node.js native modules
	serverExternalPackages: ["pino", "pino-pretty", "thread-stream"],

	// Explicitly use Turbopack (Next.js 16 default)
	turbopack: {},
};

export default nextConfig;
