import type { BaseRoute } from "./types";

/** One dummy base route only. It is not generated from Safety Score. */
export const dummyBaseRoute: BaseRoute = {
  id: "karet-menteng-base-route",
  origin: "Stasiun Karet",
  destination: "Menteng, Jakarta",
  distanceKm: 3.4,
  estimatedMinutes: 42,
  geometry: {
    type: "FeatureCollection",
    features: [
      { type: "Feature", properties: { level: "safe", safetyScore: 82, safetyLabel: "Kondisi baik" }, geometry: { type: "LineString", coordinates: [[106.8172, -6.2003], [106.819, -6.2012], [106.8223, -6.2024]] } },
      { type: "Feature", properties: { level: "caution", safetyScore: 61, safetyLabel: "Perlu perhatian" }, geometry: { type: "LineString", coordinates: [[106.8223, -6.2024], [106.829, -6.205], [106.836, -6.207]] } },
      { type: "Feature", properties: { level: "risk", safetyScore: 38, safetyLabel: "Risiko lebih tinggi" }, geometry: { type: "LineString", coordinates: [[106.836, -6.207], [106.843, -6.208], [106.8505, -6.2096]] } },
    ],
  },
  steps: [
    { id: "start", instruction: "Mulai dari Stasiun Karet", distanceMeters: 0 },
    { id: "1", instruction: "Berjalan ke arah timur", distanceMeters: 450 },
    { id: "2", instruction: "Belok kanan di persimpangan", distanceMeters: 800 },
    { id: "3", instruction: "Lanjutkan menuju Menteng", distanceMeters: 2150 },
    { id: "finish", instruction: "Tiba di tujuan", distanceMeters: 0 },
  ],
};

export const dummyLocationSuggestions = ["Stasiun Karet", "Stasiun Sudirman", "Stasiun Manggarai", "Menteng, Jakarta", "Karet, Jakarta Pusat"];

export const dummyBaseRouteGeoJson = dummyBaseRoute.geometry;
