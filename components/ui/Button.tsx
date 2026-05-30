import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "soft" | "ghost" | "accent";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-paper active:bg-ink-soft",
  accent: "bg-accent text-white active:bg-accent-ink",
  soft: "bg-paper text-ink ring-1 ring-line active:bg-line/60",
  ghost: "bg-transparent text-ink-muted active:bg-line/50",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-base font-semibold transition active:scale-[0.99] disabled:opacity-50";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button className={`${BASE} ${VARIANTS[variant]} ${className}`} {...props} />
  );
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return (
    <Link className={`${BASE} ${VARIANTS[variant]} ${className}`} {...props} />
  );
}
