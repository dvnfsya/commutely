"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { cn } from "./cn";

export function Modal({ open, onClose, title, children, className }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-[color:rgb(17_18_38_/_0.42)] p-3 sm:place-items-center sm:p-6" role="presentation" onMouseDown={onClose}>
      <section aria-modal="true" aria-labelledby="commutely-modal-title" role="dialog" className={cn("max-h-[min(85dvh,48rem)] w-full max-w-lg overflow-y-auto rounded-[var(--radius-xl)] bg-white p-6 shadow-[var(--shadow-float)]", className)} onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id="commutely-modal-title" className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">{title}</h2>
          <button type="button" aria-label="Tutup dialog" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-full text-xl text-[var(--color-muted)] hover:bg-[var(--color-canvas)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">×</button>
        </div>
        {children}
      </section>
    </div>
  );
}
