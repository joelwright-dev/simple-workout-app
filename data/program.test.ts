// Integration test against the REAL seed program — mirrors exactly what the
// session page does (recordSession -> evaluateSlot -> applyAdvance) to prove
// the definition-of-done flow end to end at the logic layer.

import { describe, it, expect } from "vitest";
import { SESSIONS_BY_ID, SLOTS_BY_ID } from "./program";
import {
  applyAdvance,
  currentRotationSessionId,
  evaluateSlot,
  recordSession,
  slotLoggedHistory,
  type Suggestion,
} from "@/lib/engine";
import { initialState } from "@/lib/storage";
import type { AppState, LoggedSlot } from "@/lib/types";

// Re-derive the helper the page uses to turn a fresh program + entered numbers
// into a committed state with progression applied.
function finishSession(
  state: AppState,
  sessionId: "A" | "B",
  entered: Record<string, number[]>,
  accept: (s: Extract<Suggestion, { type: "advance" | "regress" }>) => boolean,
): { state: AppState; suggestions: Suggestion[] } {
  const session = SESSIONS_BY_ID[sessionId];
  const loggedSlots: LoggedSlot[] = session.slotIds.map((slotId) => ({
    slotId,
    rungIndex: state.slotStates[slotId].rungIndex,
    sets: entered[slotId],
  }));

  const recorded = recordSession(state, sessionId, loggedSlots, "2026-01-01");

  const suggestions: Suggestion[] = session.slotIds.map((slotId) =>
    evaluateSlot(
      SLOTS_BY_ID[slotId],
      recorded.slotStates[slotId],
      slotLoggedHistory(recorded.logs, slotId),
    ),
  );

  const slotStates = { ...recorded.slotStates };
  for (const s of suggestions) {
    if (!s) continue;
    if (s.type === "advance" && accept(s)) {
      slotStates[s.slotId] = applyAdvance(SLOTS_BY_ID[s.slotId], slotStates[s.slotId]);
    }
  }
  return { state: { ...recorded, slotStates }, suggestions };
}

describe("Session A end-to-end (real program)", () => {
  it("starts everyone at rung 0 and serves Session A first", () => {
    const state = initialState();
    expect(currentRotationSessionId(state.rotationIndex)).toBe("A");
    for (const slotId of SESSIONS_BY_ID.A.slotIds) {
      expect(state.slotStates[slotId].rungIndex).toBe(0);
    }
  });

  it("logs 3×12 on squat, surfaces an advance prompt, and serves the next rung after accepting", () => {
    const state = initialState();

    // Hit the top of the range on squat (12,12,12); cruise everything else.
    const entered: Record<string, number[]> = {
      squat: [12, 12, 12],
      hpush: [8, 8, 8],
      hpull: [8, 8, 8],
      hinge: [8, 8, 8],
      coreA: [30, 30, 30],
    };

    const { state: after, suggestions } = finishSession(
      state,
      "A",
      entered,
      (s) => s.slotId === "squat", // accept only the squat level-up
    );

    const squatSugg = suggestions.find(
      (s) => s && s.type === "advance" && s.slotId === "squat",
    );
    expect(squatSugg).toMatchObject({
      type: "advance",
      fromName: "Assisted squat",
      toName: "Bodyweight squat",
    });

    // Squat moved up a rung; its rep bar reset.
    expect(after.slotStates.squat.rungIndex).toBe(1);
    expect(after.slotStates.squat.lastSets).toBeNull();
    expect(SLOTS_BY_ID.squat.ladder[after.slotStates.squat.rungIndex].name).toBe(
      "Bodyweight squat",
    );

    // Rotation advanced to Session B; non-maxed slots stayed put.
    expect(currentRotationSessionId(after.rotationIndex)).toBe("B");
    expect(after.slotStates.hpush.rungIndex).toBe(0);
  });

  it("shares horizontal-pull progress across Session A and B", () => {
    let state = initialState();

    // Session A: max out hpull.
    state = finishSession(
      state,
      "A",
      {
        squat: [8, 8, 8],
        hpush: [8, 8, 8],
        hpull: [12, 12, 12],
        hinge: [8, 8, 8],
        coreA: [30, 30, 30],
      },
      () => true,
    ).state;

    // hpull advanced to rung 1, and that state is visible to Session B too.
    expect(state.slotStates.hpull.rungIndex).toBe(1);
    expect(SESSIONS_BY_ID.B.slotIds).toContain("hpull");
  });
});
