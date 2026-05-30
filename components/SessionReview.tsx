"use client";

import type { Suggestion } from "@/lib/engine";
import type { Slot } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export type Decision = "accepted" | "declined";

/**
 * End-of-session review. Renders advance/regress prompts as accept/decline
 * cards and top-of-ladder notes. Advancing/regressing always requires an
 * explicit tap — "clean form" is the user's call.
 */
export function SessionReview({
  suggestions,
  decisions,
  slotsById,
  saving = false,
  saveError = false,
  onDecide,
  onFinish,
}: {
  suggestions: Suggestion[];
  decisions: Record<string, Decision>;
  slotsById: Record<string, Slot>;
  saving?: boolean;
  saveError?: boolean;
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
    <div className="flex flex-1 flex-col gap-4 px-4 py-8">
      <header className="px-1">
        <span className="text-4xl">🎉</span>
        <h1 className="mt-2 text-2xl font-extrabold text-ink">Session logged.</h1>
        <p className="mt-1 text-ink-muted">
          {actionable.length > 0
            ? "A few slots are ready for a change — your call."
            : "Nice work. Keep chasing those reps."}
        </p>
      </header>

      {actionable.map((s) => {
        const slot = slotsById[s.slotId];
        const decision = decisions[s.slotId];
        const isAdvance = s.type === "advance";
        return (
          <div
            key={s.slotId}
            className="rounded-4xl bg-surface p-5 shadow-soft ring-1 ring-line/70"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-accent-ink">
              {slot.pattern}
            </p>
            <p className="mt-1.5 text-lg font-bold text-ink">
              {isAdvance ? (
                <>
                  Level up to <span className="text-accent-ink">{s.toName}</span>?
                </>
              ) : (
                <>
                  Drop back to <span className="text-accent-ink">{s.toName}</span>?
                </>
              )}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              {isAdvance
                ? "Only if your form stayed clean at the top of the range."
                : `${s.fromName} felt tough two sessions running — no shame in it.`}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                variant={decision === "accepted" ? "accent" : "soft"}
                onClick={() => onDecide(s.slotId, "accepted")}
              >
                {isAdvance ? "Level up" : "Drop back"}
              </Button>
              <Button
                variant={decision === "declined" ? "primary" : "soft"}
                onClick={() => onDecide(s.slotId, "declined")}
              >
                {isAdvance ? "Not yet" : "Stay here"}
              </Button>
            </div>
          </div>
        );
      })}

      {topNotes.map((s) => {
        const slot = slotsById[s.slotId];
        return (
          <div
            key={s.slotId}
            className="rounded-4xl bg-accent-soft p-5 text-accent-ink"
          >
            <p className="font-bold">{slot.pattern}: top of the ladder 🏔️</p>
            <p className="mt-1 text-sm">
              You&apos;ve maxed out <strong>{s.name}</strong>. No harder rung —
              grow by adding reps or slowing the tempo.
            </p>
          </div>
        );
      })}

      <div className="mt-auto">
        {saveError && (
          <p className="mb-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t save your session. Check your connection and try again.
          </p>
        )}
        <Button onClick={onFinish} disabled={saving} className="w-full">
          {saving ? "Saving…" : "Done"}
        </Button>
      </div>
    </div>
  );
}
