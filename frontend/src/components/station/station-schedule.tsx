"use client";

import { useEffect, useState } from "react";
import { fetchStationSchedule, type ScheduleEntry } from "../../lib/schedule-api";

type ScheduleState = { stationId: string; status: "ready"; entries: ScheduleEntry[] }
  | { stationId: string; status: "error" };

export function StationSchedule({ stationId }: { stationId: string }) {
  const [state, setState] = useState<ScheduleState | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetchStationSchedule(stationId, controller.signal).then(
      (entries) => { if (!controller.signal.aborted) setState({ stationId, status: "ready", entries }); },
      () => { if (!controller.signal.aborted) setState({ stationId, status: "error" }); },
    );
    return () => controller.abort();
  }, [stationId]);
  const current = state?.stationId === stationId ? state : null;
  return <section aria-label="Jadwal KRL" className="mt-4 space-y-2 border-t border-[var(--color-line)] pt-4">
    <h3 className="text-sm font-bold text-[var(--color-ink)]">Jadwal KRL</h3>
    {!current ? <p role="status" className="text-sm text-[var(--color-muted)]">Memuat jadwal...</p>
      : current.status === "error" ? <p role="alert" className="text-sm text-rose-700">Jadwal gagal dimuat. Silakan pilih ulang stasiun.</p>
      : current.entries.length === 0 ? <p role="status" className="text-sm text-[var(--color-muted)]">Jadwal belum tersedia</p>
      : <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-[var(--color-ink)]">
        {current.entries.map((entry, index) => <li key={index} className="flex gap-2"><time className="shrink-0 tabular-nums">{entry.departure_time}</time><span aria-hidden="true">→</span><span>{entry.destination}</span></li>)}
      </ul>}
  </section>;
}
