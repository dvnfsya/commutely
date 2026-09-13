import type { FeatureCollection, Point } from "geojson";

export type SpatialProperties = { id: string; name: string | null };
export type SpatialData = FeatureCollection<Point, SpatialProperties> & { zoom_in_required: boolean };
export type SpatialLayerId = "stations" | "pju" | "health" | "police";
const endpoints = { stations: "stations", pju: "lighting", health: "health", police: "police" };
const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function fetchSpatialLayer(layer: SpatialLayerId, signal: AbortSignal, bbox?: number[]): Promise<SpatialData> {
  if (layer === "pju" && !bbox) throw new Error("Viewport diperlukan.");
  const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/layers/${endpoints[layer]}${bbox ? `?bbox=${encodeURIComponent(bbox.join(","))}` : ""}`, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
  });
  if (!response.ok) throw new Error("Layer tidak dapat dimuat.");
  const data = await response.json() as SpatialData;
  if (!data || data.type !== "FeatureCollection" || typeof data.zoom_in_required !== "boolean" || !Array.isArray(data.features)
    || !data.features.every((feature) => feature?.type === "Feature" && feature.geometry?.type === "Point"
      && Array.isArray(feature.geometry.coordinates) && feature.geometry.coordinates.length === 2
      && feature.geometry.coordinates.every((value) => typeof value === "number" && Number.isFinite(value))
      && Math.abs(feature.geometry.coordinates[0]) <= 180 && Math.abs(feature.geometry.coordinates[1]) <= 90
      && typeof feature.properties?.id === "string" && (feature.properties.name === null || typeof feature.properties.name === "string"))) {
    throw new Error("Format layer tidak valid.");
  }
  return data;
}
