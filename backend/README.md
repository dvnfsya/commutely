# Backend

Fondasi FastAPI minimal untuk Commute.ly. `GET /api/v1/health` mengembalikan
`{"status":"ok"}` sebagai pemeriksaan liveness aplikasi.

## Menjalankan lokal

Gunakan Python 3.10+ dan jalankan dari root repository (PowerShell):

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
Copy-Item .env.example .env
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Jika `.env` sudah ada, edit file tersebut tanpa menimpanya. Untuk runtime saja,
gunakan `requirements.txt`. Di macOS/Linux gunakan `.venv/bin/python`.

Health: http://127.0.0.1:8000/api/v1/health. Swagger UI: http://127.0.0.1:8000/docs.

Konfigurasi membaca environment variables dan `backend/.env`; environment
variables memiliki prioritas. `APP_NAME` mengatur judul API dan `CORS_ORIGINS`
berupa array JSON, default `["http://localhost:3000"]`. CORS mengizinkan metode
GET tanpa credentials. Prefix API tetap `/api/v1`.

`MAPID_API_KEY` hanya placeholder opsional untuk integrasi mendatang. Jangan
commit kredensial atau memasukkannya ke variabel frontend `NEXT_PUBLIC_*`.
Endpoint health tidak memanggil database atau layanan eksternal.

## Pengujian

Jalankan dari direktori `backend`:

```powershell
.\.venv\Scripts\python.exe -m pytest tests -q
.\.venv\Scripts\python.exe -m compileall -q app tests
```

Belum ada konfigurasi linter atau type checker backend.

## Struktur

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
