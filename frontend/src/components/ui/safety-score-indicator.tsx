import { cn } from "./cn";
import { StatusIndicator, type StatusTone } from "./status-indicator";

export function SafetyScoreIndicator({ score, label, tone = "neutral", detail, compact = false, className }: {
  score: number | string;
  label: string;
  tone?: StatusTone;
  detail?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <div className={cn("grid shrink-0 place-items-center rounded-full border-4 border-[var(--color-primary-soft)] bg-white font-[family-name:var(--font-display)] font-bold tabular-nums text-[var(--color-ink)]", compact ? "size-14 text-sm" : "size-16 text-lg")}>{score}</div>
      <div className="min-w-0">
        <StatusIndicator label={label} tone={tone} />
        {detail && <p className="mt-1 text-sm leading-5 text-[var(--color-muted)]">{detail}</p>}
      </div>
    </div>
  );
}
