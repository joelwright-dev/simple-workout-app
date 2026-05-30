import { describe, it, expect } from "vitest";
import { initialState } from "./storage";
import {
  addSlotToSession,
  createCustomExercise,
  moveSlotInSession,
  removeSlotFromSession,
  resolveSessionSlotIds,
  resolveSlot,
} from "./program";

describe("session customization", () => {
  it("returns default session contents when not overridden", () => {
    const s = initialState();
    expect(resolveSessionSlotIds(s, "A")).toEqual([
      "bwsquat",
      "pushup",
      "squat",
      "hpush",
      "hpull",
      "hinge",
      "coreA",
    ]);
  });

  it("adds an existing library slot to a session without duplicating", () => {
    let s = initialState();
    s = addSlotToSession(s, "A", "vpush");
    expect(resolveSessionSlotIds(s, "A")).toContain("vpush");
    const before = resolveSessionSlotIds(s, "A").length;
    s = addSlotToSession(s, "A", "vpush"); // no-op
    expect(resolveSessionSlotIds(s, "A").length).toBe(before);
  });

  it("removes a slot from a session (leaving its state intact)", () => {
    let s = initialState();
    s = removeSlotFromSession(s, "A", "squat");
    expect(resolveSessionSlotIds(s, "A")).not.toContain("squat");
    expect(s.slotStates.squat).toBeTruthy(); // history/state preserved
  });

  it("reorders slots within a session and clamps at the ends", () => {
    let s = initialState();
    s = moveSlotInSession(s, "A", 0, 1); // bwsquat <-> pushup
    expect(resolveSessionSlotIds(s, "A").slice(0, 2)).toEqual([
      "pushup",
      "bwsquat",
    ]);
    const snapshot = resolveSessionSlotIds(s, "A");
    s = moveSlotInSession(s, "A", 0, -1); // can't move first up
    expect(resolveSessionSlotIds(s, "A")).toEqual(snapshot);
  });
});

describe("createCustomExercise", () => {
  it("creates a single-rung slot, seeds its state, and adds it to the session", () => {
    const { state, slotId } = createCustomExercise(initialState(), "B", {
      name: "Walking lunge",
      unit: "reps",
      perSide: true,
      sets: 3,
      range: [6, 10],
      cues: ["Step forward", "  ", "Torso tall"],
    });

    const slot = resolveSlot(state, slotId);
    expect(slot).toBeTruthy();
    expect(slot!.ladder).toHaveLength(1);
    expect(slot!.ladder[0].name).toBe("Walking lunge");
    expect(slot!.ladder[0].cues).toEqual(["Step forward", "Torso tall"]); // blanks dropped
    expect(slot!.perSide).toBe(true);
    expect(slot!.range).toEqual([6, 10]);
    expect(state.slotStates[slotId]).toEqual({ rungIndex: 0, lastSets: null });
    expect(resolveSessionSlotIds(state, "B")).toContain(slotId);
  });

  it("normalizes an inverted range", () => {
    const { state, slotId } = createCustomExercise(initialState(), "A", {
      name: "Plank",
      unit: "seconds",
      perSide: false,
      sets: 3,
      range: [45, 20],
      cues: [],
    });
    expect(resolveSlot(state, slotId)!.range).toEqual([20, 45]);
  });
});
