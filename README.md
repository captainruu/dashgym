# Dash Gym Bali — Website

Struktur multi-halaman (bukan lagi 1 file HTML raksasa) untuk website DASH Gym Bali. Backend: **Firebase Firestore + Auth** (data member, packages, login admin).

## Struktur Folder

```
├── index.html          → Halaman utama publik (hero, about, facilities, packages, dll)
├── login.html           → Login member (pakai kode member)
├── admin-login.html     → Login admin (email + password, Firebase Auth)
├── member.html           → Dashboard member (perlu login member)
├── admin.html             → Dashboard admin (perlu login admin)
├── css/
│   ├── base.css          → Variabel warna, reset, tombol, modal, toast (dipakai semua halaman)
│   ├── public.css        → Styling khusus index.html
│   ├── member.css        → Styling khusus login.html, admin-login.html, member.html
│   └── admin.css         → Styling khusus admin.html
├── js/
│   ├── config.js          → Konfigurasi Firebase + data paket default
│   ├── utils.js            → Fungsi bantu umum (toast, loading, bahasa, modal, sesi member)
│   ├── db-members.js       → Query Firestore untuk data member
│   ├── db-packages.js      → Query Firestore untuk data paket harga
│   ├── auth.js              → Login member, login admin, logout, page guard
│   ├── card-generator.js    → Generate kartu member digital (canvas + QR)
│   ├── public-site.js       → Logic khusus index.html (hero slider, packages, chatbot)
│   ├── member-dashboard.js  → Logic khusus member.html
│   ├── admin-core.js        → Navigasi tab & overview admin.html
│   ├── admin-members.js     → CRUD member, diskon, export CSV
│   ├── admin-pricing.js     → Edit harga paket
│   └── admin-checkin.js     → Scanner QR untuk cek status member (lookup-only, tanpa log)
└── assets/images/          → Semua gambar (logo, favicon, foto hero, foto about)
```

**Catatan versi ini:** fitur Check-in Log (pencatatan riwayat kunjungan) dan Promo & Events (termasuk upload artwork ke Supabase Storage) sudah dihapus untuk menyederhanakan sistem. Yang tersisa dari fitur QR adalah tab "Scan" — cuma untuk mengecek status member (aktif/expired) tanpa mencatat apa pun ke database. Backend sekarang murni Firebase (Firestore + Auth), Supabase tidak lagi dipakai sama sekali.

## Cara Menjalankan

**Penting:** karena sekarang multi-halaman dan pakai ES Modules, file ini **tidak bisa** dibuka langsung dengan double-click (`file://`). Browser akan memblokir `import`/`export` dan kamera untuk QR scanner.

Jalankan lewat local web server, contoh:

```bash
# Python
python3 -m http.server 8000

# atau Node.js (perlu npm install -g http-server dulu)
http-server -p 8000
```

Lalu buka `http://localhost:8000` di browser.

Untuk **live/production**, upload semua file & folder ini ke hosting statis (GitHub Pages, Netlify, Vercel, dll) — otomatis dapat HTTPS, jadi kamera QR scanner juga akan berfungsi.

## Kredensial Backend

Firebase project: `dash-gym-database`

Config sudah ditanam di `js/config.js`. Kalau mau ganti project Firebase, cukup edit file itu saja — tidak perlu ubah file lain.

⚠️ Jangan lupa tambahkan domain hosting baru ke **Firebase Console → Authentication → Settings → Authorized domains**, supaya login admin tidak error `auth/unauthorized-domain`.

## Halaman & Alur Login

- Pengunjung biasa → `index.html` → klik "Login" → `login.html` (pakai kode member) → masuk ke `member.html`
- Staff/Admin → dari `login.html` klik "Staff / Admin Login" → `admin-login.html` (email+password) → masuk ke `admin.html`
- `member.html` dan `admin.html` otomatis redirect balik ke halaman login masing-masing kalau sesi belum/tidak valid

## Catatan Migrasi dari Versi 1-File

Versi sebelumnya adalah single-page app (SPA) — semua "halaman" sebenarnya `<div>` yang disembunyikan/ditampilkan pakai JavaScript dalam satu file. Versi ini benar-benar memecahnya jadi halaman terpisah, dengan penyesuaian:

- Sesi login member disimpan di `sessionStorage` (bukan variabel JS biasa) supaya tetap "ingat" saat pindah halaman
- Sesi login admin memakai Firebase Auth (otomatis persistent di browser)
- Semua gambar base64 raksasa diekstrak jadi file asli di `assets/images/` — lebih ringan dan bisa di-cache browser
