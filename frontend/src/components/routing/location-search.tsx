"use client";

import { useEffect, useId, useState } from "react";
import { searchLocations } from "../../lib/geocoding-api";
import { Input } from "../ui/input";
import type { RouteLocation } from "./types";

export type LocationSelection = { text: string; location: RouteLocation | null };

export function LocationSearch({ label, value, onChange, disabled, stations, stationStatus }: {
  label: string; value: LocationSelection; onChange: (value: LocationSelection) => void; disabled: boolean;
  stations: RouteLocation[]; stationStatus: "loading" | "ready" | "empty" | "error";
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ query: string; locations: RouteLocation[]; error?: string } | null>(null);
  const query = value.text.trim();
  const local = stations.filter((station) => station.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (!open || value.location || query.length < 3 || query.length > 200 || disabled) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchLocations(query, controller.signal).then((locations) => {
        if (!controller.signal.aborted) setResult({ query, locations });
      }).catch(() => {
        if (!controller.signal.aborted) setResult({ query, locations: [], error: "Pencarian lokasi gagal. Coba lagi atau pilih stasiun yang tersedia." });
      });
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, open, value.location, disabled]);

  const current = result?.query === query ? result : null;
  const suggestions = [...local, ...(current?.locations ?? []).filter((item) => !local.some((station) => station.label === item.label))];
  return <div onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }}>
    <Input id={id} label={label} value={value.text} disabled={disabled} autoComplete="off" maxLength={200}
      placeholder="Cari lokasi atau stasiun..." onFocus={() => setOpen(true)}
      onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
      onChange={(event) => { setOpen(true); setResult(null); onChange({ text: event.target.value, location: null }); }}
      description={value.location ? "Lokasi dipilih" : "Pilih salah satu hasil agar koordinat tersimpan."} />
    {open && !value.location && !disabled && <div className="mt-2 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-2">
      <ul aria-label={`Hasil pencarian ${label}`} className="grid max-h-56 gap-1 overflow-auto">
        {suggestions.map((item, index) => <li key={`${item.label}-${index}`}><button type="button"
          className="w-full rounded p-2 text-left text-sm hover:bg-[var(--color-canvas)] focus-visible:outline-2"
          onClick={() => { onChange({ text: item.label, location: item }); setOpen(false); }}>
          {item.type === "station" ? "🚉 " : "📍 "}{item.label}
        </button></li>)}
      </ul>
      <p role="status" className="p-2 text-xs text-[var(--color-muted)]">
        {stationStatus === "loading" ? "Memuat daftar stasiun..."
          : stationStatus === "error" ? "Daftar stasiun gagal dimuat. Pencarian alamat tetap tersedia."
          : stationStatus === "empty" ? "Daftar stasiun belum tersedia. Pencarian alamat tetap tersedia."
          : query.length < 3 ? "Ketik minimal 3 karakter untuk mencari alamat atau stasiun."
          : current?.error ?? (!current ? "Mencari lokasi..." : suggestions.length === 0 ? "Lokasi tidak ditemukan. Coba nama yang lebih lengkap." : "Pilih lokasi dari hasil pencarian.")}
      </p>
    </div>}
  </div>;
}
