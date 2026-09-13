import type { FeatureCollection, Polygon } from "geojson";

export type WalkingDuration = 300 | 600 | 900;
export type WalkingArea = FeatureCollection<Polygon, { duration_s: number }>;
export type WalkingOrigin = { id: string; name: string; coordinates?: readonly number[] };
const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
function coordinate(value: unknown): value is [number, number] {
  return Array.isArray(value) && value.length === 2 && value.every((v) => typeof v === "number" && Number.isFinite(v))
    && Math.abs(value[0]) <= 180 && Math.abs(value[1]) <= 90;
}

export async function fetchWalkingArea(origin: WalkingOrigin, duration: WalkingDuration, signal: AbortSignal): Promise<WalkingArea> {
  const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(40000)]);
  let location: unknown = origin.coordinates;
  if (!location) {
    const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/stations`, { signal: requestSignal });
    if (!response.ok) throw new Error("Koordinat stasiun belum tersedia.");
    const stations: unknown = await response.json();
    if (!Array.isArray(stations)) throw new Error("Koordinat stasiun belum tersedia.");
    const station = stations.find((item) => item && item.id === origin.id);
    location = station?.geometry?.type === "Point" ? station.geometry.coordinates : undefined;
  }
  if (!coordinate(location)) throw new Error("Koordinat stasiun belum tersedia.");
  const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/isochrone`, {
    method: "POST", headers: { "Content-Type": "application/json" }, signal: requestSignal,
    body: JSON.stringify({ location, profile: "foot-walking", ranges: [duration] }),
  });
  if (!response.ok) throw new Error("Area berjalan kaki gagal dimuat. Silakan coba lagi.");
  const data = await response.json() as WalkingArea;
  if (!data || data.type !== "FeatureCollection" || !Array.isArray(data.features) || data.features.length > 1
    || !data.features.every((feature) => feature?.type === "Feature" && feature.properties?.duration_s === duration
      && feature.geometry?.type === "Polygon" && Array.isArray(feature.geometry.coordinates) && feature.geometry.coordinates.length > 0
      && feature.geometry.coordinates.every((ring) => Array.isArray(ring) && ring.length >= 4 && ring.every(coordinate)
        && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]))) {
    throw new Error("Format area berjalan kaki tidak valid.");
  }
  return data;
}
