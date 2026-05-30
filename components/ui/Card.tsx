import type { ComponentProps } from "react";

/** A soft, large-radius surface card — the core visual unit. */
export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-4xl bg-surface p-5 shadow-soft ring-1 ring-line/70 ${className}`}
      {...props}
    />
  );
}
