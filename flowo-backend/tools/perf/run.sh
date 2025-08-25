#!/usr/bin/env bash
set -euo pipefail

CMD=${1:-build}           # build | run
CONFIG_PATH=${2:-tools/perf/config.example.yaml}
OUT_DIR=${3:-}
MODE=${4:-}

if command -v go >/dev/null 2>&1; then
  if [[ "$CMD" == "build" ]]; then
    mkdir -p tools/perf/bin
    go build -o tools/perf/bin/perf ./tools/perf
    echo "Built tools/perf/bin/perf"
    exit 0
  fi
  if [[ -n "$OUT_DIR" && -n "$MODE" ]]; then
    go run ./tools/perf -config "$CONFIG_PATH" -out "$OUT_DIR" -mode "$MODE"
  elif [[ -n "$OUT_DIR" ]]; then
    go run ./tools/perf -config "$CONFIG_PATH" -out "$OUT_DIR"
  elif [[ -n "$MODE" ]]; then
    go run ./tools/perf -config "$CONFIG_PATH" -mode "$MODE"
  else
    go run ./tools/perf -config "$CONFIG_PATH"
  fi
  exit 0
fi

echo "Go not found locally. Running via Docker..." >&2
IMAGE=golang:1.24

DOCKER_ARGS=(
  --rm
  -v "$(pwd)":"/workspace"
  -w "/workspace"
  -e CGO_ENABLED=0
)

if [[ "$CMD" == "build" ]]; then
  docker run "${DOCKER_ARGS[@]}" $IMAGE go build -o tools/perf/bin/perf ./tools/perf
  echo "Built tools/perf/bin/perf (via Docker)"
  exit 0
fi

docker run "${DOCKER_ARGS[@]}" $IMAGE go run ./tools/perf -config "$CONFIG_PATH" ${OUT_DIR:+-out "$OUT_DIR"} ${MODE:+-mode "$MODE"}


