import { Card } from "../ui/card";
import type { BaseRoute } from "./types";

export function RouteResult({ route, onViewDetail }: { route: BaseRoute; onViewDetail?: (route: BaseRoute) => void }) {
  return <Card className="space-y-4 p-4">
    <div><p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-primary-strong)]">Base route · tercepat</p><h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">{route.origin} → {route.destination}</h2></div>
    <div className="grid grid-cols-2 gap-2"><RouteMetric label="Jarak" value={`${route.distanceKm} km`} /><RouteMetric label="Estimasi" value={`${route.estimatedMinutes} menit`} /></div>
    <p className="text-sm leading-5 text-[var(--color-muted)]">Rute utama ditampilkan pada peta. Gradasi warna pada ruas merupakan konteks Safety Score, bukan rute alternatif.</p>
    {onViewDetail && <button type="button" onClick={() => onViewDetail(route)} className="text-sm font-bold text-[var(--color-primary-strong)] hover:underline">Lihat detail rute →</button>}
  </Card>;
}

function RouteMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[var(--radius-md)] bg-[var(--color-canvas)] p-3"><span className="block text-xs text-[var(--color-muted)]">{label}</span><span className="mt-1 block font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-ink)]">{value}</span></div>;
}
