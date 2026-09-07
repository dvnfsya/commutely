# Visualisasi Safety Score

Prototype menampilkan nilai dummy yang melekat pada masing-masing stasiun dan ruas GeoJSON dummy pada peta. Warna peta memakai tiga status visual: kondisi baik, perlu perhatian, dan risiko lebih tinggi. Tidak ada ambang nilai atau perhitungan kategori pada komponen UI.

## Route-Safety Score Overlay

`route-safety-score-overlay.ts` memakai geometri `dummyBaseRoute` yang sama, lalu memvisualkan atribut `safetyScore` yang telah tersedia pada setiap ruas. Ekspresi warna hanya mengubah tampilan garis dari merah–kuning–hijau; ia tidak menyentuh koordinat, urutan ruas, jarak, waktu tempuh, maupun pemilihan rute. Klik pada ruas menampilkan nilai dummy dan labelnya.

PRD mendefinisikan Safety Score sebagai keluaran weighted spatial analysis. Formula, bobot, ambang klasifikasi, dan pembaruannya belum ditentukan. Karena itu, `SafetyScoreCard`, `SafetyIndicators`, dan legenda hanya menampilkan data yang diberikan; AI tidak digunakan dan tidak memiliki peran untuk menghitung score.
