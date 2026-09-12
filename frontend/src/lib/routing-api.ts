import type { FeatureCollection, LineString } from "geojson";
import type { RoutingProfile } from "../components/routing/types";

export type RoutingResponse = {
  distance_m: number;
  duration_s: number;
  geometry: LineString;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function fetchRoute(
  origin: [number, number],
  destination: [number, number],
  profile: RoutingProfile = "foot-walking",
) {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/api/v1/routing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      origin,
      destination,
      profile,
    }),
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    throw new Error("Tidak dapat menghubungi layanan rute. Periksa koneksi dan coba lagi.");
  }

  if (!response.ok) {
    throw new Error(response.status === 504
      ? "Layanan rute terlalu lama merespons. Silakan coba lagi."
      : "Rute belum dapat dimuat. Silakan coba lagi nanti.");
  }

  let data: RoutingResponse;
  try {
    data = await response.json();
    if (!data || typeof data.distance_m !== "number" || !Number.isFinite(data.distance_m) || data.distance_m < 0
      || typeof data.duration_s !== "number" || !Number.isFinite(data.duration_s) || data.duration_s < 0
      || data.geometry?.type !== "LineString" || !Array.isArray(data.geometry.coordinates)
      || data.geometry.coordinates.length < 2 || !data.geometry.coordinates.every(
        (point) => Array.isArray(point) && point.length === 2
          && typeof point[0] === "number" && Number.isFinite(point[0]) && Math.abs(point[0]) <= 180
          && typeof point[1] === "number" && Number.isFinite(point[1]) && Math.abs(point[1]) <= 90,
      )) throw new Error();
  } catch {
    throw new Error("Layanan rute mengirim data yang tidak valid. Silakan coba lagi.");
  }

  const geometry: FeatureCollection<LineString> = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: data.geometry,
      },
    ],
  };

  return {
    distanceKm: data.distance_m / 1000,
    estimatedMinutes: Math.round(data.duration_s / 60),
    geometry,
  };
}
