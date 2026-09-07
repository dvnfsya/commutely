import type { Map as MapLibreMap } from "maplibre-gl";
import type { BaseRoute } from "../routing/types";

export const ROUTE_SAFETY_SOURCE_ID = "safety-route";
export const ROUTE_SAFETY_LAYER_ID = "safety-route";

/**
 * Adds visual context to the supplied base route geometry.
 * It does not request, select, recalculate, or redirect any route.
 */
export function addRouteSafetyScoreOverlay(map: MapLibreMap, route: BaseRoute) {
  map.addSource(ROUTE_SAFETY_SOURCE_ID, { type: "geojson", data: route.geometry });
  map.addLayer({
    id: ROUTE_SAFETY_LAYER_ID,
    type: "line",
    source: ROUTE_SAFETY_SOURCE_ID,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-width": 7,
      "line-opacity": 0.88,
      "line-color": [
        "interpolate", ["linear"], ["get", "safetyScore"],
        0, "#ef476f",
        50, "#f59e0b",
        100, "#0cae80",
      ],
    },
  });
}
