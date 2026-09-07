import { StatusIndicator } from "../ui/status-indicator";
import type { Station } from "./types";

/** Compact content intended for a map popup; use StationInfo for the full detail panel. */
export function StationPopup({ station, onViewDetails }: { station: Station; onViewDetails?: (station: Station) => void }) {
  return <div className="min-w-52 p-1 font-[family-name:var(--font-sans)]">
    <p className="text-base font-bold text-[var(--color-ink)]">{station.name}</p>
    <p className="mt-1 text-sm text-[var(--color-muted)]">{station.area}</p>
    <div className="mt-3 flex items-center justify-between gap-3"><StatusIndicator label={`${station.safety.score} · ${station.safety.label}`} tone={station.safety.tone} />{onViewDetails && <button type="button" onClick={() => onViewDetails(station)} className="text-sm font-bold text-[var(--color-primary-strong)] hover:underline">Detail</button>}</div>
  </div>;
}
