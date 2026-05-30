"use client";

import type { Slot } from "@/lib/types";
import { ExerciseMedia } from "./ExerciseMedia";
import { Stepper } from "./Stepper";
import { rangeLabel, rungName, rungProgress, unitLabel } from "@/lib/format";

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
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ground-100">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-clay-600">
            {slot.pattern}
          </p>
          <h3 className="text-lg font-bold text-ground-900">{rung.name}</h3>
        </div>
        <span className="shrink-0 rounded-full bg-ground-100 px-2.5 py-1 text-xs font-bold text-ground-600">
          {rungProgress(slot, rungIndex)}
        </span>
      </div>

      <div className="mt-3">
        <ExerciseMedia searchTerm={rung.searchTerm} />
      </div>

      <ul className="mt-3 flex flex-col gap-1">
        {rung.cues.map((cue) => (
          <li key={cue} className="flex gap-2 text-sm text-ground-700">
            <span className="text-clay-500">•</span>
            <span>{cue}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
        <span className="font-semibold text-ground-700">
          Target: {rangeLabel(slot)}
        </span>
        <span className="text-ground-500">
          {lastSets
            ? `Last: ${lastSets.join(", ")}`
            : "First time on this rung"}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {sets.map((value, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl bg-ground-50 py-2 pl-4 pr-2"
          >
            <span className="text-sm font-semibold text-ground-600">
              Set {i + 1}
              <span className="ml-1 font-normal text-ground-400">
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
