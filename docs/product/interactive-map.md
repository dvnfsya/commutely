# InteractiveMap

`InteractiveMap` menggunakan MapLibre GL dengan style JSON MAPID Maps yang disuplai lewat `NEXT_PUBLIC_MAPID_STYLE_URL` atau prop `mapStyleUrl`. PRD tidak mencantumkan URL style ataupun kredensial MAPID; karena itu tidak ada endpoint yang diarang sebagai fallback.

Komponen ini sementara memuat GeoJSON dummy untuk marker stasiun, ruas Safety Score, dan fasilitas. Data berada di `frontend/src/components/map/dummy-geojson.ts` dan dapat diganti kemudian oleh data frontend/backend tanpa mengubah komponen peta.

Peta memiliki tinggi berbasis viewport, lebar penuh, dan `overflow-hidden` agar tidak memicu overflow horizontal pada perangkat mobile. Kontrol navigasi MapLibre berada di kanan bawah; layer toggle dibuat ringkas di kiri atas.
