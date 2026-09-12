"use client";

import { useRef, useState } from "react";
import { RouteDetail } from "./route-detail";
import { RouteResult } from "./route-result";
import { RouteSearchForm } from "./route-search-form";
import { hasValidCoordinates, type BaseRoute, type RouteLocation, type RoutingProfile } from "./types";
import { fetchRoute } from "../../lib/routing-api";

type RoutePlannerProps = {
  onRouteChange?: (route: BaseRoute | null) => void;
};

export function RoutePlanner({ onRouteChange }: RoutePlannerProps) {
  const [route, setRoute] = useState<BaseRoute | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searching = useRef(false);

  async function handleSearch(origin: RouteLocation, destination: RouteLocation, profile: RoutingProfile) {
    if (searching.current) return;
    setRoute(null);
    onRouteChange?.(null);
    setDetailOpen(false);
    if (!hasValidCoordinates(origin) || !hasValidCoordinates(destination)) {
      setError("Pilih lokasi asal dan tujuan dari hasil pencarian.");
      return;
    }

    if (origin.coordinates.every((coordinate, index) => coordinate === destination.coordinates[index])) {
      setError("Pilih lokasi asal dan tujuan yang berbeda.");
      return;
    }
    searching.current = true;
    setLoading(true);
    setError(null);
    setDetailOpen(false);

    try {
      const result = await fetchRoute(
        origin.coordinates,
        destination.coordinates,
        profile,
      );

      const nextRoute: BaseRoute = {
        id: `${origin.coordinates}-${destination.coordinates}-${profile}`,
        origin: origin.label,
        destination: destination.label,
        profile,
        distanceKm: Number(result.distanceKm.toFixed(2)),
        estimatedMinutes: result.estimatedMinutes,
        geometry: result.geometry,
        steps: [
          {
            id: "start",
            instruction: `Mulai dari ${origin.label}`,
            distanceMeters: 0,
          },
          {
            id: "finish",
            instruction: `Tiba di ${destination.label}`,
            distanceMeters: 0,
          },
        ],
      };

      setRoute(nextRoute);
      onRouteChange?.(nextRoute);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal mengambil rute.";

      setError(message);
      setRoute(null);
      onRouteChange?.(null);
    } finally {
      searching.current = false;
      setLoading(false);
    }
  }

  return (
    <section className="grid gap-4">
      <RouteSearchForm onSearch={handleSearch} loading={loading} />

      {loading && (
        <p className="text-sm text-[var(--color-muted)]">
          Menghitung rute...
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {route && (
        <RouteResult
          route={route}
          onViewDetail={() => setDetailOpen((open) => !open)}
        />
      )}

      {route && detailOpen && <RouteDetail route={route} />}
    </section>
  );
}
