import type { Slot } from "./types";

/** "reps" or "sec" short label for a slot's unit. */
export function unitLabel(slot: Slot): string {
  return slot.unit === "seconds" ? "sec" : "reps";
}

/** e.g. "5–12 reps" or "20–45 sec/side". */
export function rangeLabel(slot: Slot): string {
  const suffix = slot.perSide ? `${unitLabel(slot)}/side` : unitLabel(slot);
  return `${slot.range[0]}–${slot.range[1]} ${suffix}`;
}

/** Current rung name for a slot at the given index. */
export function rungName(slot: Slot, rungIndex: number): string {
  return slot.ladder[rungIndex]?.name ?? slot.ladder[0].name;
}

/** "rung 3/7" style progress label (1-based for humans). */
export function rungProgress(slot: Slot, rungIndex: number): string {
  return `${rungIndex + 1}/${slot.ladder.length}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
