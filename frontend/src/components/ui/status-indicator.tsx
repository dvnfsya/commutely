import { cn } from "./cn";

export type StatusTone = "safe" | "caution" | "risk" | "info" | "neutral";

export function StatusIndicator({ label, tone = "neutral", className }: { label: string; tone?: StatusTone; className?: string }) {
  const styles: Record<StatusTone, string> = {
    safe: "bg-emerald-50 text-[var(--color-safe)]",
    caution: "bg-amber-50 text-[var(--color-caution)]",
    risk: "bg-rose-50 text-[var(--color-risk)]",
    info: "bg-blue-50 text-[var(--color-info)]",
    neutral: "bg-[var(--color-canvas)] text-[var(--color-muted)]",
  };
  const dots: Record<StatusTone, string> = { safe: "bg-[var(--color-safe)]", caution: "bg-[var(--color-caution)]", risk: "bg-[var(--color-risk)]", info: "bg-[var(--color-info)]", neutral: "bg-[var(--color-muted)]" };
  return <span className={cn("inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-bold", styles[tone], className)}><span className={cn("size-2 rounded-full", dots[tone])} aria-hidden="true" />{label}</span>;
}
