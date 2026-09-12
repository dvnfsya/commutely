"use client";

import { useCallback, useState } from "react";
import { InteractiveMap } from "../components/map/interactive-map";
import { RoutePlanner } from "../components/routing/route-planner";
import { dummyStations } from "../components/station/dummy-stations";
import { StationCard } from "../components/station/station-card";
import { StationInfo } from "../components/station/station-info";
import { Card } from "../components/ui/card";
import { MapNavigation } from "../components/ui/navigation";
import { StatusIndicator } from "../components/ui/status-indicator";
import { Heading, Text } from "../components/ui/typography";
import type { BaseRoute } from "../components/routing/types";

const navigation = [
  { id: "stations", label: "Stasiun", icon: "◉" },
  { id: "routing", label: "Rute", icon: "↗" },
];

export default function HomePage() {
  const [activePanel, setActivePanel] = useState("stations");
  const [station, setStation] = useState(dummyStations[0]);
  const [route, setRoute] = useState<BaseRoute | null>(null);
  const selectStation = useCallback((code: string) => {
    const selected = dummyStations.find((item) => item.code === code);
    if (selected) {
      setStation(selected);
      setActivePanel("stations");
    }
  }, []);

  return (
    <div className="mx-auto min-h-dvh max-w-[100rem] p-3 sm:p-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Heading as="h1" size="xl" className="text-[var(--color-primary-strong)]">Commute.ly</Heading>
          <Text tone="muted" size="sm">Konteks keamanan perjalanan KRL di Jakarta</Text>
        </div>
        <StatusIndicator tone="info" label="Prototype · Data dummy" />
      </header>

      <main className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)]">
        <section aria-label="Eksplorasi peta dan stasiun" className="min-w-0 space-y-4 lg:sticky lg:top-6">
          <InteractiveMap
            onStationSelect={selectStation}
            route={route}
          />
          <div>
            <Heading size="md" className="mb-3">Jelajahi stasiun</Heading>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {dummyStations.map((item) => (
                <StationCard key={item.id} station={item} onSelect={(selected) => selectStation(selected.code)} />
              ))}
            </div>
          </div>
        </section>

        <aside aria-label="Informasi perjalanan" className="min-w-0 space-y-4">
          <MapNavigation items={navigation} activeId={activePanel} onChange={setActivePanel} />
          <Card>
            <div hidden={activePanel !== "stations"}>
              <StationInfo station={station} />
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
