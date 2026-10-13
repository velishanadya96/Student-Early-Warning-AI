#!/bin/sh
# Cadangkan database MySQL dari docker compose ke file .sql.gz.
#   ./scripts/backup-db.sh [folder_tujuan]        (default: ./backups)
# Pulihkan:   ./scripts/restore-db.sh backups/sew-YYYYMMDD-HHMMSS.sql.gz
set -eu
cd "$(dirname "$0")/.."
DEST="${1:-backups}"
mkdir -p "$DEST"
FILE="$DEST/sew-$(date +%Y%m%d-%H%M%S).sql.gz"
docker compose exec -T db sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines student_early_warning 2>/dev/null' | gzip > "$FILE"
# File kosong/kecil berarti dump gagal (mis. container mati).
if [ "$(wc -c < "$FILE")" -lt 500 ]; then
  rm -f "$FILE"
  echo "Backup gagal: hasil dump kosong. Pastikan 'docker compose up' berjalan." >&2
  exit 1
fi
echo "Backup tersimpan: $FILE"
