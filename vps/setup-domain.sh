#!/usr/bin/env bash
# Pasang domain + HTTPS untuk dashboard di Nginx host.
# Pemakaian:  sudo ./vps/setup-domain.sh domainmu.com email@kamu.com
# Prasyarat:  DNS A record tabungan.<domain> sudah mengarah ke IP VPS.
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="$SCRIPT_DIR/nginx/cedut.conf.template"
SITE_NAME="cedut"
HTPASSWD="/etc/nginx/cedut.htpasswd"

log() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

[ -n "$DOMAIN" ] && [ -n "$EMAIL" ] || die "Pemakaian: sudo $0 domainmu.com email@kamu.com"
[ "$(id -u)" -eq 0 ] || die "Jalankan dengan sudo."
command -v nginx >/dev/null || die "Nginx tidak ditemukan di host."
[ -d /etc/nginx/sites-available ] || die "/etc/nginx/sites-available tidak ada. Config Nginx ini bukan gaya Debian/Ubuntu; pasang manual dari $TEMPLATE."

WEB_PORT="$(grep -E '^WEB_PORT=' "$SCRIPT_DIR/.env" 2>/dev/null | cut -d= -f2 || true)"
WEB_PORT="${WEB_PORT:-8081}"

log "Cek DNS"
VPS_IP="$(curl -4 -fsS https://ifconfig.me || true)"
for sub in tabungan; do
  RESOLVED="$(getent ahostsv4 "$sub.$DOMAIN" | awk 'NR==1{print $1}' || true)"
  echo "$sub.$DOMAIN -> ${RESOLVED:-tidak ditemukan} (IP VPS: ${VPS_IP:-?})"
  [ -n "$RESOLVED" ] || die "DNS $sub.$DOMAIN belum aktif. Tambahkan A record di Rumahweb lalu tunggu propagasi."
done

log "Password untuk dashboard (tabungan.$DOMAIN)"
if [ -f "$HTPASSWD" ]; then
  echo "File $HTPASSWD sudah ada, dilewati. Hapus file itu untuk membuat ulang."
else
  read -rp "Username: " AUTH_USER
  read -rsp "Password: " AUTH_PASS; echo
  [ -n "$AUTH_USER" ] && [ -n "$AUTH_PASS" ] || die "Username/password tidak boleh kosong."
  printf '%s:%s\n' "$AUTH_USER" "$(openssl passwd -apr1 "$AUTH_PASS")" > "$HTPASSWD"
  chown root:www-data "$HTPASSWD" 2>/dev/null || true
  chmod 640 "$HTPASSWD"
fi

log "Pasang config Nginx"
sed -e "s/__DOMAIN__/$DOMAIN/g" -e "s/__WEB_PORT__/$WEB_PORT/g" "$TEMPLATE" > "/etc/nginx/sites-available/$SITE_NAME"
ln -sf "/etc/nginx/sites-available/$SITE_NAME" "/etc/nginx/sites-enabled/$SITE_NAME"
nginx -t || die "Config Nginx tidak valid. Tidak ada yang di-reload."
systemctl reload nginx

log "Pasang sertifikat HTTPS (Let's Encrypt)"
if ! command -v certbot >/dev/null; then
  apt-get update -qq && apt-get install -y -qq certbot python3-certbot-nginx
fi
certbot --nginx --non-interactive --agree-tos --redirect -m "$EMAIL" \
  -d "tabungan.$DOMAIN"

log "Selesai"
echo "Dashboard : https://tabungan.$DOMAIN"
