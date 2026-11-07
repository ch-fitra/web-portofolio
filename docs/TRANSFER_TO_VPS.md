# Memindahkan data saat ini ke VPS Linux (Node.js langsung)

Kode di GitHub dan data website adalah dua hal terpisah. Push kode beserta script ini ke GitHub. Transfer backup terenkripsi dan kuncinya secara privat melalui SSH/SFTP; jangan commit backup, kunci, atau environment.

Backup mencakup profil/pengaturan, semua proyek (published, draft, archived), semua skill/sertifikat yang benar-benar tersimpan, media yang terdaftar di database, akun, riwayat revisi, audit dan pesan lama. Status tampil/sembunyi tetap sama. Password Studio dan IP hash secret ikut dipindahkan di dalam backup terenkripsi. Sesi login dan rate limit tidak dipindahkan: login kembali setelah deployment. Aset/logo yang berada dalam kode ikut Git.

## 1. Buat snapshot terbaru di komputer ini

Di folder project, dengan PostgreSQL berjalan dan `.env.local` tersedia:

```powershell
npm run transfer:export
```

Hasilnya dua file di `.local/transfers/`: `TIMESTAMP.portfolio` (backup AES-256-GCM) dan `TIMESTAMP.key` (kunci). Simpan keduanya dengan aman, kirim kunci lewat jalur terpisah bila memungkinkan. Tanpa kunci, backup tidak dapat dipulihkan. Jalankan ulang export jika ada perubahan data setelah snapshot ini. Script membaca database langsung; tidak mengandalkan file seed atau data contoh.

Memeriksa isi tanpa membuka informasi rahasia:

```powershell
npm run transfer:inspect -- --bundle .local/transfers/TIMESTAMP.portfolio --key .local/transfers/TIMESTAMP.key
```

Export menahan perubahan konten sebentar sambil mengambil snapshot database dan media. Jika file media yang tercatat hilang, export gagal. Batas paket ini 128 MiB data mentah (256 MiB JSON); untuk koleksi lebih besar gunakan backup streaming PostgreSQL/media oleh administrator. Gunakan PostgreSQL 18 dan Node.js 24 untuk alur ini. `PG_BIN` dapat menunjuk folder `pg_dump`/`pg_restore` jika tidak berada di PATH.

## 2. Siapkan checkout dan database kosong di VPS

Install Node.js 24, PostgreSQL 18 beserta `pg_dump`/`pg_restore`, dan Nginx. Clone **commit kode yang sama dengan saat export** ke `/srv/portfolio-source`, lalu:

```bash
cd /srv/portfolio-source
npm ci
mkdir -p .local/transfers
chmod 700 .local .local/transfers
```

Transfer pasangan file backup ke `.local/transfers/` melalui SFTP/SSH dan beri permission `600`. Database PostgreSQL harus database baru khusus portfolio, misalnya `portfolio`, bukan database aplikasi lain. Buat database itu melalui akun administrator PostgreSQL; pastikan autentikasi TCP akun migrator sudah dikonfigurasi.

```bash
sudo -u postgres createdb portfolio
cp .env.example .local/restore.env
chmod 600 .local/restore.env
```

Edit `.local/restore.env` secara privat. Isi empat URL dengan **host, port, dan nama database target yang sama**:

```dotenv
DATABASE_URL=postgresql://portfolio_public:PASSWORD_BARU_1@127.0.0.1:5432/portfolio
OWNER_DATABASE_URL=postgresql://portfolio_owner:PASSWORD_BARU_2@127.0.0.1:5432/portfolio
AUTH_DATABASE_URL=postgresql://portfolio_auth:PASSWORD_BARU_3@127.0.0.1:5432/portfolio
MIGRATION_DATABASE_URL=postgresql://postgres:PASSWORD_ADMIN_DATABASE@127.0.0.1:5432/portfolio
MEDIA_ROOT=/srv/portfolio/storage/media
TRUST_PROXY=true
```

Ganti placeholder dengan password kuat dan URL-encode karakter khusus pada password URL. Akun migrator membutuhkan superuser untuk provisioning role, snapshot dan pemulihan tabel dengan RLS. Akun tersebut tidak dipakai aplikasi. Tiga role runtime dibuat otomatis oleh migrasi. Nama role berlaku satu cluster PostgreSQL; gunakan cluster khusus bila role bernama sama sudah dipakai aplikasi lain, karena migrasi mengatur ulang password role tersebut.

