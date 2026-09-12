"use client";

import { useState, type FormEvent } from "react";
import { Button } from "../ui/button";
import { LocationSearch, stationLocations, type LocationSelection } from "./location-search";
import { hasValidCoordinates, travelModes, type RouteLocation, type RoutingProfile } from "./types";

export function RouteSearchForm({ onSearch, loading = false }: {
  onSearch: (origin: RouteLocation, destination: RouteLocation, profile: RoutingProfile) => void;
  loading?: boolean;
}) {
  const [origin, setOrigin] = useState<LocationSelection>({ text: "", location: null });
  const [destination, setDestination] = useState<LocationSelection>({ text: stationLocations[0].label, location: stationLocations[0] });
  const [profile, setProfile] = useState<RoutingProfile>("foot-walking");
  const canSearch = hasValidCoordinates(origin.location) && hasValidCoordinates(destination.location);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loading && hasValidCoordinates(origin.location) && hasValidCoordinates(destination.location)) {
      onSearch(origin.location, destination.location, profile);
    }
  }

  return <form onSubmit={submit} className="grid gap-3" aria-label="Pencarian rute">
    <LocationSearch label="Dari" value={origin} onChange={setOrigin} disabled={loading} />
    <LocationSearch label="Ke" value={destination} onChange={setDestination} disabled={loading} />
    <Button variant="secondary" type="button" disabled={loading} onClick={() => { setOrigin(destination); setDestination(origin); }}>⇅ Tukar</Button>
    <fieldset disabled={loading} className="grid gap-2">
      <legend className="mb-2 text-sm font-semibold">Moda perjalanan</legend>
      <div className="flex flex-wrap gap-2">{(Object.keys(travelModes) as RoutingProfile[]).map((mode) =>
        <label key={mode} className={`cursor-pointer rounded-[var(--radius-md)] border p-2 text-sm ${profile === mode ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]" : "border-[var(--color-line)]"}`}>
          <input className="mr-2" type="radio" name="routing-profile" value={mode} checked={profile === mode} onChange={() => setProfile(mode)} />
          {travelModes[mode]}
        </label>)}
      </div>
    </fieldset>
    <Button size="lg" type="submit" disabled={!canSearch || loading}>{loading ? "Mencari rute..." : "Cari Rute"} <span aria-hidden="true">→</span></Button>
  </form>;
}
