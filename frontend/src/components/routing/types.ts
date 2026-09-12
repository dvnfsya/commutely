import type { FeatureCollection, LineString } from "geojson";

export type RoutingProfile = "foot-walking" | "cycling-regular" | "driving-car";
export const travelModes: Record<RoutingProfile, string> = {
  "foot-walking": "🚶 Jalan kaki", "cycling-regular": "🚲 Sepeda", "driving-car": "🚗 Mobil",
};
export type RouteLocation = {
  label: string;
  coordinates: [number, number];
  type?: "station" | "address" | "location";
};

export function hasValidCoordinates(location: RouteLocation | null): location is RouteLocation {
  return Boolean(location && location.coordinates.length === 2
    && Number.isFinite(location.coordinates[0]) && Math.abs(location.coordinates[0]) <= 180
    && Number.isFinite(location.coordinates[1]) && Math.abs(location.coordinates[1]) <= 90);
}

export type RouteStep = {
  id: string;
  instruction: string;
  distanceMeters: number;
};

export type BaseRoute = {
  profile: RoutingProfile;
  id: string;
  origin: string;
  destination: string;
  distanceKm: number;
  estimatedMinutes: number;
  geometry: FeatureCollection<LineString>;
  steps: RouteStep[];
};
