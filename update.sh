#!/usr/bin/env bash
# Jalankan di VPS: bash ~/projects/portofolio-web/update.sh
# Seluruh fungsi dibaca sebelum git memperbarui file script yang sedang berjalan.
main() {
set -Eeuo pipefail
umask 077

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
SERVICE="chfitra-portfolio"
cd "$ROOT"

fail() { printf '\nUpdate gagal: %s\n' "$*" >&2; exit 1; }

[[ "$(uname -s)" == Linux ]] || fail "File ini khusus server Linux, bukan laptop Windows."
for tool in git tar curl flock systemctl sudo; do
  command -v "$tool" >/dev/null || fail "Perintah $tool belum tersedia."
done

# Gunakan binary Node yang sama dengan service, tanpa mengganti versi aplikasi lain.
NODE_BIN="${PORTFOLIO_NODE_BIN:-/opt/nvm/versions/node/v24.16.0/bin}"
[[ -x "$NODE_BIN/node" && -x "$NODE_BIN/npm" ]] || fail "Node tidak ditemukan di $NODE_BIN. Atur PORTFOLIO_NODE_BIN jika lokasinya berubah."
export PATH="$NODE_BIN:$PATH"
[[ "$(node -p 'process.versions.node.split(".")[0]')" == 24 ]] || fail "Node.js 24 diperlukan."

mkdir -p .local
exec 9>.local/update.lock
flock -n 9 || fail "Update lain masih berjalan."
[[ -z "$(git status --porcelain --untracked-files=no)" ]] || fail "Ada perubahan kode di server yang belum di-commit. Selesaikan dahulu; file tidak akan ditimpa."
[[ "$(git branch --show-current)" == main ]] || fail "Checkout server harus berada di branch main."
[[ -r .local/transfers/runtime.env ]] || fail "Konfigurasi .local/transfers/runtime.env tidak ditemukan."
[[ -f .next/standalone/server.js ]] || fail "Versi aktif belum tersedia. File ini untuk update setelah instalasi pertama."
systemctl is-active --quiet "$SERVICE" || fail "Service $SERVICE belum aktif. Periksa sebelum update."
sudo -v

printf '\n[1/5] Mengambil kode terbaru dari GitHub...\n'
git fetch origin main
git merge-base --is-ancestor HEAD origin/main || fail "Riwayat server berbeda dari origin/main; update otomatis dibatalkan."
git diff --quiet HEAD origin/main -- db/migrations || fail "Ada perubahan migrasi database. Jalankan prosedur migrasi terlebih dahulu; update otomatis tidak mengubah database."
git merge --ff-only origin/main
COMMIT="$(git rev-parse --short HEAD)"

# Build terpisah: versi aktif tetap melayani pengunjung selama proses build.
WORK="$(mktemp -d "$ROOT/.local/update.XXXXXXXX")"
SWAPPED=0
STOPPED=0
SUCCESS=0

cleanup() {
  local result=$?
  trap - EXIT INT TERM
  if [[ "$SUCCESS" == 0 ]]; then
    if [[ "$SWAPPED" == 1 ]]; then
      printf '\nMengembalikan versi aplikasi sebelumnya...\n' >&2
      if sudo systemctl stop "$SERVICE" &&
         mv "$ROOT/.next" "$WORK/failed.next" &&
         mv "$WORK/previous.next" "$ROOT/.next"; then
        sudo systemctl start "$SERVICE" || true
      else
        printf 'Pemulihan otomatis gagal. Berkas versi sebelumnya ada di %s/previous.next\n' "$WORK" >&2
      fi
    elif [[ "$STOPPED" == 1 ]]; then
      # Gagal sebelum instalasi hasil build selesai.
      if [[ ! -e "$ROOT/.next" && -d "$WORK/previous.next" ]]; then
        mv "$WORK/previous.next" "$ROOT/.next" || true
      fi
      sudo systemctl start "$SERVICE" || true
    fi
    printf '\nUpdate tidak selesai. Log/build disimpan di %s\n' "$WORK" >&2
  else
    # Hapus hanya direktori sementara yang dibuat oleh proses ini.
    case "$WORK" in
      "$ROOT"/.local/update.*) rm -rf -- "$WORK" ;;
    esac
  fi
  exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

printf '\n[2/5] Menyiapkan dependensi dan membangun commit %s...\n' "$COMMIT"
mkdir "$WORK/source"
git archive HEAD | tar -x -C "$WORK/source"
(
  cd "$WORK/source"
  npm ci --include=dev
  npm run build
)

printf '\n[3/5] Menyiapkan aset standalone...\n'
BUILD="$WORK/source/.next"
[[ -f "$BUILD/standalone/server.js" ]] || fail "Build tidak menghasilkan standalone/server.js."
mkdir -p "$BUILD/standalone/.next/static"
cp -a "$BUILD/static/." "$BUILD/standalone/.next/static/"
if [[ -d "$WORK/source/public" ]]; then
  cp -a "$WORK/source/public" "$BUILD/standalone/public"
fi

printf '\n[4/5] Mengaktifkan versi baru...\n'
# Autentikasi sudo diperbarui setelah build agar tidak habis masa berlakunya.
sudo -v
sudo systemctl stop "$SERVICE"
STOPPED=1
mv "$ROOT/.next" "$WORK/previous.next"
mv "$BUILD" "$ROOT/.next"
SWAPPED=1
sudo systemctl start "$SERVICE"

printf '\n[5/5] Memeriksa respons website...\n'
HEALTHY=0
for ((attempt=1; attempt<=30; attempt++)); do
  if systemctl is-active --quiet "$SERVICE" &&
     [[ "$(curl --silent --output /dev/null --write-out '%{http_code}' --max-time 3 http://127.0.0.1:3000/ || true)" == 200 ]]; then
    HEALTHY=1
    break
  fi
  sleep 1
done
[[ "$HEALTHY" == 1 ]] || fail "Website tidak memberikan HTTP 200. Versi sebelumnya akan dipulihkan."
SUCCESS=1
printf '\nUpdate berhasil: commit %s. Website memberikan HTTP 200.\nhttps://chfitra.my.id\n' "$COMMIT"
printf 'Database, media, konfigurasi privat, dan tunnel tidak diubah.\n'
}

main "$@"
