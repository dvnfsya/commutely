import type { StatusTone } from "../ui/status-indicator";
import type { SafetyIndicator } from "../safety/types";

export type FacilityType = "PJU" | "Kantor Polisi" | "Fasilitas Kesehatan" | "Retail 24 Jam";

export type StationSafety = {
  score: number;
  label: string;
  tone: StatusTone;
  updatedAt: string;
  highlights: string[];
  indicators: SafetyIndicator[];
};

export type Station = {
  id: string;
  code: string;
  name: string;
  area: string;
  coordinates: [number, number];
  safety: StationSafety;
};

export type NearbyFacility = {
  id: string;
  stationId: string;
  name: string;
  type: FacilityType;
  distanceMeters: number;
  description: string;
};
