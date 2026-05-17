# WDB DApp (token1-dapp)

基于 [Next.js](https://nextjs.org) 的前端 DApp，对接以太坊主网（Ethereum）与 Sepolia 测试网，使用注入式浏览器钱包（wagmi + RainbowKit），**不依赖 WalletConnect**，因此无需配置 Reown / Project ID。

## 功能概览

- V1 / V2 合约交互（转账、铸造、提现等，见 `src/app` 与 `src/hooks`）
- 默认连接 **Ethereum**，可在 UI 中切换到 **Sepolia**（Sepolia 在导航处标有 **Test** 提示）
- 合约地址通过根目录 JSON 配置（见下文）

## 环境要求

- [Bun](https://bun.sh) 或 Node（与 Next 16 兼容的版本）
- 现代浏览器 + MetaMask / OKX / Rabby 等 EVM 浏览器扩展

## 快速开始

### 1. 安装依赖

```bash
bun install
```

### 2. 合约地址配置

复制模板并填写真实地址（`contracts.json` 已加入 `.gitignore`，不会提交到仓库）：

```bash
cp contracts.example.json contracts.json
# 编辑 contracts.json
```

结构为按 **链 ID** → **v1 / v2** → **TOKEN / USDT / VAULT**。`src/lib/constants.ts` 在构建时读取该文件。

### 3. 环境变量（可选）

参考 `.env.local.example`，在项目根目录创建 `.env.local`：

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_API_URL` | 后端 API 基地址，默认 `http://localhost:3000` |

### 4. 本地开发

```bash
bun dev
```

应用默认监听 **http://localhost:8080**（与 `package.json` 中 `dev` 脚本一致）。

### 5. 生产构建

```bash
bun run build
bun run start
```

生产模式同样使用端口 **8080**。

## 常用脚本

| 命令 | 说明 |
|------|------|
| `bun dev` | 开发服务器 |
| `bun run build` | 生产构建（含 `output: "standalone"`） |
| `bun run start` | 启动生产服务 |
| `bun run lint` | ESLint |
| `bun run docker:up` | `run-docker.sh`：按 `.env.local` 构建并启动 Compose |
| `bun run docker:down` | Compose 停止 |
| `bun run docker:logs` | Compose 日志 |
| `bun run docker:build` | 仅构建镜像（`scripts/docker-build.sh`） |
| `bun run docker:run` | 直接 `docker run` 镜像（`scripts/docker-run.sh`） |

## Docker 部署

- **Dockerfile**：多阶段构建（Bun 安装与构建 → Node 运行 standalone）
- **docker-compose.yml**：将容器 **8080** 映射到主机；默认使用根目录 **`.env.local`**（与本地 Next 一致）

推荐一键脚本（会自动用 `.env.local`，没有则从 `.env.local.example` 生成）：

```bash
./scripts/run-docker.sh
# 或：bun run docker:up
```

手动：

```bash
docker compose --env-file .env.local build
docker compose --env-file .env.local up -d
```

镜像构建时若缺少 `contracts.json`，会自动使用 `contracts.example.json` 占位；**生产环境建议在构建上下文中提供真实的 `contracts.json`**，或使用 CI 在构建前生成该文件。

更多说明见 `Dockerfile` 与 `docker-compose.yml` 内注释。

## 项目结构（节选）

```
├── context/appkit.tsx    # Wagmi + RainbowKit 等 Provider（沿用历史文件名）
├── contracts.example.json # 合约地址模板（可提交）
├── contracts.json         # 本地合约配置（勿提交）
├── docker-compose.yml
├── Dockerfile
├── scripts/
│   ├── docker-build.sh
│   ├── docker-run.sh
│   └── run-docker.sh      # 推荐使用：.env.local + compose 构建/启动
├── src/
│   ├── app/              # Next.js App Router 页面
│   ├── components/       # UI（含 ConnectButton 等）
│   ├── hooks/            # 合约与钱包相关 hooks
│   └── lib/
│       ├── wagmi.ts      # wagmi 配置（Mainnet + Sepolia，仅 injected）
│       ├── constants.ts  # ABI 与 CONTRACT_ADDRESS（从 contracts.json 加载）
│       └── ...
└── ...
```

仓库中的 `src/web/` 为另一套前端参考工程，已通过 `tsconfig.json` 排除，不参与本 Next 应用的 TypeScript 编译。

## 技术栈

- Next.js 16、React 19、TypeScript
- wagmi v2、viem、RainbowKit（仅浏览器注入钱包）
- ethers v6（部分逻辑通过 wagmi WalletClient 转接）

## 参考文档

- [Next.js Documentation](https://nextjs.org/docs)
- [wagmi](https://wagmi.sh/react/getting-started)
- [RainbowKit](https://www.rainbowkit.com/)
