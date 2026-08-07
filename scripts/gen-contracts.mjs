#!/usr/bin/env node
/**
 * 为托管构建环境（如 Cloudflare Pages）准备 contracts.json。
 *
 * 背景：contracts.json 已加入 .gitignore，本地 / Docker 场景下需要开发者手动
 * `cp contracts.example.json contracts.json` 后维护。但类似 Cloudflare Pages
 * 的托管构建是直接从 Git 仓库拉代码，无法预置这个未提交的文件，也没有交互式
 * shell 去手动创建。
 *
 * 解决办法：在这些平台的项目设置里新增一个环境变量 CONTRACTS_JSON，值为
 * contracts.json 的完整 JSON 内容（可以是压缩成一行的字符串）。本脚本会在
 * `next build` 之前运行：
 *   - 如果 contracts.json 已存在（本地 / Docker 场景），什么都不做；
 *   - 否则尝试读取 CONTRACTS_JSON 环境变量并写出 contracts.json；
 *   - 如果两者都没有，直接跳过，交由 next.config.ts 给出明确的报错提示。
 */
import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const contractsPath = path.join(cwd, "contracts.json");

if (fs.existsSync(contractsPath)) {
	console.log("[gen-contracts] contracts.json 已存在，跳过生成。");
	process.exit(0);
}

const raw = process.env.CONTRACTS_JSON;
if (!raw) {
	console.log(
		"[gen-contracts] 未找到 contracts.json，且未设置 CONTRACTS_JSON 环境变量，跳过（若 build 报错缺少 contracts.json，请检查该环境变量）。",
	);
	process.exit(0);
}

let parsed;
try {
	parsed = JSON.parse(raw);
} catch (err) {
	console.error(
		"[gen-contracts] CONTRACTS_JSON 环境变量不是合法 JSON：",
		err instanceof Error ? err.message : err,
	);
	process.exit(1);
}

fs.writeFileSync(contractsPath, `${JSON.stringify(parsed, null, 2)}\n`);
console.log("[gen-contracts] 已根据 CONTRACTS_JSON 环境变量生成 contracts.json。");
