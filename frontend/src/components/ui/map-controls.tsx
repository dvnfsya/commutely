import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import { Button } from "./button";

export function MapControls({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-[var(--shadow-float)]", className)}>{children}</div>;
}

export function MapControlButton({ label, children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return <Button variant="map" size="icon" aria-label={label} title={label} className={cn("rounded-none border-0 border-b border-[var(--color-line)] last:border-b-0 shadow-none", className)} {...props}>{children}</Button>;
}
