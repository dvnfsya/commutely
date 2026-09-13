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

Profile routing: `foot-walking` (default), `cycling-regular`, dan `driving-car`. Koordinat selalu
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

`MAPID_API_KEY` digunakan untuk integrasi Activities backend. Jangan
commit kredensial atau memasukkannya ke variabel frontend `NEXT_PUBLIC_*`.
Endpoint health tidak memanggil database atau layanan eksternal.

## Pencarian lokasi (Phase 2)

`GET /api/v1/geocoding/autocomplete?q=Palmerah` menerima teks 3–200 karakter
setelah trim. Backend memanggil ORS Pelias `/geocode/autocomplete` menggunakan
`ORS_API_KEY` yang sama melalui header Authorization. Pencarian dibatasi Indonesia
(`boundary.country=IDN`) dan diprioritaskan di sekitar Jakarta; bukan batas Jakarta
yang mutlak. Maksimum 8 hasil dikembalikan sebagai
`{"locations":[{"label":"...","coordinates":[106.8,-6.2],"type":"location"}]}`.
Tipe hasil `address` atau `location`; hasil kosong adalah `{"locations":[]}`.
Status 422 untuk query invalid, 503 key kosong, 504 timeout, dan 502 kegagalan
provider/respons invalid. Tidak ada database alamat atau geocoding di browser.
Isochrone tetap walking-only.

## Walking isochrone ORS (TASK 7)

`POST /api/v1/isochrone` memakai `ORS_API_KEY` yang sama di `backend/.env` dan
HTTPX dependency/timeout yang sama dengan routing. Tidak ada konfigurasi atau
dependency tambahan. Request:

```json
{"location": [106.8226, -6.2021], "profile": "foot-walking", "ranges": [300, 600, 900]}
```

`profile` default `foot-walking` dan hanya profile tersebut yang didukung.
`ranges` default `[300,600,900]` (5, 10, 15 menit); nilai harus integer dalam
detik, positif, unik, urut naik, maksimum 3 nilai dan maksimum 900 detik.
Ini batas aplikasi Commute.ly, lebih ketat daripada
[batas ORS](https://openrouteservice.org/restrictions/) (10 interval dan 20 jam
untuk walking). Koordinat memakai validasi `[longitude,latitude]` yang sama
dengan routing.

Service mengirim `POST https://api.openrouteservice.org/v2/isochrones/foot-walking`
dengan header `Authorization` dan `Accept: application/geo+json`. Body ORS:

```json
{"locations": [[106.8226, -6.2021]], "range": [300, 600, 900], "range_type": "time", "location_type": "start"}
```

