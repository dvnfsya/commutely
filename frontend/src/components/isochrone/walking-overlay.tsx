"use client";

import { useEffect } from "react";
import { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import type { WalkingArea } from "../../lib/isochrone-api";

export function WalkingOverlay({ map, area }: { map: MapLibreMap | null; area: WalkingArea | null }) {
  useEffect(() => {
    if (!map) return;
    const id = "walking-area";
    if (!map.getSource(id)) {
      map.addSource(id, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      const before = map.getLayer("ors-route-line") ? "ors-route-line" : undefined;
      map.addLayer({ id, source: id, type: "fill", paint: { "fill-color": "#6366f1", "fill-opacity": 0.2 } }, before);
      map.addLayer({ id: `${id}-outline`, source: id, type: "line", paint: { "line-color": "#4f46e5", "line-width": 2 } }, before);
    }
    (map.getSource(id) as GeoJSONSource).setData(area ?? { type: "FeatureCollection", features: [] });
  }, [map, area]);
  if (!area?.features.length) return null;
  return <div className="absolute bottom-20 right-3 z-10 max-w-[65%] rounded-lg bg-white/95 px-3 py-2 text-xs text-slate-700 shadow" aria-label="Legenda area berjalan kaki">
    <span className="mr-2 inline-block size-3 border border-indigo-600 bg-indigo-200" />Area jangkauan berjalan kaki · {area.features[0].properties.duration_s / 60} menit
  </div>;
}
