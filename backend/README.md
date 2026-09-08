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
GET dan POST tanpa credentials. Prefix API tetap `/api/v1`.

## Base routing ORS (TASK 6)

Set `ORS_API_KEY` di `backend/.env` atau environment backend. Key tidak diperlukan
untuk startup, health, atau tests. `POST /api/v1/routing` menerima:

```json
{"origin": [106.8226, -6.2021], "destination": [106.8300, -6.1900], "profile": "foot-walking"}
```

Profile yang didukung saat ini hanya `foot-walking` (default). Koordinat selalu
`[longitude, latitude]`, berupa angka finite dengan rentang [-180,180] dan [-90,90].
Respons berisi `distance_m`, `duration_s`, dan `geometry` GeoJSON `LineString`;
metadata mentah provider tidak diteruskan. Service meminta satu base route dari
[ORS Directions GeoJSON](https://openrouteservice.org/dev/), tanpa alternatif
atau pembobotan Safety Score. HTTPX memakai timeout 15 detik per operasi jaringan,
connect timeout 5 detik, tanpa retry otomatis atau mengikuti redirect.

Error: 422 untuk request/profile tidak valid, 503 jika key kosong, 504 untuk
timeout, dan 502 untuk kegagalan HTTP/network atau respons ORS tidak valid.
Pesan error tidak meneruskan body atau exception provider. Tests memakai
HTTPX MockTransport dan tidak memerlukan key nyata atau koneksi eksternal.

`MAPID_API_KEY` hanya placeholder opsional untuk integrasi mendatang. Jangan
commit kredensial atau memasukkannya ke variabel frontend `NEXT_PUBLIC_*`.
Endpoint health tidak memanggil database atau layanan eksternal.

## PostgreSQL Supabase dan PostGIS

Tambahkan `DATABASE_URL` ke `backend/.env` menggunakan URI PostgreSQL database
Supabase yang sudah ada. Jangan gunakan URL REST/API Supabase atau API key.
Format placeholder: `postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require`.
Salin host, user, port, dan database sesuai connection string proyek; URL-encode
karakter khusus pada password. Jangan commit `.env` atau gunakan `NEXT_PUBLIC_*`.

Driver yang digunakan adalah psycopg 3. URI `postgresql://` otomatis menggunakan
`postgresql+psycopg`; `sslmode=require` menjadi default jika tidak disediakan.
Parameter SSL eksplisit tetap dipertahankan. Gunakan direct connection atau
session pooler Supabase untuk migrasi; pilih session pooler bila jaringan tidak
mendukung IPv6 direct connection. Prepared statements otomatis dinonaktifkan
untuk kompatibilitas pooler. Engine dibuat secara lazy dengan pool pre-ping dan
timeout koneksi 10 detik. Dependency `app.db.session.get_db` menyediakan session
yang ditutup setelah request; service mendatang harus melakukan commit eksplisit.

Jalankan pemeriksaan read-only dari `backend`:

```powershell
.\.venv\Scripts\python.exe -m app.db.check
```

Perintah menjalankan `SELECT 1` dan membaca katalog extension PostgreSQL dalam
transaksi read-only. Output membedakan database `ok`, `unconfigured`, atau `error`;
PostGIS yang terpasang dilaporkan dengan `enabled`, versi, dan schema. Exit code
1 berarti konfigurasi/koneksi gagal; database yang terhubung tanpa PostGIS tetap
exit 0 dengan `enabled: false`. Detail exception sengaja tidak dicetak agar
kredensial tidak bocor. Pemeriksaan ini tidak membuat tabel atau extension.

GeoAlchemy2 tersedia untuk tipe `Geometry`/`Geography` dan fungsi spasial pada
implementasi mendatang. Ketersediaan paket tidak membuktikan PostGIS aktif di
server. Schema extension aktual perlu diperhatikan saat menulis query/migrasi
spasial; konfigurasi ini tidak mengubah `search_path` atau schema Supabase.
Lihat [panduan PostGIS Supabase](https://supabase.com/docs/guides/database/extensions/postgis).

## Alembic

`alembic.ini` dan `alembic/env.py` memakai konfigurasi `DATABASE_URL` yang sama,
tanpa menyimpan kredensial di INI. `app.models` mendaftarkan model station dan
facility ke `app.db.base.Base.metadata` melalui import di `env.py`. Filter autogenerate
mengabaikan tabel existing yang tidak ada di metadata aplikasi dan objek internal
GeoAlchemy2. Penghapusan tabel aplikasi kelak perlu migrasi yang ditinjau manual.

```powershell
.\.venv\Scripts\python.exe -m alembic heads
```

Revision awal `0001_core_spatial` tersedia, tetapi belum diterapkan ke database.
Jangan jalankan `upgrade` atau autogenerate terhadap Supabase pada tahap ini.
Integrasi database memakai pola
[engine SQLAlchemy](https://docs.sqlalchemy.org/en/20/core/engines.html) dan
[metadata Alembic](https://alembic.sqlalchemy.org/en/latest/autogenerate.html).

## Skema spasial awal (TASK 5A)

Migration `0001_core_spatial` mendefinisikan dua tabel di schema `public`:

| Tabel | Kolom utama | Metadata opsional |
| --- | --- | --- |
| `stations` | `id` bigint identity PK, `code` unik (32), `name` (255), `location` | `area` (120), `source` (255), `source_id` (255) |
| `facilities` | `id` bigint identity PK, `name` (255), `category` (64), `location`, `source` (255) | `source_id` (255), `is_24_hours` boolean |

Kolom utama wajib diisi. Kedua `location` menggunakan `geometry(POINT,4326)`
dengan indeks GiST eksplisit; urutan koordinat adalah longitude, latitude.
`category` fasilitas memiliki indeks B-tree dan mewakili tipe fasilitas (misalnya
PJU, polisi, kesehatan, retail); kosakata final belum dikunci sebagai enum.
`is_24_hours = NULL` berarti belum diketahui, bukan tidak buka 24 jam.
`source_id` menyimpan identifier asli dari sumber jika tersedia. Tidak ada data
dummy, perhitungan skor, relasi survey, endpoint baru, atau schema Pydantic baru.

Migration memerlukan PostGIS yang sudah aktif dan schema extension berada di
`search_path` role migrasi; jika tidak, migration berhenti dengan pesan prasyarat.
Tidak ada `CREATE EXTENSION`, perubahan `search_path`, atau instalasi PostGIS
otomatis. Tabel secara eksplisit menggunakan `public` agar tidak dibuat di schema
extension. Status PostGIS server tetap belum diverifikasi. Downgrade hanya
menghapus kedua tabel beserta indeksnya dan tidak menghapus extension.

Tests menghasilkan SQL upgrade/downgrade secara offline menggunakan URI palsu,
memeriksa kesesuaian model/migration dan indeks, tanpa koneksi Supabase.

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
