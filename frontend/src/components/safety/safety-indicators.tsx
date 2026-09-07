import type { SafetyIndicator } from "./types";
import { StatusIndicator } from "../ui/status-indicator";

const indicatorIcon: Record<string, string> = { lighting: "💡", nighttime: "◐", police: "🛡", retail: "▣", survey: "⌖" };

export function SafetyIndicators({ indicators }: { indicators: SafetyIndicator[] }) {
  return <section aria-labelledby="safety-indicators-title">
    <h3 id="safety-indicators-title" className="mb-3 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-ink)]">Indikator penyusun score</h3>
    <ul className="grid gap-2">{indicators.map((indicator) => <li key={indicator.id} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-3"><span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-canvas)] text-lg">{indicatorIcon[indicator.id] ?? "•"}</span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-[var(--color-ink)]">{indicator.name}</span><span className="block text-xs leading-4 text-[var(--color-muted)]">{indicator.description}</span></span><StatusIndicator label={indicator.status} tone={indicator.tone} className="shrink-0" /></li>)}</ul>
  </section>;
}
