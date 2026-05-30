"use client";

/** A horizontal +/- number control for one-handed, keyboard-free logging. */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label="decrease"
        onClick={() => onChange(clamp(value - 1))}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper text-ink ring-1 ring-line active:scale-95 active:bg-line/60"
      >
        <Glyph minus />
      </button>
      <span className="w-9 text-center text-2xl font-bold tabular-nums text-ink">
        {value}
      </span>
      <button
        type="button"
        aria-label="increase"
        onClick={() => onChange(clamp(value + 1))}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-paper active:scale-95 active:bg-ink-soft"
      >
        <Glyph />
      </button>
    </div>
  );
}

function Glyph({ minus = false }: { minus?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
    >
      <line x1="6" y1="12" x2="18" y2="12" />
      {!minus && <line x1="12" y1="6" x2="12" y2="18" />}
    </svg>
  );
}
