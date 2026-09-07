# Backend

Ruang untuk layanan FastAPI dan akses PostgreSQL/PostGIS. Belum ada endpoint, model, migrasi, atau pemrosesan spasial pada tahap struktur.

```text
app/
  api/       # router FastAPI dan dependensi request/response
  core/      # konfigurasi aplikasi, keamanan, logging, dan konstanta
  db/        # koneksi/session database dan repository bersama
  models/    # model persistence ORM/representasi tabel
  schemas/   # schema request/response dan validasi
  services/  # aturan aplikasi: stasiun, jadwal, fasilitas, emergency, AI
  spatial/   # query/operasi PostGIS dan orkestrasi analisis spasial
tests/       # pengujian unit, integrasi, dan API
alembic/
  versions/  # migrasi skema PostgreSQL/PostGIS di masa mendatang
```

Routing, isochrone, Safety Score, dan AI dipisahkan sebagai service/spatial concern ketika kontrak API dan keputusan teknis PRD telah difinalkan.
