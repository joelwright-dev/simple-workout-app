// Pure state helpers. v2 persistence lives in the database (see lib/db.ts +
// lib/actions.ts); this module keeps the framework-agnostic helpers: seeding a
// fresh program, reconciling a loaded/imported blob against the current program,
// and (de)serializing for backup export/import.

import type { AppState } from "./types";
import { SLOTS } from "@/data/program";

const LEGACY_KEY = "groundwork.state.v1";

/** A fresh program: every slot at rung 0, empty history. */
export function initialState(): AppState {
  const slotStates: AppState["slotStates"] = {};
  for (const slot of SLOTS) {
    slotStates[slot.id] = { rungIndex: 0, lastSets: null };
  }
  return { rotationIndex: 0, slotStates, logs: [] };
}

/** Merge a (possibly partial / outdated) state onto the current program. */
export function reconcile(parsed: Partial<AppState> | null | undefined): AppState {
  const base = initialState();
  if (!parsed || typeof parsed !== "object") return base;

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

/** Pretty JSON for backup download. */
export function serializeState(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

/** Parse + reconcile an imported backup. Throws on malformed input. */
export function parseImport(str: string): AppState {
  const parsed = JSON.parse(str);
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Invalid backup: expected a JSON object.");
  }
  return reconcile(parsed as Partial<AppState>);
}

/**
 * Read any state left in this browser by the v1 (localStorage-only) build, for a
 * one-time migration into the account. Returns null if none or unavailable.
 */
export function readLegacyLocalState(): AppState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    return reconcile(JSON.parse(raw) as Partial<AppState>);
  } catch {
    return null;
  }
}

export function clearLegacyLocalState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}
