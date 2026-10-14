# KabarKu

Papan buletin untuk catatan (post-it dan kertas lain), foto polaroid, stiker, dan lagu latar. Bisa dibagikan lewat tautan lihat atau tautan edit.

## Jalankan
```
npm install
npm run dev
```
Tanpa pengaturan tambahan, aplikasi berjalan di mode pratinjau. Data tersimpan di browser sendiri.

## Agar bisa dibagikan (Supabase, paket gratis)
1. Buat proyek di supabase.com.
2. Buka SQL Editor, jalankan isi `supabase/migrations/001_init.sql`.
3. Salin `.env.example` menjadi `.env`, isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` (Project Settings, API).
4. Jalankan ulang `npm run dev`.

Jalankan juga `003_cover_image.sql`, `004_rate_limit.sql`, dan `005_audio_limits.sql` (batas lagu 20 MB) di SQL Editor.

Batas paket gratis Supabase: 500 MB database, 1 GB penyimpanan. Proyek dijeda setelah 7 hari tanpa aktivitas. Buka papan sebelum hari kejutan. Foto dikompres otomatis. Lagu maksimal 20 MB (mp3, m4a, aac, ogg, wav, webm).

## Deploy gratis
Cloudflare Pages, Netlify, atau Vercel. Perintah build: `npm run build`. Folder: `dist`. Isi dua variabel `VITE_` di pengaturan hosting. Tambahkan aturan SPA agar `/b/*` dan `/e/*` membuka `index.html` (Netlify: berkas `_redirects` berisi `/* /index.html 200`, sudah ada di `public/`).

## Cara kerja izin
- `/e/<token>`: boleh tambah, geser, ubah, hapus.
- `/b/<token>`: hanya melihat dan mendengar lagu.
- Tabel database tertutup. Semua akses lewat fungsi yang memeriksa token.
- Siapa pun yang punya tautan edit bisa mengubah papan. Bagikan dengan hati-hati.
