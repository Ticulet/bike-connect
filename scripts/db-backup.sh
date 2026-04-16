#!/bin/bash
# Backup the bike_connect database to a timestamped pg_dump custom-format file.
# Restore with: pg_restore -h localhost -U bike_connect -d bike_connect --clean --if-exists <file>
set -euo pipefail
IFS=$'\n\t'

BACKUP_DIR="${BACKUP_DIR:-./backups}"
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-bike_connect}"
PGDATABASE="${PGDATABASE:-bike_connect}"
KEEP_N="${KEEP_N:-10}"

cleanup() {
    # Remove partial dumps on early exit; always return 0 so the EXIT trap
    # itself does not trigger the ERR trap.
    if [[ -n "${outfile:-}" && -f "$outfile" && ! -s "$outfile" ]]; then
        rm -f "$outfile"
    fi
    return 0
}
trap cleanup EXIT
trap 'echo "Error on line $LINENO" >&2; exit 1' ERR

mkdir -p "$BACKUP_DIR"

timestamp=$(date -u +"%Y%m%dT%H%M%SZ")
outfile="$BACKUP_DIR/bike_connect_${timestamp}.dump"

echo "Backing up $PGDATABASE -> $outfile" >&2

# Requires PGPASSWORD in env, or a .pgpass file
pg_dump \
    --host="$PGHOST" \
    --port="$PGPORT" \
    --username="$PGUSER" \
    --dbname="$PGDATABASE" \
    --format=custom \
    --no-owner \
    --no-privileges \
    --compress=6 \
    --file="$outfile"

size=$(du -h "$outfile" | cut -f1)
echo "Done. $size" >&2

# Keep only the N most recent backups (best-effort; do not fail the script)
prune_old_backups() {
    local pruned=0
    local line
    while IFS= read -r line; do
        if [[ -n "$line" && -f "$line" ]]; then
            rm -f -- "$line"
            pruned=$((pruned + 1))
        fi
    done < <(find "$BACKUP_DIR" -maxdepth 1 -name 'bike_connect_*.dump' -printf '%T@ %p\n' 2>/dev/null \
        | sort -rn \
        | tail -n +"$((KEEP_N + 1))" \
        | cut -d' ' -f2-)
    if [[ "$pruned" -gt 0 ]]; then
        echo "Pruned $pruned old backup(s) (keeping $KEEP_N most recent)." >&2
    fi
}

prune_old_backups || true
