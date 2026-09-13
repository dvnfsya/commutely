import type { FeatureCollection } from "geojson";
import { Popup, type Map as MapLibreMap } from "maplibre-gl";
import { healthGeoJson, nighttimeLightGeoJson, pjuGeoJson, policeGeoJson, retailGeoJson } from "./dummy-geojson";

export const DATA_LAYER_IDS = ["pju", "nighttime-light", "police", "health", "retail", "survey"] as const;
export type DataLayerId = (typeof DATA_LAYER_IDS)[number];

type LayerDefinition = {
  label: string;
  description: string;
  data: FeatureCollection;
  mapType: "circle" | "fill";
  paint: Record<string, unknown>;
};

export const dataLayerDefinitions: Record<DataLayerId, LayerDefinition> = {
  pju: { label: "PJU", description: "Penerangan Jalan Umum", data: pjuGeoJson, mapType: "circle", paint: { "circle-radius": 7, "circle-color": "#facc15", "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" } },
  "nighttime-light": { label: "Nighttime Light", description: "Konteks pencahayaan malam", data: nighttimeLightGeoJson, mapType: "fill", paint: { "fill-color": "#3730a3", "fill-opacity": 0.24, "fill-outline-color": "#6366f1" } },
  police: { label: "Kantor polisi", description: "Fasilitas kepolisian", data: policeGeoJson, mapType: "circle", paint: { "circle-radius": 8, "circle-color": "#2563eb", "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" } },
  health: { label: "Fasilitas kesehatan", description: "Layanan kesehatan terdekat", data: healthGeoJson, mapType: "circle", paint: { "circle-radius": 8, "circle-color": "#14b8a6", "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" } },
  retail: { label: "Retail 24 jam", description: "Aktivitas ekonomi malam", data: retailGeoJson, mapType: "circle", paint: { "circle-radius": 8, "circle-color": "#7c3aed", "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" } },
  survey: { label: "Community Data", description: "Survei #RekaModa", data: { type: "FeatureCollection", features: [] }, mapType: "circle", paint: { "circle-radius": 7, "circle-color": "#ff3d8d", "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" } },
};

/** Adds a source only after a user enables its layer; later toggles only change visibility. */
export function ensureDataLayer(map: MapLibreMap, layerId: DataLayerId, visible: boolean) {
  const definition = dataLayerDefinitions[layerId];
  if (!map.getSource(layerId)) {
    map.addSource(layerId, { type: "geojson", data: definition.data });
    map.addLayer({ id: layerId, type: definition.mapType, source: layerId, paint: definition.paint } as never);
    map.on("click", layerId, (event) => {
      const properties = event.features?.[0]?.properties;
      if (!properties) return;
      const popup = document.createElement("div");
      popup.innerHTML = `<strong>${properties.name ?? definition.label}</strong><br/><span>${properties.type ?? definition.description}</span>`;
      new Popup({ offset: 12 }).setLngLat(event.lngLat).setDOMContent(popup).addTo(map);
    });
    map.on("mouseenter", layerId, () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", layerId, () => { map.getCanvas().style.cursor = ""; });
  }
  map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
}