Perhatikan `range` (singular) pada ORS, bukan `ranges`. Sesuai
[kontrak ORS](https://giscience.github.io/openrouteservice-r/reference/ors_isochrones.html),
time range memakai detik; tidak ada konversi ke menit atau `units: minutes`.
Endpoint ORS menghasilkan GeoJSON tanpa perlu suffix Directions `/geojson`.

Respons adalah GeoJSON `FeatureCollection`, dengan satu `Feature` per range,
urut durasi menaik. Setiap feature memiliki `geometry` bertipe `Polygon` dan
`properties: {"duration_s": 300}` (contoh untuk range pertama). Nilai berasal
dari ORS `properties.value`, bukan perkiraan dari urutan respons. Metadata
provider lainnya tidak diteruskan. Polygon harus memiliki ring tertutup dengan
minimal empat posisi dan tiga titik berbeda; ring interior dipertahankan.
Response dengan range hilang/duplikat/tidak sesuai atau geometri rusak ditolak.

Status error: 422 validasi input, 503 key kosong, 504 timeout, 502 HTTP/network
atau respons provider tidak valid. Error tidak memuat key, body, atau exception
provider. Tests menggunakan MockTransport; tidak ada panggilan ORS nyata.

## Gemini assistant (TASK 8)

Set `GEMINI_API_KEY` hanya di `backend/.env` atau environment backend. Model
default ditentukan sekali di `Settings.gemini_model`; `GEMINI_MODEL` dapat
menggantinya dengan ID model teks Gemini yang didukung. Jika memakai default,
biarkan variabel model tidak diset (jangan set string kosong).

Integrasi menggunakan [REST API resmi Google generateContent](https://ai.google.dev/api/generate-content)
melalui HTTPX yang sudah tersedia; tidak ada SDK/dependency tambahan.
API key dikirim melalui header `x-goog-api-key`, bukan query URL. Timeout 30 detik
per operasi jaringan, connect timeout 5 detik, tanpa retry atau redirect otomatis.

`POST /api/v1/assistant` menerima question dan context berupa objek JSON:

```json
{
  "question": "Bagaimana kondisi keamanan rute ini?",
  "context": {
    "station": "Sudirman",
    "safety_score": 72,
    "route_distance_m": 1200,
    "route_duration_s": 720,
    "lighting": "cukup",
    "police_nearby": true,
    "retail_24h": 3
  }
}
```

Nilai di atas hanya contoh input, bukan hasil analisis atau data produksi.
Contoh bentuk respons: `{"answer":"Data yang tersedia belum cukup untuk memastikan keamanan rute."}`.
Question wajib nonkosong setelah trim, maksimum 2000 karakter. Context wajib
objek JSON dengan nilai finite dan maksimum 16000 byte setelah serialisasi JSON
ASCII; objek kosong diperbolehkan. Jawaban maksimum 8000 karakter.

System instruction terpisah mengarahkan Gemini untuk menjelaskan konteks yang
diberikan, mengakui data tidak cukup, menjawab ringkas dalam bahasa pertanyaan,
dan tidak menghitung Safety Score/route safety atau mengarang hasil spasial.
Question/context diperlakukan sebagai data yang tidak boleh menimpa aturan sistem.
Ini instruksi perilaku model, bukan jaminan kebenaran: context berasal dari caller
dan belum diverifikasi. Tidak ada tools, query database, akses MAPID/ORS, history,
RAG, atau penghitungan skor dalam service ini.

Status error: 422 untuk input tidak valid, 503 jika key belum diset, 504 timeout,
502 kegagalan provider atau respons kosong/rusak/diblokir/terpotong. Respons
hanya berisi answer; metadata mentah dan thought parts tidak diteruskan. Service
tidak mencetak prompt, key, atau exception provider. Tests memakai MockTransport
tanpa key nyata atau panggilan Gemini. Health tetap dapat dipakai tanpa key.

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

## MAPID Activities

`POST /api/v1/mapid/activities` performs a read-only search using the documented
MAPID Activities API (documentation supplied August 5, 2026). No data is persisted.
Set `MAPID_API_KEY` in the backend environment only. Optional
`MAPID_ACTIVITIES_URL` defaults to `https://server.mapid.io/web/competition/activities`;
use only a trusted HTTPS endpoint because it receives the `X-API-KEY` header.
Redirects are disabled; timeout is 30 seconds with a 5-second connection timeout.

The JSON body requires `feature`, a GeoJSON Polygon with longitude/latitude
coordinates. Every ring needs at least four positions and identical first/last
positions. Optional `start_date` and `end_date` (`YYYY-MM-DD`) must be supplied
together in chronological order. Optional `hashtag` is an array of strings;
`author` is a string. No offset or limit parameter is supported.

The response is `{activities: [...], filters: {...}, total: N}`. Activity objects
and filter metadata retain upstream values; the provider envelope is removed.
Without dates MAPID caps results at 60; with dates all matching records can be
returned. The backend does not silently truncate, paginate, simplify polygons,
perform spatial analysis, or generate fallback records.

Errors: 422 invalid filters, 503 missing key, 504 provider timeout, and 502 for
HTTP/network errors, malformed responses, or credential echoes. Provider error
bodies are not returned. Tests use HTTPX MockTransport without live MAPID calls.

## GeoMAPID uploaded layers

- `GET /api/v1/mapid/layers?project_id=...` lists project layers via
  `https://geoserver.mapid.io/layers_new/get_layer_list`.
- `GET /api/v1/mapid/layer?project_id=...&layer_id=...` retrieves an uploaded layer
  via `https://geoserver.mapid.io/layers_new/get_layer`.

Both reuse backend-only `MAPID_API_KEY` through `X-API-KEY`, the MAPID HTTPX
client, timeouts, disabled redirects, and sanitized errors. Optional
`MAPID_LAYER_LIST_URL` and `MAPID_LAYER_URL` override the documented HTTPS URLs.
Project and layer identifiers are required query parameters, not credentials.

Responses preserve upstream JSON envelopes, properties, and spatial coordinates.
Validation checks structured JSON, finite numbers, explicit error envelopes, and
credential echoes. A complete upstream response schema was not supplied; this
foundation does not validate layer fields or GeoJSON topology. No spatial
processing, persistence, or Activities changes are involved. Tests mock HTTP;
live GeoMAPID access and project permissions are not verified.

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
