#!/usr/bin/env bash
# Deploy / jalankan ulang Mas & Cece Wedding Saving di VPS.
# Pemakaian:  ./deploy.sh            -> tarik update dari GitHub lalu build & jalankan ulang
#             ./deploy.sh --no-pull  -> build & jalankan ulang tanpa git pull
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="$ROOT_DIR/vps"
BRANCH="${DEPLOY_BRANCH:-main}"

log() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

command -v docker >/dev/null || die "Docker belum terpasang. Lihat vps/README.md bagian Prasyarat."
docker compose version >/dev/null 2>&1 || die "Plugin 'docker compose' belum terpasang."
[ -f "$COMPOSE_DIR/.env" ] || die "vps/.env belum ada. Jalankan: cp vps/.env.example vps/.env lalu isi nilainya."

cd "$ROOT_DIR"

if [ "${1:-}" != "--no-pull" ]; then
  log "Menarik update terbaru dari GitHub (branch $BRANCH)"
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH" || die "git pull gagal. Ada perubahan lokal di VPS? Cek: git status"
fi

cd "$COMPOSE_DIR"
COMPOSE=(docker compose -f docker-compose.yml)
PROXY_NETWORK="$(grep -E '^PROXY_NETWORK=' .env | cut -d= -f2- | tr -d '"' || true)"
if [ -n "$PROXY_NETWORK" ]; then
  docker network inspect "$PROXY_NETWORK" >/dev/null 2>&1     || die "Network '$PROXY_NETWORK' (PROXY_NETWORK di vps/.env) tidak ada. Cek: docker network ls"
  COMPOSE+=(-f docker-compose.proxy.yml)
fi

log "Build & jalankan ulang container"
"${COMPOSE[@]}" up -d --build --remove-orphans

log "Membersihkan image lama"
docker image prune -f >/dev/null

log "Status container"
"${COMPOSE[@]}" ps

log "Selesai. Commit aktif: $(git -C "$ROOT_DIR" log -1 --format='%h %s')"
