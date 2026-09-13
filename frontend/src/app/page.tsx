"use client";

import { EmergencyContact } from "../components/emergency/emergency-contact";
import { useCallback, useState } from "react";
import { InteractiveMap } from "../components/map/interactive-map";
import { RoutePlanner } from "../components/routing/route-planner";
import { StationInfo } from "../components/station/station-info";
import { StationSchedule } from "../components/station/station-schedule";
import { Card } from "../components/ui/card";
import { MapNavigation } from "../components/ui/navigation";
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

  const [mapStation, setMapStation] =
    useState<SpatialProperties | null>(null);

  const [route, setRoute] =
    useState<BaseRoute | null>(null);

  const [walkingArea, setWalkingArea] =
    useState<WalkingArea | null>(null);

  const selectStation = useCallback(
    (code: string, point?: SpatialProperties) => {
      setWalkingArea(null);
      setMapStation(
        point ? { ...point, id: code } : null
      );
      setActivePanel("stations");
    },
    []
  );

  return (
    <div className="min-h-dvh bg-[var(--color-canvas)]">

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-white/95 px-3 py-3 backdrop-blur sm:px-6 lg:h-20">
        <div className="mx-auto flex h-full max-w-[100rem] items-center justify-between gap-4">

          {/* LOGO */}
          <div>
            <Heading
              as="h1"
              size="xl"
              className="text-[var(--color-primary-strong)]"
            >
              Commute.ly
            </Heading>
          </div>

          {/* RIGHT HEADER */}
          <div className="flex items-center gap-3">
            <EmergencyContact />
          </div>

        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="mx-auto grid max-w-[100rem] gap-4 p-3 sm:p-4 lg:h-[calc(100dvh-5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)] lg:overflow-hidden">

        {/* MAP */}
        <section
          aria-label="Eksplorasi peta dan stasiun"
          className="min-w-0 lg:h-full"
        >
          <div className="relative h-[min(65dvh,48rem)] min-h-80 lg:h-full lg:min-h-0">

            <InteractiveMap
              className="h-full min-h-0"
              onStationSelect={selectStation}
              route={route}
              walkingArea={walkingArea}
            />

            <AssistantChat
              stationId={mapStation?.id ?? null}
            />

          </div>
        </section>

        {/* SIDEBAR */}
        <aside
          aria-label="Informasi perjalanan"
          className="min-w-0 space-y-4 lg:h-full lg:overflow-y-auto lg:pr-1"
        >
          <MapNavigation
            items={navigation}
            activeId={activePanel}
            onChange={setActivePanel}
          />

          <Card>

            {/* STATION PANEL */}
            <div hidden={activePanel !== "stations"}>
              {mapStation ? (
                <>
                  <StationInfo station={mapStation} />

                  <StationSchedule
                    stationId={mapStation.id}
                  />

                  <WalkingControls
                    origin={{
                      id: mapStation.id,
                      name:
                        mapStation.name ??
                        "stasiun terpilih",
                      coordinates:
                        mapStation.coordinates,
                    }}
                    onChange={setWalkingArea}
                  />
                </>
              ) : (
                <Text size="sm" tone="muted">
                  Pilih stasiun pada peta untuk melihat
                  informasi stasiun.
                </Text>
              )}
            </div>

            {/* ROUTING PANEL */}
            <div
              hidden={activePanel !== "routing"}
              className="space-y-4"
            >
              <Heading size="md">
                Rencanakan perjalanan
              </Heading>

              <Text size="sm" tone="muted">
                Temukan rute dari lokasi kamu ke stasiun
                atau perjalanan pulang dari stasiun ke
                tujuan. 
              </Text>

              <RoutePlanner
                onRouteChange={setRoute}
              />
            </div>

          </Card>
        </aside>
      </main>

    </div>
  );
}