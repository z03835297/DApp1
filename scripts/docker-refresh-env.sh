#!/usr/bin/env sh
# 修改 .env.local、contracts.json（或其它 ENV_FILE）后，让 Docker 使用新配置：
# 重新构建镜像（写入 NEXT_PUBLIC_* 与合约地址）并强制重建容器。
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec sh "$ROOT/scripts/run-docker.sh" refresh "$@"
