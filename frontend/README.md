# Frontend

Aplikasi prototype WebGIS berbasis Next.js App Router, TypeScript, Tailwind CSS, dan MapLibre GL. Halaman utama merangkai komponen yang sudah ada dengan data dummy.

## Menjalankan frontend

Gunakan Node.js 20.9 atau lebih baru. Jalankan dari direktori `frontend`:

```sh
npm ci
npm run dev
```

Buka http://localhost:3000. Pada PowerShell yang memblokir `npm.ps1`, gunakan `npm.cmd` sebagai pengganti `npm`.

Opsional: salin `.env.example` ke `.env.local` dan isi `NEXT_PUBLIC_MAPID_STYLE_URL` dengan URL style MAPID Maps yang valid. Nilainya tersedia di browser; jangan masukkan kredensial sensitif. Restart dev server setelah mengubahnya; untuk production, build ulang. Jika kosong, halaman tetap berfungsi dan area peta menampilkan pesan konfigurasi.

```sh
npm run typecheck
npm run build
npm start
```

Tailwind menggunakan plugin PostCSS dan import CSS di `src/app/globals.css`; token visual tetap berasal dari `src/styles/tokens.css`. Font menggunakan fallback lokal dari token, tanpa mengunduh font saat build.

Pilih kartu/marker stasiun untuk memperbarui informasi dan Safety Score. Navigasi Stasiun/Rute mengganti isi panel. Pencarian rute masih menggunakan satu fixture tetap, bukan routing sebenarnya. Layer dan kontrol peta tersedia setelah style MAPID berhasil dimuat. Backend, AI, dan API data belum terhubung.

```text
src/
  app/                 # route, layout, dan halaman Next.js
  components/
    map/               # kanvas/pengendali MapLibre, marker, dan layer
    station/           # eksplorasi, kartu, dan detail stasiun
    routing/           # formulir pencarian, hasil, dan detail rute
    safety/            # Safety Score, indikator, dan visualisasi analisis
    schedule/          # pencarian dan tampilan jadwal KRL
    ai/                # panel/chat AI Assistant dan FAQ UI
    emergency/         # akses serta tampilan kontak darurat
    ui/                # komponen presentasional umum yang dapat digunakan ulang
  features/            # komposisi state/logic UI lintas komponen per use case
  hooks/               # React hooks bersama
  lib/
    map/               # adaptor dan utilitas MapLibre, bukan komponen UI
  types/               # tipe TypeScript bersama
  styles/              # gaya global dan token desain
public/                # aset statis frontend
```

Komponen fitur tidak boleh langsung mengakses database atau API pihak ketiga; integrasi akan ditempatkan pada lapisan client/service saat endpoint backend telah didefinisikan.
