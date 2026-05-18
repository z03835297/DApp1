#!/usr/bin/env sh
# 一键：准备 env 文件 → docker compose 构建并启动（默认）
#
# 默认使用项目根目录的 .env.local（与 Next 本地开发一致）。
# 若未设置 ENV_FILE 且缺少 .env.local，则从 .env.local.example 复制一份。
# Docker 构建须已有 contracts.json（见 ensure_contracts）。
#
# 用法:
#   ./scripts/run-docker.sh           # 确保 env 文件存在，build + up -d
#   ./scripts/run-docker.sh build     # 仅构建
#   ./scripts/run-docker.sh up        # 构建并后台启动（同上）
#   ./scripts/run-docker.sh down      # 停止并移除容器
#   ./scripts/run-docker.sh logs      # 跟踪日志
#   ./scripts/run-docker.sh rebuild   # 无缓存构建并启动
#   ./scripts/run-docker.sh refresh   # 改 .env.local 或 contracts.json 后：重建镜像 + 强制换新容器
#   ./scripts/run-docker.sh contracts # 同上（别名，便于改合约地址后执行）
#
# 显式指定 env 文件：
#   ENV_FILE=.env.production ./scripts/run-docker.sh

set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

EXAMPLE_ENV=".env.local.example"
CMD="${1:-up}"

# 未设置 ENV_FILE 时固定使用 .env.local（可自行 ENV_FILE=.env 覆盖）
if [ -z "${ENV_FILE:-}" ]; then
	ENV_FILE=".env.local"
fi

export COMPOSE_ENV_FILE="$ENV_FILE"

ensure_contracts() {
	if [ ! -f "contracts.json" ]; then
		echo "错误：缺少 contracts.json（链上合约地址）。Docker 构建需要该文件。" >&2
		echo "  cp contracts.example.json contracts.json" >&2
		echo "编辑 contracts.json 填写真实地址后再执行构建。" >&2
		exit 1
	fi
}

ensure_env() {
	if [ ! -f "$ENV_FILE" ]; then
		if [ ! -f "$EXAMPLE_ENV" ]; then
			echo "错误：缺少 $ENV_FILE，且不存在模板 $EXAMPLE_ENV。" >&2
			exit 1
		fi
		cp "$EXAMPLE_ENV" "$ENV_FILE"
		echo "已创建 $ENV_FILE（从 $EXAMPLE_ENV 复制）。请按需编辑 API 地址等变量。"
	fi
}

compose() {
	docker compose --env-file "$ENV_FILE" "$@"
}

compose_maybe() {
	if [ -f "$ENV_FILE" ]; then
		docker compose --env-file "$ENV_FILE" "$@"
	else
		unset COMPOSE_ENV_FILE || true
		docker compose "$@"
	fi
}

case "$CMD" in
	build)
		ensure_env
		ensure_contracts
		compose build
		;;
	up)
		ensure_env
		ensure_contracts
		compose build
		compose up -d
		echo "应用: http://localhost:8080"
		echo "查看日志: ./scripts/run-docker.sh logs"
		;;
	down)
		compose_maybe down
		;;
	logs)
		compose_maybe logs -f
		;;
	rebuild)
		ensure_env
		ensure_contracts
		compose build --no-cache
		compose up -d
		echo "应用: http://localhost:8080"
		;;
	refresh|contracts)
		ensure_env
		ensure_contracts
		echo "按当前 contracts.json 与 $ENV_FILE 重新构建镜像并重建容器 …"
		compose build
		compose up -d --force-recreate
		echo "应用: http://localhost:8080"
		echo "若 NEXT_PUBLIC_* 或合约地址仍异常，请尝试: $0 rebuild（无缓存构建）"
		;;
	-h | --help | help)
		cat <<'EOF'
用法:
  ./scripts/run-docker.sh           确保 env 文件存在，build + up -d
  ./scripts/run-docker.sh build     仅构建
  ./scripts/run-docker.sh up        同上（默认）
  ./scripts/run-docker.sh down      停止并移除容器
  ./scripts/run-docker.sh logs      跟踪日志
  ./scripts/run-docker.sh rebuild   无缓存构建并启动
  ./scripts/run-docker.sh refresh   修改 .env.local 或 contracts.json 后：重建 + 强制换新容器
  ./scripts/run-docker.sh contracts 与 refresh 相同（改合约配置后常用）

默认读取项目根目录的 .env.local；也可用 ENV_FILE 指定其它路径。
若不存在 .env.local，会从 .env.local.example 自动生成一份。
构建前须存在已配置的 contracts.json（模板：contracts.example.json）。

注意：NEXT_PUBLIC_* 与 contracts.json 均在构建阶段打进产物；修改后须 refresh/rebuild，勿仅重启容器。
不要将 .env COPY 进 Dockerfile（会留在镜像层里）；本仓库通过 compose 的 env_file 在运行时注入。
EOF
		;;
	*)
		echo "未知命令: $CMD。运行: $0 --help" >&2
		exit 1
		;;
esac
