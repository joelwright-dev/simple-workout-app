"use client";

import type { Suggestion } from "@/lib/engine";
import { SLOTS_BY_ID } from "@/data/program";

export type Decision = "accepted" | "declined";

/**
 * End-of-session review. Renders advance/regress prompts as accept/decline
 * cards, and top-of-ladder notes. Advancing/regressing always requires an
 * explicit tap — "clean form" is the user's call.
 */
export function SessionReview({
  suggestions,
  decisions,
  onDecide,
  onFinish,
}: {
  suggestions: Suggestion[];
  decisions: Record<string, Decision>;
  onDecide: (slotId: string, decision: Decision) => void;
  onFinish: () => void;
}) {
  const actionable = suggestions.filter(
    (s): s is Extract<Suggestion, { type: "advance" | "regress" }> =>
      s !== null && (s.type === "advance" || s.type === "regress"),
  );
  const topNotes = suggestions.filter(
    (s): s is Extract<Suggestion, { type: "top" }> =>
      s !== null && s.type === "top",
  );

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-6">
      <header>
        <h1 className="text-2xl font-extrabold text-ground-900">Nice work.</h1>
        <p className="mt-1 text-ground-600">
          {actionable.length > 0
            ? "A couple of slots are ready for a change — your call."
            : "Session logged. Keep pushing those reps."}
        </p>
      </header>

      {actionable.map((s) => {
        const slot = SLOTS_BY_ID[s.slotId];
        const decision = decisions[s.slotId];
        const isAdvance = s.type === "advance";
        return (
          <div
            key={s.slotId}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ground-100"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-clay-600">
              {slot.pattern}
            </p>
            <p className="mt-1 font-semibold text-ground-900">
              {isAdvance ? (
                <>
                  Ready to level up to <strong>{s.toName}</strong>?
                </>
              ) : (
                <>
                  {s.fromName} feeling tough — drop back to{" "}
                  <strong>{s.toName}</strong>?
                </>
              )}
            </p>
            <p className="mt-1 text-sm text-ground-500">
              {isAdvance
                ? "Only if your form stayed clean at the top of the range."
                : "No shame in it — strength comes back faster the second time."}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onDecide(s.slotId, "accepted")}
                className={`rounded-xl px-4 py-3 font-bold active:scale-[0.99] ${
                  decision === "accepted"
                    ? "bg-clay-500 text-white"
                    : "bg-ground-100 text-ground-700"
                }`}
              >
                {isAdvance ? "Level up" : "Drop back"}
              </button>
              <button
                type="button"
                onClick={() => onDecide(s.slotId, "declined")}
                className={`rounded-xl px-4 py-3 font-bold active:scale-[0.99] ${
                  decision === "declined"
                    ? "bg-ground-700 text-white"
                    : "bg-ground-100 text-ground-700"
                }`}
              >
                {isAdvance ? "Not yet" : "Stay here"}
              </button>
            </div>
          </div>
        );
      })}

      {topNotes.map((s) => {
        const slot = SLOTS_BY_ID[s.slotId];
        return (
          <div
            key={s.slotId}
            className="rounded-2xl bg-ground-100 p-4 text-ground-700"
          >
            <p className="font-semibold">
              {slot.pattern}: top of the ladder 🏔️
            </p>
            <p className="mt-1 text-sm">
              You&apos;ve maxed out <strong>{s.name}</strong>. No harder rung —
              keep growing by adding reps or slowing the tempo.
            </p>
          </div>
        );
      })}

      <button
        type="button"
        onClick={onFinish}
        className="mt-auto rounded-xl bg-clay-500 px-4 py-4 text-lg font-bold text-white shadow active:scale-[0.99] active:bg-clay-600"
      >
        Done
      </button>
    </div>
  );
}
