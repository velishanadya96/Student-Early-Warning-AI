#!/bin/sh
# Pulihkan database dari file hasil backup-db.sh. MENIMPA data yang ada.
#   ./scripts/restore-db.sh backups/sew-YYYYMMDD-HHMMSS.sql.gz
set -eu
cd "$(dirname "$0")/.."
[ $# -eq 1 ] && [ -f "$1" ] || { echo "Pemakaian: $0 <file.sql.gz>" >&2; exit 1; }
printf "Ini akan MENIMPA database student_early_warning. Lanjutkan? (ketik 'ya'): "
read -r answer
[ "$answer" = "ya" ] || { echo "Dibatalkan."; exit 1; }
docker compose exec -T db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "DROP DATABASE IF EXISTS student_early_warning; CREATE DATABASE student_early_warning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci" 2>/dev/null'
gunzip -c "$1" | docker compose exec -T db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" student_early_warning 2>/dev/null'
echo "Pemulihan selesai dari $1. Restart api bila perlu: docker compose restart api"
