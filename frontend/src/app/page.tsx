"use client";

import { useCallback, useState } from "react";
import { InteractiveMap } from "../components/map/interactive-map";
import { RoutePlanner } from "../components/routing/route-planner";
import { StationInfo } from "../components/station/station-info";
import { StationSchedule } from "../components/station/station-schedule";
import { Card } from "../components/ui/card";
import { MapNavigation } from "../components/ui/navigation";
import { StatusIndicator } from "../components/ui/status-indicator";
import { Heading, Text } from "../components/ui/typography";
import type { BaseRoute } from "../components/routing/types";
import { AssistantChat } from "../components/assistant/assistant-chat";
import type { SpatialProperties } from "../lib/spatial-layers-api";
import type { WalkingArea } from "../lib/isochrone-api";
import { WalkingControls } from "../components/isochrone/walking-controls";

const navigation = [
  { id: "stations", label: "Stasiun", icon: "◉" },
  { id: "routing", label: "Rute", icon: "↗" },
];

export default function HomePage() {
  const [activePanel, setActivePanel] = useState("stations");
  const [mapStation, setMapStation] = useState<SpatialProperties | null>(null);
  const [route, setRoute] = useState<BaseRoute | null>(null);
  const [walkingArea, setWalkingArea] = useState<WalkingArea | null>(null);
  const selectStation = useCallback((code: string, point?: SpatialProperties) => {
    setWalkingArea(null);
    setMapStation(point ? { ...point, id: code } : null);
    setActivePanel("stations");
  }, []);

  return (
    <div className="mx-auto min-h-dvh max-w-[100rem] p-3 sm:p-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Heading as="h1" size="xl" className="text-[var(--color-primary-strong)]">Commute.ly</Heading>
          <Text tone="muted" size="sm">Your Commuting Buddy!</Text>
        </div>
        <StatusIndicator tone="info" label="Prototype · Data dummy" />
      </header>

      <main className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)]">
        <section aria-label="Eksplorasi peta dan stasiun" className="min-w-0 space-y-4 lg:sticky lg:top-6">
          <div className="relative">
          <InteractiveMap
            onStationSelect={selectStation}
            route={route}
            walkingArea={walkingArea}
          />
          <AssistantChat stationId={mapStation?.id ?? null} />
          </div>
          
        </section>

        <aside aria-label="Informasi perjalanan" className="min-w-0 space-y-4">
          <MapNavigation items={navigation} activeId={activePanel} onChange={setActivePanel} />
          <Card>
            <div hidden={activePanel !== "stations"}>
              {mapStation ? <>
                <StationInfo station={mapStation} />
                <StationSchedule stationId={mapStation.id} />
                <WalkingControls origin={{ id: mapStation.id, name: mapStation.name ?? "stasiun terpilih", coordinates: mapStation.coordinates }} onChange={setWalkingArea} />
              </> : <Text size="sm" tone="muted">Pilih stasiun pada peta untuk melihat informasi stasiun.</Text>}
            </div>
            <div hidden={activePanel !== "routing"} className="space-y-4">
              <Heading size="md">Rencanakan perjalanan</Heading>
              <Text size="sm" tone="muted">Temukan rute dari lokasi kamu ke stasiun atau perjalanan pulang dari stasiun ke tujuan. Data Safety Score stasiun masih berupa contoh.</Text>
              <RoutePlanner onRouteChange={setRoute} />
            </div>
          </Card>
        </aside>
      </main>
    </div>
  );
}
