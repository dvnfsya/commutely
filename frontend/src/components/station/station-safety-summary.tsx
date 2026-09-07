import { SafetyIndicators } from "../safety/safety-indicators";
import { SafetyScoreCard } from "../safety/safety-score-card";
import { SafetyScoreExplanation } from "../safety/safety-score-explanation";
import type { Station } from "./types";

export function StationSafetySummary({ station }: { station: Station }) {
  return <div className="grid gap-4"><SafetyScoreCard safety={station.safety} /><SafetyIndicators indicators={station.safety.indicators} /><SafetyScoreExplanation safety={station.safety} /></div>;
}
