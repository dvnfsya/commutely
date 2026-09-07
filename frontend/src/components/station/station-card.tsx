import { Card } from "../ui/card";
import { SafetyScoreIndicator } from "../ui/safety-score-indicator";
import type { Station } from "./types";

export function StationCard({ station, onSelect }: { station: Station; onSelect?: (station: Station) => void }) {
  const content = <><div><p className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-ink)]">{station.name}</p><p className="mt-1 text-sm text-[var(--color-muted)]">{station.area}</p></div><SafetyScoreIndicator compact score={station.safety.score} label={station.safety.label} tone={station.safety.tone} /></>;
  if (onSelect) return <button type="button" onClick={() => onSelect(station)} className="grid w-full gap-4 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 text-left shadow-[var(--shadow-card)] transition hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-float)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-soft)]">{content}</button>;
  return <Card className="grid gap-4">{content}</Card>;
}
