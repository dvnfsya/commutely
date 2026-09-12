import { hasValidCoordinates, type RouteLocation } from "../components/routing/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function searchLocations(query: string, signal: AbortSignal): Promise<RouteLocation[]> {
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/api/v1/geocoding/autocomplete?q=${encodeURIComponent(query)}`, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
  });
  if (!response.ok) throw new Error("Pencarian lokasi belum tersedia. Coba lagi atau pilih stasiun.");
  const data = await response.json();
  if (!Array.isArray(data.locations) || !data.locations.every((item: RouteLocation) =>
    item && typeof item.label === "string" && item.label.trim() && Array.isArray(item.coordinates)
    && hasValidCoordinates(item) && (item.type === "address" || item.type === "location"),
  )) throw new Error("Hasil pencarian lokasi tidak valid.");
  return data.locations;
}
