# ch-fitra · Graphite Intelligence

Portfolio Next.js App Router dengan Owner Studio, **PostgreSQL lokal**, dan deployment di server sendiri. DBeaver adalah klien DBMS untuk mengelola PostgreSQL; aplikasi terhubung langsung lewat `pg`. Tidak membutuhkan Supabase atau Vercel.

## Mulai di Windows

Prasyarat: Node.js 24 LTS, PostgreSQL 18 (server + command-line tools), npm, DBeaver opsional.

```powershell
npm ci
npm run db:local
npm run db:migrate
npm run db:seed
npm run owner:setup
npm run dev
```

`db:local` membuat **cluster pengembangan terpisah** di `.local/postgres-dev`, bind `127.0.0.1:55432`, database `portfolio`. Service PostgreSQL Anda di port 5432 tidak diubah. Password acak ditulis hanya ke `.env.local` yang di-ignore. Gunakan `PG_BIN` jika lokasi PostgreSQL berbeda. Di Linux, jalankan initdb sebagai user biasa pemilik data, bukan root. `npm run db:stop` menghentikan hanya cluster ini. `npm run db:local` dapat menyalakannya kembali.

Website: http://localhost:3000 · Studio: http://localhost:3000/admin. Buat akun owner lewat `owner:setup`; tidak ada password default, public registration, atau reset email. Menjalankan ulang perintah tersebut mengganti password dan mencabut semua sesi. Password dimasukkan tersembunyi melalui terminal.

Untuk memakai database Anda yang sudah ada: buat database khusus kosong `portfolio`, salin `.env.example` ke `.env.local`, isi URL dan password kuat yang berbeda untuk tiga role runtime, serta URL migrator dengan hak membuat role/schema. Jalankan migrate, seed, owner:setup. Migrasi bersifat versioned dan transactional; tidak menghapus database. Jangan menunjuk migrasi ke database aplikasi lain.

## Hubungkan DBeaver

New Database Connection → PostgreSQL → host `127.0.0.1`, port `55432`, database `portfolio`. Isi username/password dari URL di `.env.local` melalui UI DBeaver. Gunakan `portfolio_owner` untuk mengelola konten; `portfolio_public` untuk memverifikasi hanya published yang terbaca. Kredensial `portfolio_migrator` hanya untuk administrasi/migrasi; jangan dipasang di runtime aplikasi. Tidak ada keharusan menginstal extension DBeaver.

## Penggunaan

- Kelola profil, foto Home/About, crop vertikal, CV PDF, kapabilitas, dan tautan di **Profile & portraits**.
- Tambahkan media di **Media library**. Aset privat sampai digunakan di konten publik.
- Buat case study, chapter, dan block; simpan draft, preview, lalu ubah status ke published. Ubah ke draft/archived untuk menghilangkannya dari publik dan sitemap.
- Skill dan sertifikat tidak di-seed otomatis. Sertakan bukti dan kontribusi yang benar.
- Form kontak menyimpan ke inbox privat. Relay email opsional mengirim notifikasi; UI membedakan pesan tersimpan dari notifikasi accepted/failed.
- Seed hanya menambahkan profil awal yang dapat diedit dan satu **draft** kandidat dari PRD. Foto menggunakan monogram sampai owner mengunggah foto asli; kedua field independen.

Panduan lengkap: [CMS](docs/CMS_USER_GUIDE.md), [arsitektur](docs/ARCHITECTURE.md), [rencana](docs/IMPLEMENTATION_PLAN.md), [hasil pengujian](docs/TEST_REPORT.md).

## Verifikasi

```powershell
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run test:e2e
npm run build
```

Integration/E2E hanya berjalan pada cluster terisolasi port 55432. E2E membuat akun owner sementara lalu menghapusnya; jalankan **sebelum** `owner:setup`. Jika akun sudah ada, pengujian menolak menggantinya. Chrome harus tersedia (`channel: chrome`). Jangan menjalankan pengujian mutasi terhadap produksi. Untuk E2E setelah memiliki akun nyata, gunakan checkout/database pengujian baru. Tes CI dasar tidak memerlukan database; integration/E2E dijalankan lokal.

## Deploy ke server sendiri

