import { Card } from "../ui/card";
import type { NearbyFacility } from "./types";

const icons = { PJU: "💡", "Kantor Polisi": "🛡", "Fasilitas Kesehatan": "✚", "Retail 24 Jam": "▣" };

export function NearbyFacilities({ facilities, radiusMeters }: { facilities: NearbyFacility[]; radiusMeters: number }) {
  return <section aria-labelledby="nearby-facilities-heading" className="space-y-3">
    <div className="flex items-baseline justify-between gap-3"><h3 id="nearby-facilities-heading" className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-ink)]">Fasilitas terdekat</h3><span className="text-sm text-[var(--color-muted)]">Radius {radiusMeters} m</span></div>
    {facilities.length === 0 ? <Card className="p-4 text-sm text-[var(--color-muted)]">Belum ada fasilitas dummy dalam radius ini.</Card> : <ul className="grid gap-2">{facilities.map((facility) => <li key={facility.id}><Card className="flex items-center gap-3 p-3"><span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-canvas)] text-lg">{icons[facility.type]}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-[var(--color-ink)]">{facility.name}</span><span className="block text-xs text-[var(--color-muted)]">{facility.type} · {facility.distanceMeters} m</span></span></Card></li>)}</ul>}
  </section>;
}
