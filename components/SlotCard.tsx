"use client";

import type { Slot } from "@/lib/types";
import { ExerciseMedia } from "./ExerciseMedia";
import { Stepper } from "./Stepper";
import { rangeLabel, rungProgress, unitLabel } from "@/lib/format";

/**
 * One slot's logging card: media toggle, cues, target, last-time bar, and a
 * +/- stepper per working set.
 */
export function SlotCard({
  slot,
  rungIndex,
  sets,
  lastSets,
  onChangeSet,
}: {
  slot: Slot;
  rungIndex: number;
  sets: number[];
  lastSets: number[] | null;
  onChangeSet: (setIndex: number, value: number) => void;
}) {
  const rung = slot.ladder[rungIndex];

  return (
    <article className="rounded-4xl bg-surface p-4 shadow-soft ring-1 ring-line/70">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-ink">
            {slot.pattern}
          </p>
          <h3 className="text-lg font-extrabold text-ink">{rung.name}</h3>
        </div>
        <span className="shrink-0 rounded-full bg-paper px-2.5 py-1 text-xs font-bold text-ink-muted ring-1 ring-line">
          {rungProgress(slot, rungIndex)}
        </span>
      </div>

      <div className="mt-3 overflow-hidden rounded-3xl">
        <ExerciseMedia searchTerm={rung.searchTerm} />
      </div>

      <ul className="mt-3 flex flex-col gap-1">
        {rung.cues.map((cue) => (
          <li key={cue} className="flex gap-2 text-sm text-ink-soft">
            <span className="text-accent">•</span>
            <span>{cue}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
        <span className="font-semibold text-ink-soft">
          Target {rangeLabel(slot)}
        </span>
        <span className="text-ink-muted">
          {lastSets ? `Last: ${lastSets.join(", ")}` : "First time on this rung"}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {sets.map((value, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-2xl bg-paper py-2 pl-4 pr-2"
          >
            <span className="text-sm font-semibold text-ink-soft">
              Set {i + 1}
              <span className="ml-1 font-normal text-ink-faint">
                ({unitLabel(slot)}
                {slot.perSide ? "/side" : ""})
              </span>
            </span>
            <Stepper
              value={value}
              min={0}
              max={slot.unit === "seconds" ? 600 : 100}
              onChange={(v) => onChangeSet(i, v)}
            />
          </div>
        ))}
      </div>
    </article>
  );
}
