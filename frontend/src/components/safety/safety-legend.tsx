import { cn } from "../ui/cn";
import type { SafetyLevel } from "./types";

const legendItems: Array<{ level: SafetyLevel; label: string; description: string; color: string }> = [
  { level: "safe", label: "Kondisi baik", description: "Konteks keamanan relatif lebih mendukung", color: "bg-[var(--color-safe)]" },
  { level: "caution", label: "Perlu perhatian", description: "Periksa indikator dan fasilitas di sekitar", color: "bg-[var(--color-caution)]" },
  { level: "risk", label: "Risiko lebih tinggi", description: "Gunakan informasi pendukung sebelum melanjutkan", color: "bg-[var(--color-risk)]" },
];

export function SafetyLegend({ compact = false, className }: { compact?: boolean; className?: string }) {
  return <section aria-label="Legenda Safety Score" className={cn("rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white/95 p-3 shadow-[var(--shadow-card)] backdrop-blur", className)}>
    <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">Legenda Safety Score</p>
    <ul className="grid gap-2">{legendItems.map((item) => <li key={item.level} className="flex items-start gap-2 text-xs"><span aria-hidden="true" className={cn("mt-1 size-2.5 shrink-0 rounded-full", item.color)} /><span><span className="block font-bold text-[var(--color-ink)]">{item.label}</span>{!compact && <span className="block leading-4 text-[var(--color-muted)]">{item.description}</span>}</span></li>)}</ul>
  </section>;
}
