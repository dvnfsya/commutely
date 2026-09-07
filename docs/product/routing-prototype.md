# Routing Prototype

`components/routing` menyediakan pencarian asal–tujuan, satu hasil base route tercepat, jarak, estimasi waktu, serta detail turn-by-turn dengan data dummy. Submit form selalu menampilkan satu `dummyBaseRoute`; tidak ada query jaringan, ORS API, maupun pilihan alternatif.

Geometri rute yang sama digunakan oleh `InteractiveMap`. Warna tiap ruas hanya menampilkan konteks Safety Score dummy dan tidak memengaruhi arah, jarak, atau pemilihan base route. Ini mengikuti batas PRD bahwa rute alternatif berbasis Safety Score berada di luar scope.
