import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type TextTone = "default" | "muted" | "primary" | "danger";

const toneClasses: Record<TextTone, string> = {
  default: "text-[var(--color-ink)]",
  muted: "text-[var(--color-muted)]",
  primary: "text-[var(--color-primary-strong)]",
  danger: "text-[var(--color-risk)]",
};

export function Heading({
  as: Tag = "h2",
  size = "lg",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & {
  as?: "h1" | "h2" | "h3" | "h4";
  size?: "xl" | "lg" | "md" | "sm";
  children: ReactNode;
}) {
  const sizes = {
    xl: "text-3xl leading-tight sm:text-4xl",
    lg: "text-2xl leading-tight sm:text-3xl",
    md: "text-xl leading-snug",
    sm: "text-lg leading-snug",
  };

  return <Tag className={cn("font-[family-name:var(--font-display)] font-bold tracking-[-0.02em]", sizes[size], className)} {...props}>{children}</Tag>;
}

export function Text({
  as: Tag = "p",
  tone = "default",
  size = "md",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: "p" | "span" | "div";
  tone?: TextTone;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}) {
  const sizes = { sm: "text-sm leading-5", md: "text-base leading-6", lg: "text-lg leading-7" };
  return <Tag className={cn(sizes[size], toneClasses[tone], className)} {...props}>{children}</Tag>;
}
