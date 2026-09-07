import type { FacilityType, NearbyFacility, Station } from "./types";

export const dummyStations: Station[] = [
  {
    id: "karet",
    code: "KAT",
    name: "Stasiun Karet",
    area: "Karet, Jakarta Pusat",
    coordinates: [106.8172, -6.2003],
    safety: { score: 78, label: "Kondisi baik", tone: "safe", updatedAt: "Data dummy", highlights: ["Penerangan tersedia", "Terdapat fasilitas pendukung di sekitar stasiun"], indicators: [{ id: "lighting", name: "Penerangan Jalan Umum", description: "Kondisi penerangan dari data dummy", status: "Tersedia", tone: "safe" }, { id: "nighttime", name: "Nighttime Light", description: "Konteks pencahayaan malam dari data dummy", status: "Mendukung", tone: "safe" }, { id: "police", name: "Pos Polisi", description: "Kedekatan fasilitas kepolisian", status: "Tersedia", tone: "safe" }, { id: "retail", name: "Retail 24 Jam", description: "Aktivitas ekonomi malam", status: "Tersedia", tone: "safe" }, { id: "survey", name: "Survei Lapangan", description: "Validasi kondisi aktual", status: "Tervalidasi", tone: "info" }] },
  },
  {
    id: "sudirman",
    code: "SUD",
    name: "Stasiun Sudirman",
    area: "Jakarta Pusat",
    coordinates: [106.8223, -6.2024],
    safety: { score: 71, label: "Kondisi baik", tone: "safe", updatedAt: "Data dummy", highlights: ["Aktivitas ekonomi terdekat tersedia", "Akses fasilitas kesehatan tersedia"], indicators: [{ id: "lighting", name: "Penerangan Jalan Umum", description: "Kondisi penerangan dari data dummy", status: "Tersedia", tone: "safe" }, { id: "nighttime", name: "Nighttime Light", description: "Konteks pencahayaan malam dari data dummy", status: "Mendukung", tone: "safe" }, { id: "police", name: "Pos Polisi", description: "Kedekatan fasilitas kepolisian", status: "Terbatas", tone: "caution" }, { id: "retail", name: "Retail 24 Jam", description: "Aktivitas ekonomi malam", status: "Tersedia", tone: "safe" }, { id: "survey", name: "Survei Lapangan", description: "Validasi kondisi aktual", status: "Tervalidasi", tone: "info" }] },
  },
  {
    id: "manggarai",
    code: "MGR",
    name: "Stasiun Manggarai",
    area: "Jakarta Selatan",
    coordinates: [106.8505, -6.2096],
    safety: { score: 58, label: "Perlu perhatian", tone: "caution", updatedAt: "Data dummy", highlights: ["Periksa penerangan dan titik tunggu sebelum berangkat", "Gunakan layer fasilitas untuk melihat konteks sekitar"], indicators: [{ id: "lighting", name: "Penerangan Jalan Umum", description: "Kondisi penerangan dari data dummy", status: "Perlu cek", tone: "caution" }, { id: "nighttime", name: "Nighttime Light", description: "Konteks pencahayaan malam dari data dummy", status: "Terbatas", tone: "caution" }, { id: "police", name: "Pos Polisi", description: "Kedekatan fasilitas kepolisian", status: "Terbatas", tone: "caution" }, { id: "retail", name: "Retail 24 Jam", description: "Aktivitas ekonomi malam", status: "Terbatas", tone: "caution" }, { id: "survey", name: "Survei Lapangan", description: "Validasi kondisi aktual", status: "Perlu pembaruan", tone: "caution" }] },
  },
];

export const dummyNearbyFacilities: NearbyFacility[] = [
  { id: "karet-pju", stationId: "karet", name: "PJU Jalan Karet", type: "PJU", distanceMeters: 45, description: "Titik penerangan jalan" },
  { id: "karet-police", stationId: "karet", name: "Pos Polisi Setiabudi", type: "Kantor Polisi", distanceMeters: 90, description: "Fasilitas kepolisian terdekat" },
  { id: "karet-clinic", stationId: "karet", name: "Klinik Terdekat", type: "Fasilitas Kesehatan", distanceMeters: 95, description: "Fasilitas kesehatan" },
  { id: "karet-retail", stationId: "karet", name: "Retail 24 Jam", type: "Retail 24 Jam", distanceMeters: 80, description: "Aktivitas ekonomi malam" },
  { id: "sudirman-pju", stationId: "sudirman", name: "PJU Jalan Sudirman", type: "PJU", distanceMeters: 55, description: "Titik penerangan jalan" },
  { id: "sudirman-retail", stationId: "sudirman", name: "Retail 24 Jam", type: "Retail 24 Jam", distanceMeters: 70, description: "Aktivitas ekonomi malam" },
  { id: "manggarai-pju", stationId: "manggarai", name: "PJU Akses Manggarai", type: "PJU", distanceMeters: 65, description: "Titik penerangan jalan" },
  { id: "manggarai-retail", stationId: "manggarai", name: "Retail 24 Jam", type: "Retail 24 Jam", distanceMeters: 115, description: "Aktivitas ekonomi malam" },
];

export function getNearbyFacilities(stationId: string, radiusMeters = 100) {
  return dummyNearbyFacilities.filter((facility) => facility.stationId === stationId && facility.distanceMeters <= radiusMeters);
}

export function getFacilityCounts(stationId: string, radiusMeters = 100) {
  return getNearbyFacilities(stationId, radiusMeters).reduce<Partial<Record<FacilityType, number>>>((counts, facility) => {
    counts[facility.type] = (counts[facility.type] ?? 0) + 1;
    return counts;
  }, {});
}
