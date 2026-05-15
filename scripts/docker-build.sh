#!/usr/bin/env sh
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

IMAGE_NAME="${IMAGE_NAME:-token1-dapp}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo "Building ${IMAGE_NAME}:${IMAGE_TAG} ..."
docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .

echo "Done. Run: docker run --rm -p 8080:8080 ${IMAGE_NAME}:${IMAGE_TAG}"
# Or: docker compose up -d
