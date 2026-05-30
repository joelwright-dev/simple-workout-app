import { describe, it, expect } from "vitest";
import type { LoggedSlot, SessionLog, Slot, SlotState } from "./types";
import {
  applyAdvance,
  applyRegress,
  clampRung,
  currentRotationSessionId,
  evaluateSlot,
  hitTopAllSets,
  isTopOfLadder,
  recordSession,
  setOneBelowBottom,
  slotLoggedHistory,
} from "./engine";

// A minimal 3-rung slot with range [5, 12], 3 sets.
const slot: Slot = {
  id: "test",
  pattern: "Test pattern",
  sets: 3,
  unit: "reps",
  range: [5, 12],
  perSide: false,
  ladder: [
    { name: "Easy", cues: [], searchTerm: "easy" },
    { name: "Medium", cues: [], searchTerm: "medium" },
    { name: "Hard", cues: [], searchTerm: "hard" },
  ],
};

function state(rungIndex: number, lastSets: number[] | null = null): SlotState {
  return { rungIndex, lastSets };
}

function session(slotId: string, rungIndex: number, sets: number[]): SessionLog {
  return {
    dateISO: "2026-01-01",
    sessionId: "A",
    slots: [{ slotId, rungIndex, sets }],
  };
}

describe("hitTopAllSets", () => {
  it("is true only when every working set pins the top of the range", () => {
    expect(hitTopAllSets(slot, [12, 12, 12])).toBe(true);
    expect(hitTopAllSets(slot, [12, 12, 11])).toBe(false);
    expect(hitTopAllSets(slot, [13, 12, 12])).toBe(true); // above top still counts
  });

  it("requires a full set of logged values", () => {
    expect(hitTopAllSets(slot, [12, 12])).toBe(false);
  });
});

describe("setOneBelowBottom", () => {
  it("looks at the first set against the bottom of the range", () => {
    expect(setOneBelowBottom(slot, [4, 10, 10])).toBe(true);
    expect(setOneBelowBottom(slot, [5, 1, 1])).toBe(false); // set 1 at bottom is ok
  });
});

describe("clampRung / isTopOfLadder", () => {
  it("clamps to the valid window", () => {
    expect(clampRung(slot, -3)).toBe(0);
    expect(clampRung(slot, 99)).toBe(2);
    expect(clampRung(slot, 1)).toBe(1);
  });

  it("detects the top of the ladder", () => {
    expect(isTopOfLadder(slot, 2)).toBe(true);
    expect(isTopOfLadder(slot, 1)).toBe(false);
  });
});

describe("evaluateSlot — advance", () => {
  it("flags advance when the most recent session hit the top on every set", () => {
    const history = slotLoggedHistory([session("test", 0, [12, 12, 12])], "test");
    const s = evaluateSlot(slot, state(0), history);
    expect(s).toMatchObject({
      type: "advance",
      fromRung: 0,
      toRung: 1,
      fromName: "Easy",
      toName: "Medium",
    });
  });

  it("does not flag advance when a set fell short", () => {
    const history = slotLoggedHistory([session("test", 0, [12, 12, 11])], "test");
    expect(evaluateSlot(slot, state(0), history)).toBeNull();
  });

  it("returns a top-of-ladder note instead of advance at the hardest rung", () => {
    const history = slotLoggedHistory([session("test", 2, [12, 12, 12])], "test");
    const s = evaluateSlot(slot, state(2), history);
    expect(s).toMatchObject({ type: "top", rung: 2 });
  });

  it("only considers sessions logged at the current rung", () => {
    // A maxed-out session at rung 0, then a fresh (incomplete) session at rung 1.
    const logs: SessionLog[] = [
      session("test", 0, [12, 12, 12]),
      session("test", 1, [6, 6, 6]),
    ];
    const history = slotLoggedHistory(logs, "test");
    expect(evaluateSlot(slot, state(1), history)).toBeNull();
  });
});

