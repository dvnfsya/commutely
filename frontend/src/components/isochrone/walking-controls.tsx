"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { fetchWalkingArea, type WalkingArea, type WalkingDuration, type WalkingOrigin } from "../../lib/isochrone-api";

export function WalkingControls({ origin, onChange }: { origin: WalkingOrigin; onChange: (area: WalkingArea | null) => void }) {
  const [duration, setDuration] = useState<WalkingDuration>(300);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const clear = () => {
    request.current?.abort(); request.current = null;
    setPending(false); setStatus(""); onChange(null);
  };
  const submit = async () => {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setPending(true); setStatus("Memuat area berjalan kaki…"); onChange(null);
    try {
      const result = await fetchWalkingArea(origin, duration, controller.signal);
      if (controller.signal.aborted || request.current !== controller) return;
      onChange(result.features.length ? result : null);
      setStatus(result.features.length ? "" : "Area berjalan kaki tidak tersedia.");
    } catch (error) {
      if (!controller.signal.aborted && request.current === controller) setStatus(error instanceof Error ? error.message : "Area berjalan kaki gagal dimuat.");
    } finally {
      if (request.current === controller) { setPending(false); request.current = null; }
    }
  };
  return <section aria-label="Area berjalan kaki" className="mt-4 space-y-3 border-t border-[var(--color-line)] pt-4">
    <h3 className="text-sm font-bold text-[var(--color-ink)]">Area berjalan kaki</h3>
    <p className="text-xs text-[var(--color-muted)]">Dari {origin.name}</p>
    <div className="flex flex-wrap gap-2" aria-label="Durasi berjalan kaki">
      {([300, 600, 900] as const).map((seconds) => <Button key={seconds} size="sm" variant={duration === seconds ? "primary" : "secondary"} aria-pressed={duration === seconds}
        onClick={() => { clear(); setDuration(seconds); }}>{seconds / 60} menit</Button>)}
    </div>
    <div className="flex flex-wrap gap-2"><Button size="sm" disabled={pending} onClick={() => void submit()}>Tampilkan area</Button><Button size="sm" variant="ghost" onClick={clear}>Hapus area</Button></div>
    {status && <p role="status" className="text-sm text-[var(--color-muted)]">{status}</p>}
  </section>;
}
