// Resolves the *effective* program for a user by merging their customization
// (customSlots + per-session slot overrides) over the built-in defaults, and
// provides pure mutation helpers the edit UI uses. Everything is immutable:
// helpers return a new AppState. The engine and data/program.ts are untouched.

import { SESSIONS_BY_ID, SLOTS_BY_ID } from "@/data/program";
import type { AppState, Slot, Unit } from "./types";

/** All slots available to a user: built-ins overlaid with their custom ones. */
export function resolveSlotsById(state: AppState): Record<string, Slot> {
  return { ...SLOTS_BY_ID, ...(state.customSlots ?? {}) };
}

export function resolveAllSlots(state: AppState): Slot[] {
  return Object.values(resolveSlotsById(state));
}

/** Look up one slot (custom takes precedence), or undefined if unknown. */
export function resolveSlot(state: AppState, slotId: string): Slot | undefined {
  return state.customSlots?.[slotId] ?? SLOTS_BY_ID[slotId];
}

/** The ordered slot ids for a session — the user's override, else the default. */
export function resolveSessionSlotIds(
  state: AppState,
  sessionId: string,
): string[] {
  return (
    state.sessionSlots?.[sessionId] ??
    SESSIONS_BY_ID[sessionId]?.slotIds ??
    []
  );
}

/** Resolved slots for a session, skipping any dangling ids. */
export function resolveSessionSlots(
  state: AppState,
  sessionId: string,
): Slot[] {
  return resolveSessionSlotIds(state, sessionId)
    .map((id) => resolveSlot(state, id))
    .filter((s): s is Slot => !!s);
}

// ---------------------------------------------------------------------------
// Mutations (pure — return a new AppState)
// ---------------------------------------------------------------------------

function ensureSlotState(state: AppState, slotId: string): AppState {
  if (state.slotStates[slotId]) return state;
  return {
    ...state,
    slotStates: {
      ...state.slotStates,
      [slotId]: { rungIndex: 0, lastSets: null },
    },
  };
}

function setSessionSlots(
  state: AppState,
  sessionId: string,
  slotIds: string[],
): AppState {
  return {
    ...state,
    sessionSlots: { ...state.sessionSlots, [sessionId]: slotIds },
  };
}

export function addSlotToSession(
  state: AppState,
  sessionId: string,
  slotId: string,
): AppState {
  const ids = resolveSessionSlotIds(state, sessionId);
  if (ids.includes(slotId)) return state;
  return setSessionSlots(
    ensureSlotState(state, slotId),
    sessionId,
    [...ids, slotId],
  );
}

export function removeSlotFromSession(
  state: AppState,
  sessionId: string,
  slotId: string,
): AppState {
  const ids = resolveSessionSlotIds(state, sessionId);
  return setSessionSlots(
    state,
    sessionId,
    ids.filter((id) => id !== slotId),
  );
}

/** Move a slot up (-1) or down (+1) within a session. */
export function moveSlotInSession(
  state: AppState,
  sessionId: string,
  index: number,
  direction: -1 | 1,
): AppState {
  const ids = [...resolveSessionSlotIds(state, sessionId)];
  const target = index + direction;
  if (index < 0 || index >= ids.length || target < 0 || target >= ids.length) {
    return state;
  }
  [ids[index], ids[target]] = [ids[target], ids[index]];
  return setSessionSlots(state, sessionId, ids);
}

export interface NewExerciseInput {
  name: string;
  pattern?: string;
  unit: Unit;
  perSide: boolean;
  sets: number;
  range: [number, number];
  cues: string[];
  searchTerm?: string;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

/**
 * Create a custom exercise (a single-rung slot) and add it to a session. The
 * id is unique-ish via a base36 suffix so re-using a name never collides.
 */
export function createCustomExercise(
  state: AppState,
  sessionId: string,
  input: NewExerciseInput,
): { state: AppState; slotId: string } {
  const name = input.name.trim();
  const min = Math.max(0, Math.min(input.range[0], input.range[1]));
  const max = Math.max(input.range[0], input.range[1]);
  const id = `custom_${slugify(name) || "exercise"}_${Date.now().toString(36)}`;

  const slot: Slot = {
    id,
    pattern: input.pattern?.trim() || name,
    sets: Math.max(1, Math.round(input.sets)),
    unit: input.unit,
    range: [min, max],
    perSide: input.perSide,
    ladder: [
      {
        name,
        cues: input.cues.map((c) => c.trim()).filter(Boolean),
        searchTerm: (input.searchTerm?.trim() || name).toLowerCase(),
      },
    ],
  };

  const withSlot: AppState = {
    ...state,
    customSlots: { ...state.customSlots, [id]: slot },
    slotStates: {
      ...state.slotStates,
      [id]: { rungIndex: 0, lastSets: null },
    },
  };
  return { state: addSlotToSession(withSlot, sessionId, id), slotId: id };
}
