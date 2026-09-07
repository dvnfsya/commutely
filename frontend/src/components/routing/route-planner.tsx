"use client";

import { useState } from "react";
import { dummyBaseRoute } from "./dummy-routes";
import { RouteDetail } from "./route-detail";
import { RouteResult } from "./route-result";
import { RouteSearchForm } from "./route-search-form";
import type { BaseRoute } from "./types";

/** Prototype route flow. Submit always returns the single predefined base route. */
export function RoutePlanner() {
  const [route, setRoute] = useState<BaseRoute | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  return <section className="grid gap-4"><RouteSearchForm onSearch={(origin, destination) => { setRoute({ ...dummyBaseRoute, origin, destination }); setDetailOpen(false); }} />{route && <RouteResult route={route} onViewDetail={() => setDetailOpen((open) => !open)} />}{route && detailOpen && <RouteDetail route={route} />}</section>;
}
