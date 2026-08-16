#!/usr/bin/env bash
# Package HaizhuProxy source for delivery
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="/tmp/haizhuproxy-src-${STAMP}"
mkdir -p "$OUT/frontend"
cd "$ROOT"
cp -r DESIGN.md README.md docker-compose.yml Makefile "$OUT"/
cp -r backend "$OUT/backend"
cp -r frontend/src frontend/index.html frontend/vite.config.ts frontend/tsconfig.json frontend/tsconfig.app.json frontend/tsconfig.node.json frontend/package.json frontend/package-lock.json frontend/Dockerfile "$OUT/frontend/"
find "$OUT" -name '__pycache__' -type d -prune -exec rm -rf {} + 2>/dev/null || true
find "$OUT" -name '.pytest_cache' -type d -prune -exec rm -rf {} + 2>/dev/null || true
rm -rf "$OUT/backend/data" "$OUT/frontend/dist"
TARBALL="/tmp/haizhuproxy-${STAMP}.tar.gz"
tar -czf "$TARBALL" -C /tmp "$(basename "$OUT")"
echo "package: $TARBALL"
echo "dir: $OUT"
