"use client";

import { useEffect, useState } from "react";
import { Popup, type GeoJSONSource, type Map as MapLibreMap, type MapLayerMouseEvent } from "maplibre-gl";
import { communityPopup, fetchCommunityData, type CommunityData } from "../../lib/community-data-api";
import { dataLayerDefinitions } from "./map-layer-data";

type LoadState = { status: "loading" } | { status: "error" } | { status: "ready"; data: CommunityData };

export function CommunityDataLayer({ map, visible }: { map: MapLibreMap | null; visible: boolean }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchCommunityData(controller.signal).then(
      (data) => { if (!controller.signal.aborted) setState({ status: "ready", data }); },
      () => { if (!controller.signal.aborted) setState({ status: "error" }); },
    );
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    if (!map) return;
    if (!map.getSource("survey")) {
      map.addSource("survey", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "survey", type: "circle", source: "survey", paint: dataLayerDefinitions.survey.paint });
    }
    (map.getSource("survey") as GeoJSONSource).setData(state.status === "ready" ? state.data : { type: "FeatureCollection", features: [] });
    map.setLayoutProperty("survey", "visibility", visible ? "visible" : "none");
    let popup: Popup | undefined;
    const click = (event: MapLayerMouseEvent) => {
      const properties = event.features?.[0]?.properties;
      if (!properties) return;
      popup?.remove();
      popup = new Popup({ offset: 12 }).setLngLat(event.lngLat).setDOMContent(communityPopup(properties)).addTo(map);
    };
    const enter = () => { map.getCanvas().style.cursor = "pointer"; };
    const leave = () => { map.getCanvas().style.cursor = ""; };
    map.on("click", "survey", click);
    map.on("mouseenter", "survey", enter);
    map.on("mouseleave", "survey", leave);
    return () => {
      popup?.remove();
      map.off("click", "survey", click);
      map.off("mouseenter", "survey", enter);
      map.off("mouseleave", "survey", leave);
      map.getCanvas().style.cursor = "";
    };
  }, [map, state, visible]);

  if (!visible) return null;
  return <div role="status" className="absolute bottom-3 left-20 z-10 max-w-[calc(100%-9rem)] rounded-lg bg-white/95 px-3 py-2 text-xs text-slate-700 shadow">
    {state.status === "loading" ? "Memuat Community Data…" : state.status === "error" ? <>
      Community Data gagal dimuat. <button type="button" className="underline" onClick={() => { setState({ status: "loading" }); setAttempt((value) => value + 1); }}>Coba lagi</button>
    </> : state.data.features.length === 0 ? "Belum ada Community Data." : `Community Data · ${state.data.features.length} titik`}
  </div>;
}
