"use client";

import { useEffect, useState } from "react";
import { type FacilityCounts, fetchStationFacilities, fetchStationLocation, fetchStationScore, type StationLocation, type StationScore } from "../../lib/station-info-api";
import type { SpatialProperties } from "../../lib/spatial-layers-api";
import { SafetyScoreIndicator } from "../ui/safety-score-indicator";

type Resource<T> = { stationId: string; value?: T | null; error?: boolean };

function displayScore(score: number | string) {
  return Number(score).toFixed(1);
}

function useStationResource<T>(stationId: string, load: (id: string, signal: AbortSignal) => Promise<T | null>) {
  const [resource, setResource] = useState<Resource<T> | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    load(stationId, controller.signal).then(
      (value) => { if (!controller.signal.aborted) setResource({ stationId, value }); },
      () => { if (!controller.signal.aborted) setResource({ stationId, error: true }); },
    );
    return () => controller.abort();
  }, [stationId, load]);
  return resource?.stationId === stationId ? resource : null;
}

export function StationInfo({ station }: { station: SpatialProperties }) {
  const score = useStationResource<StationScore>(station.id, fetchStationScore);
  const facilities = useStationResource<FacilityCounts>(station.id, fetchStationFacilities);
  const location = useStationResource<StationLocation>(station.id, fetchStationLocation);
  return <article className="grid gap-4">
    <header><p className="text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-primary-strong)]">Informasi Stasiun</p>
      <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">{station.name ?? "Stasiun"}</h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">{station.id}{location?.value?.area ? ` / ${location.value.area}` : ""}</p>
    </header>
    <section aria-label="Safety Score" className="space-y-2"><h3 className="text-sm font-bold text-[var(--color-ink)]">Safety Score</h3>
      {!score ? <p role="status" className="text-sm text-[var(--color-muted)]">Memuat Safety Score...</p>
        : score.error ? <p role="alert" className="text-sm text-rose-700">Safety Score gagal dimuat.</p>
        : !score.value ? <p className="text-sm text-[var(--color-muted)]">Data Safety Score belum tersedia</p>
        : <SafetyScoreIndicator compact score={displayScore(score.value.safety_score)} label={score.value.category ?? "Klasifikasi belum tersedia"} />}
    </section>
    <section aria-label="Fasilitas sekitar stasiun" className="space-y-2"><h3 className="text-sm font-bold text-[var(--color-ink)]">Radius fasilitas: 1 km</h3>
      {!facilities ? <p role="status" className="text-sm text-[var(--color-muted)]">Memuat fasilitas...</p>
        : facilities.error ? <p role="alert" className="text-sm text-rose-700">Data fasilitas gagal dimuat.</p>
        : !facilities.value ? <p className="text-sm text-[var(--color-muted)]">Data fasilitas belum tersedia</p>
        : <div className="grid grid-cols-2 gap-2">{([
          ["lighting", "PJU"], ["police", "Polisi"], ["retail_24h", "Retail 24 Jam"], ["health", "Kesehatan"],
        ] as const).map(([key, label]) => <div key={key} className="rounded-[var(--radius-md)] bg-[var(--color-canvas)] p-3"><span className="block text-xl font-bold text-[var(--color-ink)]">{facilities.value![key]}</span><span className="mt-1 block text-xs text-[var(--color-muted)]">{label}</span></div>)}</div>}
    </section>
  </article>;
}
