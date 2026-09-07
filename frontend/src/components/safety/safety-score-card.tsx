import { Card } from "../ui/card";
import { SafetyScoreIndicator } from "../ui/safety-score-indicator";
import type { SafetyScoreData } from "./types";

export function SafetyScoreCard({ safety, compact = false }: { safety: SafetyScoreData; compact?: boolean }) {
  return <Card className="space-y-4 p-4">
    <div className="flex items-center justify-between gap-4"><p className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">Safety Score</p><span className="text-xs text-[var(--color-muted)]">{safety.updatedAt}</span></div>
    <SafetyScoreIndicator compact={compact} score={safety.score} label={safety.label} tone={safety.tone} detail="Data prototype; bukan hasil perhitungan AI." />
  </Card>;
}
