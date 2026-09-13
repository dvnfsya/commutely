export type ScheduleEntry = { departure_time: string; destination: string };
const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function fetchStationSchedule(stationId: string, signal: AbortSignal): Promise<ScheduleEntry[]> {
  const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/stations/${encodeURIComponent(stationId)}/schedule`, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
  });
  if (response.status === 404) return [];
  if (!response.ok) throw new Error("Jadwal gagal dimuat");
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || !("station_id" in data) || data.station_id !== stationId
    || !("schedules" in data) || !Array.isArray(data.schedules)) throw new Error("Format jadwal tidak valid");
  const entries: ScheduleEntry[] = [];
  for (const entry of data.schedules) {
    if (!entry || typeof entry.departure_time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(entry.departure_time)
      || typeof entry.destination !== "string") throw new Error("Format jadwal tidak valid");
    entries.push({ departure_time: entry.departure_time, destination: entry.destination });
  }
  return entries;
}
