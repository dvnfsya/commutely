# Frontend

Ruang untuk aplikasi WebGIS berbasis Next.js, TypeScript, Tailwind CSS, dan MapLibre GL. Belum ada kode aplikasi pada tahap struktur.

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