Tidak ada deployment yang dilakukan otomatis. Contoh Linux + Nginx disediakan; sesuaikan dengan server Anda.

1. Install Node 24 dan PostgreSQL 18. Buat database khusus dan isi konfigurasi staging/production; migrasikan dari checkout dengan kredensial migrator, kemudian seed dan owner:setup. Simpan backup sebelum migrasi berikutnya.
2. `npm ci` lalu `npm run build`. Build standalone tidak memerlukan database aktif. **Jangan mengirim `.env.local` atau `.local/` ke server/artifact**.
3. Salin isi `.next/standalone/` ke `/srv/portfolio/` dan `.next/static/` ke `/srv/portfolio/.next/static/`. Tidak ada direktori `public` tambahan yang diperlukan. Buat `/srv/portfolio/storage/media` yang dapat ditulis user `portfolio`.
4. Simpan hanya variabel runtime di `/etc/portfolio/runtime.env`, permission 600. **Hapus `MIGRATION_DATABASE_URL` dari runtime.** Set `SITE_URL=https://domain-anda`, `MEDIA_ROOT=/srv/portfolio/storage/media`, `IP_HASH_SECRET` acak, `TRUST_PROXY=true` jika Nginx meng-overwrite header IP. Akun PostgreSQL runtime bukan superuser/BYPASSRLS dan bukan pemilik tabel.
5. Pasang `deploy/portfolio.service` dan `deploy/nginx.conf`, sesuaikan domain/sertifikat/path, aktifkan service. Bind Node ke localhost, firewall database, gunakan TLS. Secure cookie produksi membutuhkan HTTPS, termasuk staging.

Alternatif Docker: `docker compose -f deploy/compose.yml up -d --build`. Buat `.env.production` berisi variabel runtime saja. PostgreSQL tetap service Anda sendiri; dari container gunakan `host.docker.internal` dengan pg_hba/firewall terbatas ke network container, atau gunakan private DB hostname. Port database tidak perlu terbuka ke internet. Volume `portfolio_media` persisten. Migrasi dan owner setup dijalankan dari checkout, bukan image runtime. Docker/Nginx/systemd adalah contoh konfigurasi, belum dijalankan di server Anda.

## Email opsional, retensi, backup

`EMAIL_RELAY_URL`, `EMAIL_RELAY_TOKEN`, `NOTIFY_TO` dapat menghubungkan relay email milik Anda. Server POST JSON `{to, replyTo, subject, text, idempotencyKey}` dengan bearer token. Relay harus membalas 2xx hanya sesudah provider menerima notifikasi. Tidak ada relay bawaan/provider yang diklaim aktif. Pesan tetap tersimpan jika relay gagal; status terlihat di inbox. Relay harus memperlakukan body sebagai teks dan mendukung idempotency key.

Jadwalkan harian `node --env-file=/etc/portfolio/runtime.env scripts/retention.mjs` dari checkout operasional untuk menghapus pesan melewati retensi di Site Settings (default 180 hari). Jangan mengaktifkan jadwal sebelum kebijakan retensi Anda ditinjau. Audit log disimpan 365 hari. Bersihkan sesi kedaluwarsa/rate-limit secara berkala lewat script maintenance.

Backup database dengan `pg_dump --format=custom` menggunakan kredensial melalui environment/pgpass, dan backup direktori/volume media dalam waktu yang konsisten. Enkripsi backup, batasi akses dan retensinya. Uji restore ke database terpisah: jalankan migrasi/provision role di target kosong, lalu `pg_restore --no-owner --no-acl --data-only` sesuai prosedur DBA (jangan menimpa produksi). Verifikasi profile, media, published/draft, dan owner login. Backup data dan konfigurasi rahasia disimpan terpisah. Tidak ada perintah restore destruktif otomatis.

## Batas rilis

Owner perlu menyiapkan dua foto asli, CV/kontak, bukti sertifikat, serta setidaknya tiga case study nyata yang sudah ditinjau. Phase 2 AI belum diimplementasikan. Pengukuran field Core Web Vitals, audit screen reader lintas browser, pengujian backup/restore dan TLS produksi masih memerlukan lingkungan target; lihat laporan pengujian.
