# Design System Dasar — Commute.ly

Implementasi awal berada di `frontend/src/components/ui/` dan token CSS di `frontend/src/styles/tokens.css`.

## Prinsip

- **Map-first:** kontrol peta bersifat floating, ringkas, dan hanya mengambil area seperlunya.
- **Safety legible:** status tidak hanya dibedakan oleh warna; selalu sertakan label teks.
- **Touch-friendly:** target interaksi minimal 44 px (`min-h-11` / `size-11`).
- **Responsive:** panel menjadi bottom sheet pada mobile dan panel mengambang pada layar lebih besar; navigasi juga dapat berubah dari bawah menjadi floating.

## Foundation

- Font: `Plus Jakarta Sans` untuk heading dan `Inter`/system sans untuk teks; pemuatan font diputuskan saat setup aplikasi.
- Skala ruang: 4, 8, 12, 16, 20, 24, 32, 40, dan 48 px (`--space-*`).
- Radius: 12 px untuk elemen kecil, 16 px untuk input/kontrol, 24 px untuk card/panel, 32 px untuk modal/bottom sheet, dan pill untuk CTA/status.
- Permukaan: putih di atas canvas abu-biru ringan; peta tetap dominan.

## Safety Score

`SafetyScoreIndicator` sengaja tidak mengklasifikasikan nilai angka secara otomatis. PRD menetapkan bahwa skor berasal dari weighted spatial analysis, tetapi belum menetapkan formula, bobot, ambang nilai, atau klasifikasi warna. Backend/lapisan fitur nantinya mengirimkan `score`, `label`, dan `tone` yang telah disetujui.
