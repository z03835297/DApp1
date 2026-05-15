#!/usr/bin/env sh
set -eu

IMAGE_NAME="${IMAGE_NAME:-token1-dapp}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
PORT="${PORT:-8080}"

exec docker run --rm -p "${PORT}:8080" "${IMAGE_NAME}:${IMAGE_TAG}"
