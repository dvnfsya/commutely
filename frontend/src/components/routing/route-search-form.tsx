"use client";

import { useState, type FormEvent } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { dummyLocationSuggestions } from "./dummy-routes";

export function RouteSearchForm({ defaultOrigin = "Stasiun Karet", defaultDestination = "Menteng, Jakarta", onSearch }: {
  defaultOrigin?: string;
  defaultDestination?: string;
  onSearch: (origin: string, destination: string) => void;
}) {
  const [origin, setOrigin] = useState(defaultOrigin);
  const [destination, setDestination] = useState(defaultDestination);
  const canSearch = origin.trim().length > 0 && destination.trim().length > 0;
  const suggestionListId = "route-location-suggestions";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canSearch) onSearch(origin.trim(), destination.trim());
  }

  function swapLocations() {
    setOrigin(destination);
    setDestination(origin);
  }

  return <form onSubmit={submit} className="grid gap-3" aria-label="Pencarian rute">
    <Input label="Dari" value={origin} onChange={(event) => setOrigin(event.target.value)} list={suggestionListId} placeholder="Pilih titik asal" leading={<span>○</span>} />
    <div className="flex items-end gap-2"><div className="min-w-0 flex-1"><Input label="Ke" value={destination} onChange={(event) => setDestination(event.target.value)} list={suggestionListId} placeholder="Pilih tujuan" leading={<span>⌖</span>} /></div><Button variant="secondary" size="icon" type="button" aria-label="Tukar lokasi asal dan tujuan" title="Tukar lokasi" onClick={swapLocations}>↕</Button></div>
    <datalist id={suggestionListId}>{dummyLocationSuggestions.map((location) => <option key={location} value={location} />)}</datalist>
    <Button size="lg" type="submit" disabled={!canSearch}>Cari rute tercepat <span aria-hidden="true">→</span></Button>
  </form>;
}
