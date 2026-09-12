"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useEffect, useRef, useState } from "react";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import { cn } from "../ui/cn";
import type { BaseRoute } from "../routing/types";
import { DATA_LAYER_IDS, ensureDataLayer, type DataLayerId } from "./map-layer-data";
import { MapLayerControl, type MapLayerControlState } from "./map-layer-control";
import { stationGeoJson } from "./dummy-geojson";
import styles from "./map-overrides.module.css";


const DEFAULT_CENTER: [number, number] = [106.8272, -6.2045];
const ROUTE_SOURCE_ID = "ors-route";
const ROUTE_LAYER_ID = "ors-route-line";
type LayerKey = DataLayerId | "stations";
type LayerVisibility = Record<LayerKey, boolean>;
const initialVisibility: LayerVisibility = { stations: true, pju: false, "nighttime-light": false, police: false, health: false, retail: false, survey: false };

export type InteractiveMapProps = {
  /** MAPID Maps style JSON URL. Configure it through NEXT_PUBLIC_MAPID_STYLE_URL. */
  mapStyleUrl?: string;
  className?: string;
  onStationSelect?: (stationCode: string) => void;
  route?: BaseRoute | null;
};

export function InteractiveMap({ mapStyleUrl = process.env.NEXT_PUBLIC_MAPID_STYLE_URL, className, onStationSelect, route }: InteractiveMapProps) {
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [visibility, setVisibility] = useState<LayerVisibility>(initialVisibility);

  useEffect(() => {
    if (!mapNode.current || !mapStyleUrl || mapRef.current) return;
    const map = new maplibregl.Map({ container: mapNode.current, style: mapStyleUrl, center: DEFAULT_CENTER, zoom: 12.8, attributionControl: {} });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
    map.on("load", () => {
      map.addSource(ROUTE_SOURCE_ID, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: ROUTE_LAYER_ID,
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#2563eb", "line-width": 5, "line-opacity": 0.9 },
      });
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
    DATA_LAYER_IDS.forEach((layerId) => {
      // A data source is created only the first time its layer is made visible.
      if (visibility[layerId] || map.getSource(layerId)) ensureDataLayer(map, layerId, visibility[layerId]);
    });
    map.getContainer().querySelectorAll<HTMLElement>("[data-layer='stations']").forEach((marker) => { marker.style.display = visibility.stations ? "block" : "none"; });
  }, [mapReady, visibility]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const source = map.getSource(ROUTE_SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(route?.geometry ?? { type: "FeatureCollection", features: [] });
    if (route) {
      const bounds = new maplibregl.LngLatBounds();
      route.geometry.features.forEach((feature) => feature.geometry.coordinates.forEach(
        (coordinate) => bounds.extend([coordinate[0], coordinate[1]]),
      ));
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 500 });
    }
  }, [mapReady, route]);

  const toggleLayer = (layer: DataLayerId | "stations") => setVisibility((current) => ({ ...current, [layer]: !current[layer] }));
  if (!mapStyleUrl?.trim()) return <section aria-label="Peta interaktif Commute.ly" className={cn("grid min-h-80 place-items-center rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white p-6 text-center", className)}><div className="min-w-0 max-w-sm"><h2 className="mb-2 text-lg font-bold">Peta belum tersedia</h2><p className="text-sm leading-6 text-[var(--color-muted)]">Tambahkan URL style MAPID Maps ke <code className="break-all">NEXT_PUBLIC_MAPID_STYLE_URL</code> agar peta dapat dimuat.</p><p className="mt-3 text-sm text-[var(--color-muted)]">Informasi stasiun dan demo rute tetap dapat dijelajahi.</p></div></section>;

  return <section aria-label="Peta interaktif Commute.ly" className={cn("relative isolate h-[min(70dvh,48rem)] min-h-80 w-full overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-canvas)] sm:h-[min(78dvh,52rem)]", className)}>
    <div className="absolute inset-0">
      <div ref={mapNode} className="h-full w-full" />
    </div>
    <MapLayerControl visibility={visibility as MapLayerControlState} onToggle={toggleLayer} />
  </section>;
}
