"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import { Button } from "../ui/button";
import { cn } from "../ui/cn";
import { SafetyMapLegend } from "../safety/safety-map-legend";
import { addRouteSafetyScoreOverlay, ROUTE_SAFETY_LAYER_ID } from "../safety/route-safety-score-overlay";
import { dummyBaseRoute } from "../routing/dummy-routes";
import { DATA_LAYER_IDS, ensureDataLayer, type DataLayerId } from "./map-layer-data";
import { MapLayerControl, type MapLayerControlState } from "./map-layer-control";
import { stationGeoJson } from "./dummy-geojson";
import styles from "./map-overrides.module.css";

const DEFAULT_CENTER: [number, number] = [106.8272, -6.2045];
type LayerKey = DataLayerId | "safety-route" | "stations";
type LayerVisibility = Record<LayerKey, boolean>;
const initialVisibility: LayerVisibility = { stations: true, "safety-route": true, pju: false, "nighttime-light": false, police: false, health: false, retail: false, survey: false };

export type InteractiveMapProps = {
  /** MAPID Maps style JSON URL. Configure it through NEXT_PUBLIC_MAPID_STYLE_URL. */
  mapStyleUrl?: string;
  className?: string;
  onStationSelect?: (stationCode: string) => void;
};

export function InteractiveMap({ mapStyleUrl = process.env.NEXT_PUBLIC_MAPID_STYLE_URL, className, onStationSelect }: InteractiveMapProps) {
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [visibility, setVisibility] = useState<LayerVisibility>(initialVisibility);

  useEffect(() => {
    if (!mapNode.current || !mapStyleUrl || mapRef.current) return;
    const map = new maplibregl.Map({ container: mapNode.current, style: mapStyleUrl, center: DEFAULT_CENTER, zoom: 12.8, attributionControl: true });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
    map.on("load", () => {
      addRouteSafetyScoreOverlay(map, dummyBaseRoute);
      map.on("click", ROUTE_SAFETY_LAYER_ID, (event) => {
        const feature = event.features?.[0];
        if (!feature) return;
        const { safetyScore, safetyLabel } = feature.properties ?? {};
        new maplibregl.Popup({ offset: 12 }).setLngLat(event.lngLat).setHTML(`<strong>Safety Score ruas: ${safetyScore ?? "—"}</strong><br/><span>${safetyLabel ?? "Data dummy"}</span>`).addTo(map);
      });
      map.on("mouseenter", ROUTE_SAFETY_LAYER_ID, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", ROUTE_SAFETY_LAYER_ID, () => { map.getCanvas().style.cursor = ""; });
      stationGeoJson.features.forEach((feature) => {
        const element = document.createElement("button");
        element.type = "button";
        element.className = styles.stationMarker;
        element.setAttribute("aria-label", feature.properties.name);
        element.textContent = feature.properties.code;
        const popup = new maplibregl.Popup({ offset: 18 }).setHTML(`<strong>${feature.properties.name}</strong><br/><span>${feature.properties.area}</span>`);
        const marker = new maplibregl.Marker({ element, anchor: "bottom" }).setLngLat(feature.geometry.coordinates as [number, number]).setPopup(popup).addTo(map);
        element.addEventListener("click", () => onStationSelect?.(feature.properties.code));
        marker.getElement().dataset.layer = "stations";
      });
      setMapReady(true);
    });
    return () => { map.remove(); mapRef.current = null; setMapReady(false); };
  }, [mapStyleUrl, onStationSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (map.getLayer(ROUTE_SAFETY_LAYER_ID)) map.setLayoutProperty(ROUTE_SAFETY_LAYER_ID, "visibility", visibility["safety-route"] ? "visible" : "none");
    DATA_LAYER_IDS.forEach((layerId) => {
      // A data source is created only the first time its layer is made visible.
      if (visibility[layerId] || map.getSource(layerId)) ensureDataLayer(map, layerId, visibility[layerId]);
    });
    map.getContainer().querySelectorAll<HTMLElement>("[data-layer='stations']").forEach((marker) => { marker.style.display = visibility.stations ? "block" : "none"; });
  }, [mapReady, visibility]);

  const toggleLayer = (layer: DataLayerId | "stations") => setVisibility((current) => ({ ...current, [layer]: !current[layer] }));
  if (!mapStyleUrl) return <div className={cn("grid min-h-80 place-items-center rounded-[var(--radius-xl)] bg-[var(--color-canvas)] p-6 text-center", className)}><p className="max-w-sm text-sm leading-6 text-[var(--color-muted)]">Tambahkan URL style MAPID Maps ke <code>NEXT_PUBLIC_MAPID_STYLE_URL</code> agar peta dapat dimuat.</p></div>;

  return <section aria-label="Peta interaktif Commute.ly" className={cn("relative isolate h-[min(70dvh,48rem)] min-h-80 w-full overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-canvas)] sm:h-[min(78dvh,52rem)]", className)}>
    <div ref={mapNode} className="absolute inset-0" />
    <MapLayerControl visibility={visibility as MapLayerControlState} onToggle={toggleLayer} />
    <SafetyMapLegend />
  </section>;
}
