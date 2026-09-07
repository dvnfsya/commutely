import type { FeatureCollection, LineString } from "geojson";
import type { SafetyLevel } from "../safety/types";

/** Precomputed/dummy context for one existing base-route segment; never used to create a route. */
export type RouteSegmentProperties = {
  level: SafetyLevel;
  safetyScore: number;
  safetyLabel: string;
};

export type RouteStep = {
  id: string;
  instruction: string;
  distanceMeters: number;
};

export type BaseRoute = {
  id: string;
  origin: string;
  destination: string;
  distanceKm: number;
  estimatedMinutes: number;
  geometry: FeatureCollection<LineString, RouteSegmentProperties>;
  steps: RouteStep[];
};
