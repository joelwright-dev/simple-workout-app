// The progression engine — pure, unit-tested functions.
//
// Each strength slot climbs its own ladder of variations using DOUBLE
// PROGRESSION: push reps within a target range, and when every working set
// pins the top of the range, become eligible to advance to a harder rung
// (which resets the rep target to the bottom of the range). Nothing advances
// or regresses automatically — the engine only *detects eligibility* and the
// UI surfaces a confirm/decline prompt, because "clean form" is the user's
// judgement call.

import type {
  AppState,
  LoggedSlot,
  SessionLog,
  Slot,
  SlotState,
} from "./types";

export function bottomOfRange(slot: Slot): number {
  return slot.range[0];
}

export function topOfRange(slot: Slot): number {
  return slot.range[1];
}

/** Highest valid rung index for a slot. */
export function maxRungIndex(slot: Slot): number {
  return slot.ladder.length - 1;
}

/** True if the given rung is the hardest variation available. */
export function isTopOfLadder(slot: Slot, rungIndex: number): boolean {
  return rungIndex >= maxRungIndex(slot);
}

/** Clamp a rung index into the valid [0, maxRungIndex] window. */
export function clampRung(slot: Slot, rungIndex: number): number {
  return Math.max(0, Math.min(rungIndex, maxRungIndex(slot)));
}

/**
 * ADVANCE condition (per-session): every one of the slot's working sets hit
 * the TOP of the rep/second range. Requires a full set of logged values.
 */
export function hitTopAllSets(slot: Slot, sets: number[]): boolean {
  if (sets.length < slot.sets) return false;
  const top = topOfRange(slot);
  // Consider exactly the working sets (ignore any trailing extras).
  return sets.slice(0, slot.sets).every((reps) => reps >= top);
}

/**
 * REGRESS condition (per-session): the FIRST working set came in BELOW the
 * bottom of the range — a sign the rung is currently too hard.
 */
export function setOneBelowBottom(slot: Slot, sets: number[]): boolean {
  if (sets.length === 0) return false;
  return sets[0] < bottomOfRange(slot);
}

/**
 * Logged history for one slot across all sessions, oldest first. A slot that
 * appears in multiple sessions (e.g. horizontal pull) shares one timeline.
 */
export function slotLoggedHistory(
  logs: SessionLog[],
  slotId: string,
): LoggedSlot[] {
  const out: LoggedSlot[] = [];
  for (const log of logs) {
    for (const ls of log.slots) {
      if (ls.slotId === slotId) out.push(ls);
    }
  }
  return out;
}

export type Suggestion =
  | {
      type: "advance";
      slotId: string;
      fromRung: number;
      toRung: number;
      fromName: string;
      toName: string;
    }
  | {
      type: "regress";
      slotId: string;
      fromRung: number;
      toRung: number;
      fromName: string;
      toName: string;
    }
  | {
      // At the hardest rung and pinning the top — nothing harder to give.
      type: "top";
      slotId: string;
      rung: number;
      name: string;
    }
  | null;

/**
 * Evaluate a single slot after a session has been logged. `history` is the
 * slot's full logged history (oldest first) INCLUDING the session just logged.
 *
 * - Advance: the most recent session at the current rung hit the top on every
 *   set. If already at the top of the ladder, returns a "top" note instead.
 * - Regress: the two most recent sessions at the current rung both had set 1
 *   below the bottom of the range. Needs two consecutive — one bad day alone
 *   never suggests dropping back.
 */
export function evaluateSlot(
  slot: Slot,
  slotState: SlotState,
  history: LoggedSlot[],
): Suggestion {
  const rungIndex = slotState.rungIndex;
  // Only sessions performed at the current rung are relevant; a rung change
  // resets the comparison so old data from another variation never leaks in.
  const atRung = history.filter((h) => h.rungIndex === rungIndex);
  if (atRung.length === 0) return null;

  const mostRecent = atRung[atRung.length - 1];

  // --- Advance / top-of-ladder ---
  if (hitTopAllSets(slot, mostRecent.sets)) {
    if (isTopOfLadder(slot, rungIndex)) {
      return {
        type: "top",
        slotId: slot.id,
        rung: rungIndex,
        name: slot.ladder[rungIndex].name,
      };
    }
    const toRung = rungIndex + 1;
    return {
      type: "advance",
      slotId: slot.id,
      fromRung: rungIndex,
      toRung,
      fromName: slot.ladder[rungIndex].name,
      toName: slot.ladder[toRung].name,
    };
  }

  // --- Regress (needs two consecutive sub-bottom sessions, not at floor) ---
  if (rungIndex > 0 && atRung.length >= 2) {
    const prev = atRung[atRung.length - 2];
    if (
      setOneBelowBottom(slot, mostRecent.sets) &&
      setOneBelowBottom(slot, prev.sets)
    ) {
      const toRung = rungIndex - 1;
      return {
        type: "regress",
        slotId: slot.id,
        fromRung: rungIndex,
        toRung,
        fromName: slot.ladder[rungIndex].name,
        toName: slot.ladder[toRung].name,
      };
    }
  }

  return null;
}

/**
 * Apply an accepted advance: bump the rung (clamped) and reset the rep bar by
 * clearing lastSets — the UI then defaults the steppers to the bottom of the
 * new rung's range.
 */
export function applyAdvance(slot: Slot, slotState: SlotState): SlotState {
  return {
    rungIndex: clampRung(slot, slotState.rungIndex + 1),
    lastSets: null,
  };
}

/** Apply an accepted regress: step the rung down (floor 0), reset the bar. */
export function applyRegress(slot: Slot, slotState: SlotState): SlotState {
  return {
    rungIndex: clampRung(slot, slotState.rungIndex - 1),
    lastSets: null,
  };
}

/**
 * Record a completed session into app state (immutably):
 * - append the SessionLog,
 * - update each logged slot's lastSets to the numbers just achieved,
 * - advance the A/B rotation index (RECOVERY sessions never affect rotation).
 *
 * Progression prompts are evaluated separately (see evaluateSlot) against the
 * returned state's logs so the just-logged session is included.
 */
export function recordSession(
  state: AppState,
  sessionId: string,
  loggedSlots: LoggedSlot[],
  dateISO: string,
): AppState {
  const log: SessionLog = { dateISO, sessionId, slots: loggedSlots };

  const slotStates: Record<string, SlotState> = { ...state.slotStates };
  for (const ls of loggedSlots) {
    const prev = slotStates[ls.slotId] ?? { rungIndex: ls.rungIndex, lastSets: null };
    slotStates[ls.slotId] = { ...prev, lastSets: ls.sets };
  }

  const isRotating = sessionId === "A" || sessionId === "B";

  return {
    ...state,
    rotationIndex: isRotating ? state.rotationIndex + 1 : state.rotationIndex,
    slotStates,
    logs: [...state.logs, log],
  };
}

/** Which A/B session is currently due, from the rotation index. */
export function currentRotationSessionId(rotationIndex: number): "A" | "B" {
  return rotationIndex % 2 === 0 ? "A" : "B";
}
