import { SafetyLegend } from "./safety-legend";

/** Small map overlay; the line colours are supplied by the current route GeoJSON. */
export function SafetyMapLegend() {
  return <SafetyLegend compact className="absolute bottom-3 left-3 z-10 max-w-52" />;
}
