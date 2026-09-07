import { cn } from "../ui/cn";
import { DATA_LAYER_IDS, dataLayerDefinitions, type DataLayerId } from "./map-layer-data";

export type MapLayerControlState = Record<DataLayerId | "stations", boolean>;

export function MapLayerControl({ visibility, onToggle, className }: { visibility: MapLayerControlState; onToggle: (layerId: DataLayerId | "stations") => void; className?: string }) {
  const layers = [{ id: "stations" as const, label: "Stasiun", description: "Marker stasiun KRL" }, ...DATA_LAYER_IDS.map((id) => ({ id, ...dataLayerDefinitions[id] }))];
  const activeCount = layers.filter((layer) => visibility[layer.id]).length;
  return <details className={cn("absolute left-3 top-3 z-10 w-[min(19rem,calc(100%-1.5rem))] overflow-hidden rounded-[var(--radius-md)] border border-white/70 bg-white/95 shadow-[var(--shadow-card)] backdrop-blur", className)}>
    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-bold text-[var(--color-ink)] [&::-webkit-details-marker]:hidden"><span>Layers</span><span className="rounded-[var(--radius-pill)] bg-[var(--color-primary-soft)] px-2 py-0.5 text-xs text-[var(--color-primary-strong)]">{activeCount} aktif</span></summary>
    <div className="max-h-[min(52dvh,24rem)] overflow-y-auto border-t border-[var(--color-line)] p-2">{layers.map((layer) => <button key={layer.id} type="button" role="switch" aria-checked={visibility[layer.id]} onClick={() => onToggle(layer.id)} className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] p-3 text-left hover:bg-[var(--color-canvas)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><span aria-hidden="true" className={cn("relative h-5 w-9 shrink-0 rounded-full transition", visibility[layer.id] ? "bg-[var(--color-primary)]" : "bg-[var(--color-line)]")}><span className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow transition", visibility[layer.id] ? "left-4" : "left-0.5")} /></span><span className="min-w-0"><span className="block text-sm font-semibold text-[var(--color-ink)]">{layer.label}</span><span className="block text-xs leading-4 text-[var(--color-muted)]">{layer.description}</span></span></button>)}</div>
  </details>;
}
