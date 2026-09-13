export type StationScore = { safety_score: number | string; category: string | null };
export type FacilityCounts = { lighting: number; police: number; retail_24h: number; health: number };
export type StationLocation = { area: string | null };
export type ApiStation = { id: string; name: string | null; coordinates: [number, number] | null; area: string | null };

const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

async function read(path: string, signal: AbortSignal): Promise<unknown | null> {
  const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/${path}`, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Data stasiun gagal dimuat.");
  return response.json();
}

export async function fetchStations(signal: AbortSignal): Promise<ApiStation[]> {
  const data = await read("stations", signal);
  if (!Array.isArray(data)) throw new Error("Data stasiun tidak valid.");
  return data.map((station) => {
    if (!isRecord(station) || typeof station.id !== "string" || !(station.name === null || typeof station.name === "string")) {
      throw new Error("Data stasiun tidak valid.");
    }
    const geometry = station.geometry;
    const coordinates = isRecord(geometry) && geometry.type === "Point" && Array.isArray(geometry.coordinates)
      && geometry.coordinates.length === 2 && geometry.coordinates.every((value) => typeof value === "number" && Number.isFinite(value))
      && Math.abs(geometry.coordinates[0]) <= 180 && Math.abs(geometry.coordinates[1]) <= 90
      ? [geometry.coordinates[0], geometry.coordinates[1]] as [number, number] : null;
    const area = [station.kelurahan, station.kecamatan, station.kota, station.provinsi]
      .filter((value) => typeof value === "string" && value.trim()).join(", ");
    return { id: station.id, name: station.name, coordinates, area: area || null };
  });
}

export async function fetchStationScore(stationId: string, signal: AbortSignal): Promise<StationScore | null> {
  const data = await read(`stations/${encodeURIComponent(stationId)}/safety-score`, signal);
  if (data === null) return null;
  if (!isRecord(data) || data.station_id !== stationId || data.safety_score === null
    || !((typeof data.safety_score === "number" && Number.isFinite(data.safety_score))
      || (typeof data.safety_score === "string" && /^-?\d+(\.\d+)?$/.test(data.safety_score)))
    || !(data.category === null || typeof data.category === "string")) throw new Error("Data Safety Score tidak valid.");
  return { safety_score: data.safety_score, category: data.category };
}

export async function fetchStationLocation(stationId: string, signal: AbortSignal): Promise<StationLocation | null> {
  const station = (await fetchStations(signal)).find((item) => item.id === stationId);
  return station ? { area: station.area } : null;
}

export async function fetchStationFacilities(stationId: string, signal: AbortSignal): Promise<FacilityCounts | null> {
  const data = await read(`stations/${encodeURIComponent(stationId)}/facilities?radius_m=1000`, signal);
  if (data === null) return null;
  if (!isRecord(data) || data.station_id !== stationId || data.radius_m !== 1000 || !isRecord(data.counts)) {
    throw new Error("Data fasilitas tidak valid.");
  }
  const counts = data.counts;
  if (!["lighting", "police", "retail_24h", "health"].every((key) =>
    typeof counts[key] === "number" && Number.isSafeInteger(counts[key]) && counts[key] >= 0,
  )) throw new Error("Data fasilitas tidak valid.");
  return counts as FacilityCounts;
}
