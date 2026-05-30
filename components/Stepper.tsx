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
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ground-200 text-ground-700 active:scale-95 active:bg-ground-300"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
        >
          <line x1="6" y1="12" x2="18" y2="12" />
        </svg>
      </button>
      <span className="w-10 text-center text-2xl font-bold tabular-nums text-ground-900">
        {value}
      </span>
      <button
        type="button"
        aria-label="increase"
        onClick={() => onChange(clamp(value + 1))}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-clay-500 text-white active:scale-95 active:bg-clay-600"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
        >
          <line x1="6" y1="12" x2="18" y2="12" />
          <line x1="12" y1="6" x2="12" y2="18" />
        </svg>
      </button>
    </div>
  );
}
