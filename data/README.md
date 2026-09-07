# Data

Pemisahan data mengikuti tahap pengolahan yang dijelaskan PRD.

```text
raw/        # salinan sumber asli: JakartaSatu, BIG, OSM, KAI, MAPID Survey
processed/  # data yang telah dibersihkan, distandardisasi, dan divalidasi
spatial/    # GeoJSON/OSM-PBF/jaringan serta artefak analisis spasial
exports/    # keluaran terkurasi untuk impor, QA, atau visualisasi
```

Data sumber yang sensitif, berlisensi, atau berukuran besar tidak seharusnya dikomit. Metadata sumber, tanggal pembaruan, CRS, dan lisensi akan didokumentasikan di `docs/data/`.
