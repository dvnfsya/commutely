import { getFacilityCounts, getNearbyFacilities } from "./dummy-stations";
import { NearbyFacilities } from "./nearby-facilities";
import { StationSafetySummary } from "./station-safety-summary";
import type { FacilityType, Station } from "./types";

const facilityOrder: FacilityType[] = ["PJU", "Kantor Polisi", "Fasilitas Kesehatan", "Retail 24 Jam"];

export function StationInfo({ station, radiusMeters = 100 }: { station: Station; radiusMeters?: number }) {
  const facilities = getNearbyFacilities(station.id, radiusMeters);
  const counts = getFacilityCounts(station.id, radiusMeters);
  return <article className="grid gap-5"><header><p className="text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-primary-strong)]">Informasi stasiun</p><h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">{station.name}</h2><p className="mt-1 text-sm text-[var(--color-muted)]">{station.area}</p></header><StationSafetySummary station={station} /><section aria-labelledby="facility-count-heading"><h3 id="facility-count-heading" className="mb-3 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-ink)]">Jumlah fasilitas dalam {radiusMeters} m</h3><div className="grid grid-cols-2 gap-2">{facilityOrder.map((type) => <div key={type} className="rounded-[var(--radius-md)] bg-[var(--color-canvas)] p-3"><span className="block text-2xl font-bold text-[var(--color-ink)]">{counts[type] ?? 0}</span><span className="mt-1 block text-xs leading-4 text-[var(--color-muted)]">{type}</span></div>)}</div></section><NearbyFacilities facilities={facilities} radiusMeters={radiusMeters} /></article>;
}