describe("evaluateSlot — regress", () => {
  it("needs TWO consecutive sub-bottom sessions to suggest regress", () => {
    const oneBad = slotLoggedHistory([session("test", 1, [3, 3, 3])], "test");
    expect(evaluateSlot(slot, state(1), oneBad)).toBeNull();

    const twoBad = slotLoggedHistory(
      [session("test", 1, [4, 6, 6]), session("test", 1, [3, 5, 5])],
      "test",
    );
    const s = evaluateSlot(slot, state(1), twoBad);
    expect(s).toMatchObject({
      type: "regress",
      fromRung: 1,
      toRung: 0,
      fromName: "Medium",
      toName: "Easy",
    });
  });

  it("never suggests regress below rung 0", () => {
    const twoBad = slotLoggedHistory(
      [session("test", 0, [3, 3, 3]), session("test", 0, [3, 3, 3])],
      "test",
    );
    expect(evaluateSlot(slot, state(0), twoBad)).toBeNull();
  });

  it("resets the regress streak after a rung change (only counts current rung)", () => {
    // Two bad sessions but at different rungs => not consecutive at current rung.
    const logs: SessionLog[] = [
      session("test", 2, [3, 5, 5]),
      session("test", 1, [3, 5, 5]),
    ];
    const history = slotLoggedHistory(logs, "test");
    expect(evaluateSlot(slot, state(1), history)).toBeNull();
  });
});

describe("applyAdvance / applyRegress — rung clamping & target reset", () => {
  it("advance bumps the rung and clears lastSets (rep bar resets to bottom)", () => {
    const next = applyAdvance(slot, state(0, [12, 12, 12]));
    expect(next).toEqual({ rungIndex: 1, lastSets: null });
  });

  it("advance cannot exceed the top of the ladder", () => {
    const next = applyAdvance(slot, state(2, [12, 12, 12]));
    expect(next.rungIndex).toBe(2);
  });

  it("regress steps down and clears lastSets", () => {
    const next = applyRegress(slot, state(1, [3, 3, 3]));
    expect(next).toEqual({ rungIndex: 0, lastSets: null });
  });

  it("regress cannot go below rung 0", () => {
    const next = applyRegress(slot, state(0, [3, 3, 3]));
    expect(next.rungIndex).toBe(0);
  });
});

describe("recordSession", () => {
  const base = {
    rotationIndex: 0,
    slotStates: { test: state(0) },
    logs: [] as SessionLog[],
  };

  it("appends the log and updates lastSets", () => {
    const logged: LoggedSlot[] = [{ slotId: "test", rungIndex: 0, sets: [8, 7, 6] }];
    const next = recordSession(base, "A", logged, "2026-01-02");
    expect(next.logs).toHaveLength(1);
    expect(next.slotStates.test.lastSets).toEqual([8, 7, 6]);
  });

  it("advances rotation for A/B sessions but not RECOVERY", () => {
    const logged: LoggedSlot[] = [{ slotId: "test", rungIndex: 0, sets: [8, 7, 6] }];
    expect(recordSession(base, "A", logged, "x").rotationIndex).toBe(1);
    expect(recordSession(base, "RECOVERY", logged, "x").rotationIndex).toBe(0);
  });

  it("does not mutate the input state", () => {
    const logged: LoggedSlot[] = [{ slotId: "test", rungIndex: 0, sets: [8, 7, 6] }];
    recordSession(base, "A", logged, "x");
    expect(base.logs).toHaveLength(0);
    expect(base.slotStates.test.lastSets).toBeNull();
  });
});

describe("currentRotationSessionId", () => {
  it("alternates A, B, A, B by rotation index", () => {
    expect(currentRotationSessionId(0)).toBe("A");
    expect(currentRotationSessionId(1)).toBe("B");
    expect(currentRotationSessionId(2)).toBe("A");
    expect(currentRotationSessionId(3)).toBe("B");
  });
});
