import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export function MapPanel({ title, children, side = "bottom", className, ...props }: HTMLAttributes<HTMLElement> & {
  title?: string;
  children: ReactNode;
  side?: "left" | "right" | "bottom";
}) {
  const placement = {
    left: "left-3 top-3 bottom-3 w-[min(24rem,calc(100vw-1.5rem))]",
    right: "right-3 top-3 bottom-3 w-[min(24rem,calc(100vw-1.5rem))]",
    bottom: "bottom-0 left-0 right-0 max-h-[70dvh] rounded-b-none sm:bottom-4 sm:left-4 sm:right-auto sm:w-[min(28rem,calc(100vw-2rem))] sm:rounded-[var(--radius-xl)]",
  };
  return <aside className={cn("absolute z-20 overflow-y-auto rounded-t-[var(--radius-xl)] border border-[var(--color-line)] bg-white/98 p-5 shadow-[var(--shadow-float)] backdrop-blur", placement[side], className)} {...props}>
    <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[var(--color-line)] sm:hidden" />
    {title && <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">{title}</h2>}
    {children}
  </aside>;
}
