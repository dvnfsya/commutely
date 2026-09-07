import { cn } from "../ui/cn";
import type { Station } from "./types";

/** Presentational marker for a map renderer or station map preview. */
export function StationMarker({ station, selected = false, onClick, className }: {
  station: Station;
  selected?: boolean;
  onClick?: (station: Station) => void;
  className?: string;
}) {
  return <button type="button" aria-label={`Lihat informasi ${station.name}`} aria-pressed={selected} onClick={() => onClick?.(station)} className={cn("grid size-11 place-items-center rounded-full border-4 border-white bg-[var(--color-primary)] text-[11px] font-bold text-white shadow-[var(--shadow-card)] transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-soft)]", selected && "ring-4 ring-[var(--color-primary-soft)]", className)}>{station.code}</button>;
}
