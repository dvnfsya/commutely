"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";

export type NavigationItem = { id: string; label: string; icon: ReactNode; disabled?: boolean };

export function MapNavigation({ items, activeId, onChange, className }: {
  items: NavigationItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <nav aria-label="Navigasi utama peta" className={cn("flex w-full items-center justify-around gap-1 rounded-t-[var(--radius-xl)] border border-b-0 border-[var(--color-line)] bg-white/95 px-2 py-2 shadow-[0_-8px_24px_rgba(17,18,38,0.08)] backdrop-blur md:w-auto md:rounded-[var(--radius-lg)] md:border", className)}>
      {items.map((item) => {
        const active = item.id === activeId;
        return <button key={item.id} type="button" disabled={item.disabled} aria-current={active ? "page" : undefined} onClick={() => onChange(item.id)} className={cn("flex min-w-16 flex-col items-center gap-1 rounded-[var(--radius-md)] px-3 py-2 text-xs font-semibold transition disabled:opacity-40", active ? "bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]" : "text-[var(--color-muted)] hover:bg-[var(--color-canvas)]")}><span aria-hidden="true" className="text-lg leading-none">{item.icon}</span>{item.label}</button>;
      })}
    </nav>
  );
}
