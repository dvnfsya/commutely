import type { FeatureCollection } from "geojson";

export const DATA_LAYER_IDS = ["pju", "police", "health", "survey"] as const;
export type DataLayerId = (typeof DATA_LAYER_IDS)[number];

type LayerDefinition = {
  label: string;
  description: string;
  data: FeatureCollection;
  mapType: "circle" | "fill";
  paint: Record<string, unknown>;
};

export const dataLayerDefinitions: Record<DataLayerId, LayerDefinition> = {
  pju: { label: "PJU", description: "Penerangan Jalan Umum", data: { type: "FeatureCollection", features: [] }, mapType: "circle", paint: { "circle-radius": 7, "circle-color": "#facc15", "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" } },
  police: { label: "Kantor polisi", description: "Fasilitas kepolisian", data: { type: "FeatureCollection", features: [] }, mapType: "circle", paint: { "circle-radius": 8, "circle-color": "#2563eb", "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" } },
  health: { label: "Fasilitas kesehatan", description: "Layanan kesehatan terdekat", data: { type: "FeatureCollection", features: [] }, mapType: "circle", paint: { "circle-radius": 8, "circle-color": "#14b8a6", "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" } },
  survey: { label: "Community Data", description: "Survei #RekaModa", data: { type: "FeatureCollection", features: [] }, mapType: "circle", paint: { "circle-radius": 7, "circle-color": "#ff3d8d", "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" } },
};
