import type { FeatureCollection, Point } from "geojson";

export type SpatialProperties = { id: string; name: string | null; coordinates?: [number, number] };
export type Retail24hProperties = {
  name: string | null; category: string | null; address: string | null;
  phone: string | null; website: string | null; rating: number | null;
};
export type SpatialData = FeatureCollection<Point, SpatialProperties | Retail24hProperties> & { zoom_in_required: boolean };
export type SpatialLayerId = "stations" | "pju" | "health" | "police" | "retail24h";
const endpoints = { stations: "stations", pju: "lighting", health: "health", police: "police", retail24h: "facilities24h" };
const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function fetchSpatialLayer(layer: SpatialLayerId, signal: AbortSignal, bbox?: number[]): Promise<SpatialData> {
  if (layer === "pju" && !bbox) throw new Error("Viewport diperlukan.");
  const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/layers/${endpoints[layer]}${bbox ? `?bbox=${encodeURIComponent(bbox.join(","))}` : ""}`, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
  });
  if (!response.ok) throw new Error("Layer tidak dapat dimuat.");
  const data = await response.json() as SpatialData;
  if (!data || data.type !== "FeatureCollection" || typeof data.zoom_in_required !== "boolean" || !Array.isArray(data.features)
    || !data.features.every((feature) => {
      const properties = feature?.properties as Record<string, unknown> | undefined;
      return feature?.type === "Feature" && feature.geometry?.type === "Point"
        && Array.isArray(feature.geometry.coordinates) && feature.geometry.coordinates.length === 2
        && feature.geometry.coordinates.every((value) => typeof value === "number" && Number.isFinite(value))
        && Math.abs(feature.geometry.coordinates[0]) <= 180 && Math.abs(feature.geometry.coordinates[1]) <= 90
        && (layer === "retail24h"
          ? (properties?.name === null || typeof properties?.name === "string")
            && (properties?.category === null || typeof properties?.category === "string")
            && (properties?.address === null || typeof properties?.address === "string")
            && (properties?.phone === null || typeof properties?.phone === "string")
            && (properties?.website === null || typeof properties?.website === "string")
            && (properties?.rating === null || typeof properties?.rating === "number")
          : typeof properties?.id === "string" && (properties.name === null || typeof properties.name === "string"));
    })) {
    throw new Error("Format layer tidak valid.");
  }
  return data;
}