`ADMIN_PASSWORD` dan `IP_HASH_SECRET` target akan diambil dari backup; tidak perlu menggantinya di file restore. Jalankan perintah dari shell yang tidak memiliki variabel koneksi database lama: variabel shell mendapat prioritas atas `--env`.

## 3. Restore dan verifikasi otomatis

Buat direktori `/srv/portfolio/storage` dengan akses tulis untuk pengguna yang menjalankan restore. `MEDIA_ROOT` harus baru/kosong. Lalu jalankan dari checkout:

```bash
npm run transfer:restore -- \
  --env .local/restore.env \
  --bundle .local/transfers/TIMESTAMP.portfolio \
  --key .local/transfers/TIMESTAMP.key \
  --site-url https://domain-anda.com \
  --runtime-out .local/transfers/runtime.env
```

Restore memeriksa keaslian paket, kecocokan migrasi dan database kosong, menjalankan migrasi, memulihkan database/media, lalu membandingkan jumlah baris serta SHA-256 isi setiap tabel dengan sumber. Hasil sukses mencantumkan `"verified": true`. File `runtime.env` berisi konfigurasi aplikasi tanpa kredensial migrator. **Jangan menjalankan `db:seed`, `skills:import`, atau `projects:import-linkedin` setelah restore**, karena data asli sudah lengkap.

Script menolak database sumber, database yang sudah berisi tabel, direktori media yang tidak kosong dan file runtime yang sudah ada. Tidak ada truncate/drop/overwrite otomatis. Jika restore gagal setelah migrasi mulai, jangan menyalakan aplikasi; periksa penyebabnya dan ulangi ke database serta direktori media baru. Database parsial tidak ditimpa otomatis.

## 4. Build di Linux dan jalankan

Build langsung di VPS Linux agar dependensi native sesuai sistem operasi. Jangan menyalin `node_modules` atau hasil standalone dari Windows.

```bash
cd /srv/portfolio-source
npm run build
sudo mkdir -p /srv/portfolio /etc/portfolio
sudo cp -a .next/standalone/. /srv/portfolio/
sudo mkdir -p /srv/portfolio/.next/static
sudo cp -a .next/static/. /srv/portfolio/.next/static/
sudo mkdir -p /srv/portfolio/.next/cache
sudo install -m 600 -o portfolio -g portfolio .local/transfers/runtime.env /etc/portfolio/runtime.env
sudo chown -R portfolio:portfolio /srv/portfolio/storage
sudo chown -R portfolio:portfolio /srv/portfolio/.next/cache
sudo install -m 644 deploy/portfolio.service /etc/systemd/system/portfolio.service
sudo systemctl daemon-reload
sudo systemctl enable --now portfolio
```

Buat user/group sistem `portfolio` terlebih dahulu jika belum ada. Contoh di atas memakai service yang tersedia di `deploy/portfolio.service` dan path `/srv/portfolio`; sesuaikan jika memakai path berbeda. Kode standalone harus dapat dibaca user `portfolio`. Direktori `.next/cache` harus dapat ditulis untuk cache gambar Next.js. Saat pembaruan deployment berikutnya, hentikan service sebelum mengganti berkas kode dan pertahankan direktori `storage`.

Konfigurasikan Nginx dari `deploy/nginx.conf`, sesuaikan domain dan sertifikat TLS. Node mendengarkan `127.0.0.1:3000`; hanya Nginx yang dibuka ke internet. `TRUST_PROXY=true` hanya benar ketika Nginx menimpa header alamat IP seperti contoh konfigurasi. Aktifkan HTTPS agar cookie login produksi bekerja.

Periksa:

```bash
sudo systemctl status portfolio
sudo journalctl -u portfolio -n 50 --no-pager
```

Buka website dengan ukuran layar yang sama seperti lokal. Periksa About, Skills, tiga proyek publik, halaman seluruh proyek, kontak, serta login `/admin` dengan password sebelumnya. Draft/arsip tetap tidak muncul di publik. Tampilan responsif mengikuti ukuran layar dan font browser, sementara konten tersimpan harus sama. Pengujian restore lokal sudah dilakukan; koneksi domain, TLS dan konfigurasi service tetap perlu diperiksa di VPS sesungguhnya.

Setelah berhasil, simpan backup dan kunci di penyimpanan privat yang terpisah dari web root, dan hapus salinan kredensial migrator di server jika tidak diperlukan lagi. Untuk perubahan data berikutnya, lakukan backup baru; push Git saja tidak memperbarui isi database.
