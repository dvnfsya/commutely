"use client";

import { useEffect, useState } from "react";
import { Popup, type GeoJSONSource, type Map as MapLibreMap, type MapLayerMouseEvent } from "maplibre-gl";
import { fetchSpatialLayer, type Retail24hProperties, type SpatialLayerId, type SpatialProperties } from "../../lib/spatial-layers-api";
import type { MapLayerControlState } from "./map-layer-control";

const definitions = {
  stations: { label: "Stasiun", color: "#e83e8c" },
  pju: { label: "PJU", color: "#eab308" },
  health: { label: "Fasilitas kesehatan", color: "#14b8a6" },
  police: { label: "Kantor polisi", color: "#2563eb" },
  retail24h: { label: "Fasilitas 24 Jam", color: "#f97316" },
};

function textProperty(properties: Record<string, unknown>, key: keyof Retail24hProperties) {
  const value = properties[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function retailPopup(properties: Record<string, unknown>) {
  const content = document.createElement("div");
  content.className = "space-y-1 text-sm text-slate-700";
  const name = textProperty(properties, "name") ?? "Retail 24 Jam";
  const title = document.createElement("strong");
  title.className = "block text-slate-900";
  title.textContent = name;
  content.append(title);

  const addField = (label: string, value: string | null) => {
    if (!value) return;
    const field = document.createElement("div");
    field.textContent = `${label}: ${value}`;
    content.append(field);
  };
  addField("Kategori", textProperty(properties, "category"));
  addField("Alamat", textProperty(properties, "address"));
  const rating = properties.rating;
  if (typeof rating === "number" && Number.isFinite(rating)) addField("Rating", String(rating));
  addField("Telepon", textProperty(properties, "phone"));

  const website = textProperty(properties, "website");
  if (website) {
    const field = document.createElement("div");
    const link = document.createElement("a");
    try {
      const url = new URL(website);
      if (url.protocol === "http:" || url.protocol === "https:") {
        link.href = url.toString();
        link.target = "_blank";
        link.rel = "noreferrer";
      }
    } catch { /* Display an unparseable URL without making it a link. */ }
    link.className = "text-blue-600 underline";
    link.textContent = website;
    field.append("Website: ", link);
    content.append(field);
  }
  return content;
}

function SpatialLayer({ map, layer, visible, onStationSelect }: {
  map: MapLibreMap; layer: SpatialLayerId; visible: boolean;
  onStationSelect?: (code: string, station?: SpatialProperties) => void;
}) {
  const [status, setStatus] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const id = `db-${layer}`;
    const empty = { type: "FeatureCollection" as const, features: [] };
    if (!map.getSource(id)) {
      map.addSource(id, { type: "geojson", data: empty });
      if (layer === "stations") map.addLayer({ id, type: "symbol", source: id, layout: { "text-field": "🚆", "text-size": 22, "text-allow-overlap": true, "text-ignore-placement": true } });
      else map.addLayer({ id, type: "circle", source: id, paint: { "circle-radius": layer === "pju" ? 3 : 7, "circle-color": definitions[layer].color, "circle-stroke-width": 1, "circle-stroke-color": "#ffffff" } });
    }
    //   map.addLayer({ id, type: "circle", source: id, paint: {
    //     "circle-radius": layer === "pju" ? 3 : 7, "circle-color": definitions[layer].color,
    //     "circle-stroke-width": 1, "circle-stroke-color": "#ffffff",
    //   } });
    // }
    map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
    if (!visible) return;
    let active = true;
    let controller: AbortController | undefined;
    let timer: ReturnType<typeof setTimeout>;
    let popup: Popup | undefined;
    const source = map.getSource(id) as GeoJSONSource;
    const load = async () => {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      setStatus("Memuat…");
      source.setData(empty);
      try {
        const bounds = map.getBounds();
        const bbox = layer === "pju" ? [Math.max(-180, bounds.getWest()), Math.max(-90, bounds.getSouth()), Math.min(180, bounds.getEast()), Math.min(90, bounds.getNorth())] : undefined;
        const data = await fetchSpatialLayer(layer, request.signal, bbox);
        if (!active || request.signal.aborted) return;
        source.setData(data);
        setStatus(data.zoom_in_required ? "Perbesar peta untuk melihat PJU (maks. 2.000 titik)." : data.features.length ? "" : "Tidak ada data di area ini.");
      } catch {
        if (active && !request.signal.aborted) setStatus("Gagal memuat.");
      }
    };
    const schedule = () => {
      controller?.abort();
      source.setData(empty);
      setStatus("Memuat…");
      clearTimeout(timer);
      timer = setTimeout(() => void load(), 350);
    };
    const moving = () => { controller?.abort(); clearTimeout(timer); source.setData(empty); popup?.remove(); };
    const click = (event: MapLayerMouseEvent) => {
      const properties = event.features?.[0]?.properties;
      if (!properties) return;
      if (layer === "retail24h") {
        popup?.remove();
        popup = new Popup({ offset: 12 }).setLngLat(event.lngLat).setDOMContent(retailPopup(properties)).addTo(map);
        return;
      }
      if (typeof properties.id !== "string") return;
      const name = typeof properties.name === "string" ? properties.name : null;
      const geometry = event.features?.[0]?.geometry;
      const coordinates = geometry?.type === "Point" && Array.isArray(geometry.coordinates)
        && geometry.coordinates.length === 2 && geometry.coordinates.every((value) => typeof value === "number" && Number.isFinite(value))
        ? [geometry.coordinates[0], geometry.coordinates[1]] as [number, number] : undefined;
      const content = document.createElement("div");
      content.textContent = name ?? definitions[layer].label;
      popup?.remove();
      popup = new Popup({ offset: 12 }).setLngLat(event.lngLat).setDOMContent(content).addTo(map);
      if (layer === "stations") onStationSelect?.(properties.id, { id: properties.id, name, coordinates });
    };
    const enter = () => { map.getCanvas().style.cursor = "pointer"; };
    const leave = () => { map.getCanvas().style.cursor = ""; };
    map.on("click", id, click); map.on("mouseenter", id, enter); map.on("mouseleave", id, leave);
    if (layer === "pju") { map.on("movestart", moving); map.on("moveend", schedule); }
    void load();
    return () => {
      active = false; controller?.abort(); clearTimeout(timer); popup?.remove();
      map.off("movestart", moving); map.off("moveend", schedule); map.off("click", id, click);
      map.off("mouseenter", id, enter); map.off("mouseleave", id, leave);
      map.getCanvas().style.cursor = "";
    };
  }, [map, layer, visible, onStationSelect, attempt]);
  if (!visible || !status) return null;
  return <div role="status" className="rounded bg-white/95 px-2 py-1 text-xs shadow">{definitions[layer].label}: {status}
    {status === "Gagal memuat." && <button className="ml-2 underline" onClick={() => setAttempt((value) => value + 1)}>Coba lagi</button>}
  </div>;
}

export function SpatialDataLayers({ map, visibility, onStationSelect }: {
  map: MapLibreMap | null; visibility: MapLayerControlState;
  onStationSelect?: (code: string, station?: SpatialProperties) => void;
}) {
  if (!map) return null;
  return <div className="absolute right-3 top-3 z-10 max-w-[65%] space-y-1 text-slate-700">
    {(Object.keys(definitions) as SpatialLayerId[]).map((layer) => <SpatialLayer key={layer} map={map} layer={layer} visible={visibility[layer]} onStationSelect={onStationSelect} />)}
  </div>;
}
