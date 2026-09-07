import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export function Input({
  label,
  description,
  error,
  leading,
  className,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  description?: string;
  error?: string;
  leading?: ReactNode;
}) {
  const inputId = id ?? props.name;
  const hintId = inputId ? `${inputId}-hint` : undefined;
  return (
    <label className="grid gap-2 text-sm font-semibold text-[var(--color-ink)]">
      {label && <span>{label}</span>}
      <span className="relative flex items-center">
        {leading && <span aria-hidden="true" className="pointer-events-none absolute left-4 text-[var(--color-muted)]">{leading}</span>}
        <input
          id={inputId}
          aria-describedby={description || error ? hintId : undefined}
          aria-invalid={Boolean(error)}
          className={cn("min-h-12 w-full rounded-[var(--radius-md)] border bg-white px-4 text-base font-medium text-[var(--color-ink)] outline-none transition placeholder:font-normal placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]", Boolean(leading) && "pl-11", error ? "border-[var(--color-risk)]" : "border-[var(--color-line)]", className)}
          {...props}
        />
      </span>
      {(description || error) && <span id={hintId} className={cn("font-normal", error ? "text-[var(--color-risk)]" : "text-[var(--color-muted)]")}>{error ?? description}</span>}
    </label>
  );
}
