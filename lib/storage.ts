// The ONLY place app state touches a persistence backend. v1 uses
// localStorage; to move to Vercel KV / Postgres / Turso later, reimplement
// getState/saveState here (and make them async if needed) — nothing else in the
// app reads localStorage directly.

import type { AppState } from "./types";
import { SLOTS } from "@/data/program";

const STORAGE_KEY = "groundwork.state.v1";

/** A fresh program: every slot at rung 0, empty history. */
export function initialState(): AppState {
  const slotStates: AppState["slotStates"] = {};
  for (const slot of SLOTS) {
    slotStates[slot.id] = { rungIndex: 0, lastSets: null };
  }
  return { rotationIndex: 0, slotStates, logs: [] };
}

/**
 * Load state, repairing/seeding any missing slots (e.g. after a new rung group
 * is added to the program). Always returns a usable AppState.
 */
export function getState(): AppState {
  if (typeof window === "undefined") return initialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return reconcile(parsed);
  } catch {
    return initialState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Serialize current state to a pretty JSON string for backup/export. */
export function exportJSON(): string {
  return JSON.stringify(getState(), null, 2);
}

/**
 * Parse and persist an imported backup. Throws on malformed input so the UI can
 * surface an error. Reconciles against the current program before saving.
 */
export function importJSON(str: string): AppState {
  const parsed = JSON.parse(str) as Partial<AppState>;
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Invalid backup: expected a JSON object.");
  }
  const state = reconcile(parsed);
  saveState(state);
  return state;
}

/** Merge a (possibly partial / outdated) state onto the current program. */
function reconcile(parsed: Partial<AppState>): AppState {
  const base = initialState();
  const slotStates = { ...base.slotStates };
  if (parsed.slotStates) {
    for (const slot of SLOTS) {
      const incoming = parsed.slotStates[slot.id];
      if (incoming && typeof incoming.rungIndex === "number") {
        const maxRung = slot.ladder.length - 1;
        slotStates[slot.id] = {
          rungIndex: Math.max(0, Math.min(incoming.rungIndex, maxRung)),
          lastSets: Array.isArray(incoming.lastSets) ? incoming.lastSets : null,
        };
      }
    }
  }
  return {
    rotationIndex:
      typeof parsed.rotationIndex === "number" ? parsed.rotationIndex : 0,
    slotStates,
    logs: Array.isArray(parsed.logs) ? parsed.logs : [],
  };
}
