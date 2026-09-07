import type { FeatureCollection, LineString, Point } from "geojson";

export type StationProperties = { code: string; name: string; area: string };
export type FacilityProperties = { name: string; type: "PJU" | "Kantor Polisi" | "Fasilitas Kesehatan" | "Retail 24 Jam" };

export const stationGeoJson: FeatureCollection<Point, StationProperties> = { type: "FeatureCollection", features: [
  { type: "Feature", properties: { code: "KAT", name: "Stasiun Karet", area: "Jakarta Pusat" }, geometry: { type: "Point", coordinates: [106.8172, -6.2003] } },
  { type: "Feature", properties: { code: "SUD", name: "Stasiun Sudirman", area: "Jakarta Pusat" }, geometry: { type: "Point", coordinates: [106.8223, -6.2024] } },
  { type: "Feature", properties: { code: "MGR", name: "Stasiun Manggarai", area: "Jakarta Selatan" }, geometry: { type: "Point", coordinates: [106.8505, -6.2096] } },
] };

export const safetyRouteGeoJson: FeatureCollection<LineString, { level: "safe" | "caution" | "risk" }> = { type: "FeatureCollection", features: [
  { type: "Feature", properties: { level: "safe" }, geometry: { type: "LineString", coordinates: [[106.8172, -6.2003], [106.819, -6.2012], [106.8223, -6.2024]] } },
  { type: "Feature", properties: { level: "caution" }, geometry: { type: "LineString", coordinates: [[106.8223, -6.2024], [106.829, -6.205], [106.836, -6.207]] } },
  { type: "Feature", properties: { level: "risk" }, geometry: { type: "LineString", coordinates: [[106.836, -6.207], [106.843, -6.208], [106.8505, -6.2096]] } },
] };

export const facilityGeoJson: FeatureCollection<Point, FacilityProperties> = { type: "FeatureCollection", features: [
  { type: "Feature", properties: { name: "PJU Jalan Sudirman", type: "PJU" }, geometry: { type: "Point", coordinates: [106.8201, -6.2015] } },
  { type: "Feature", properties: { name: "Pos Polisi Setiabudi", type: "Kantor Polisi" }, geometry: { type: "Point", coordinates: [106.8272, -6.2045] } },
  { type: "Feature", properties: { name: "Klinik Terdekat", type: "Fasilitas Kesehatan" }, geometry: { type: "Point", coordinates: [106.8403, -6.2078] } },
  { type: "Feature", properties: { name: "Retail 24 Jam", type: "Retail 24 Jam" }, geometry: { type: "Point", coordinates: [106.8471, -6.209] } },
] };

export const pjuGeoJson: FeatureCollection<Point, FacilityProperties> = { type: "FeatureCollection", features: [
  { type: "Feature", properties: { name: "PJU Jalan Sudirman", type: "PJU" }, geometry: { type: "Point", coordinates: [106.8201, -6.2015] } },
  { type: "Feature", properties: { name: "PJU Akses Karet", type: "PJU" }, geometry: { type: "Point", coordinates: [106.8157, -6.1994] } },
] };

export const nighttimeLightGeoJson: FeatureCollection = { type: "FeatureCollection", features: [
  { type: "Feature", properties: { name: "Area pencahayaan malam dummy" }, geometry: { type: "Polygon", coordinates: [[[106.816, -6.1988], [106.832, -6.1988], [106.832, -6.207], [106.816, -6.207], [106.816, -6.1988]]] } },
] };

export const policeGeoJson: FeatureCollection<Point, FacilityProperties> = { type: "FeatureCollection", features: [
  { type: "Feature", properties: { name: "Pos Polisi Setiabudi", type: "Kantor Polisi" }, geometry: { type: "Point", coordinates: [106.8272, -6.2045] } },
] };

export const healthGeoJson: FeatureCollection<Point, FacilityProperties> = { type: "FeatureCollection", features: [
  { type: "Feature", properties: { name: "Klinik Terdekat", type: "Fasilitas Kesehatan" }, geometry: { type: "Point", coordinates: [106.8403, -6.2078] } },
] };

export const retailGeoJson: FeatureCollection<Point, FacilityProperties> = { type: "FeatureCollection", features: [
  { type: "Feature", properties: { name: "Retail 24 Jam", type: "Retail 24 Jam" }, geometry: { type: "Point", coordinates: [106.8471, -6.209] } },
] };

export const surveyActivityGeoJson: FeatureCollection<Point, { name: string; type: string }> = { type: "FeatureCollection", features: [
  { type: "Feature", properties: { name: "Validasi penerangan lapangan", type: "Survey Activities" }, geometry: { type: "Point", coordinates: [106.8247, -6.203] } },
  { type: "Feature", properties: { name: "Observasi titik drop-off", type: "Survey Activities" }, geometry: { type: "Point", coordinates: [106.8464, -6.2087] } },
] };
