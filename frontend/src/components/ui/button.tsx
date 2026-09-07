import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "map";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}) {
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-strong)] focus-visible:ring-[var(--color-primary)]",
    secondary: "border border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:bg-[var(--color-canvas)] focus-visible:ring-[var(--color-primary)]",
    ghost: "bg-transparent text-[var(--color-ink)] hover:bg-black/5 focus-visible:ring-[var(--color-primary)]",
    danger: "bg-[var(--color-risk)] text-white hover:brightness-95 focus-visible:ring-[var(--color-risk)]",
    map: "border border-white/70 bg-[var(--color-map-control)] text-[var(--color-ink)] shadow-[var(--shadow-card)] backdrop-blur hover:bg-white focus-visible:ring-[var(--color-primary)]",
  };
  const sizes: Record<ButtonSize, string> = {
    sm: "min-h-9 px-3 text-sm",
    md: "min-h-11 px-4 text-sm",
    lg: "min-h-12 px-5 text-base",
    icon: "size-11 p-0",
  };

  return (
    <button
      type={type}
      className={cn("inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
