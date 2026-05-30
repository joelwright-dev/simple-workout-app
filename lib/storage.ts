// Pure state helpers. v2 persistence lives in the database (see lib/db.ts +
// lib/actions.ts); this module keeps the framework-agnostic helpers: seeding a
// fresh program, reconciling a loaded/imported blob against the current program,
// and (de)serializing for backup export/import.

import type { AppState, Slot, Unit } from "./types";
import { SLOTS, SLOTS_BY_ID } from "@/data/program";

const LEGACY_KEY = "groundwork.state.v1";

/** Validate a stored custom slot, returning a cleaned Slot or null if invalid. */
function sanitizeCustomSlot(raw: unknown, id: string): Slot | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  const ladder = Array.isArray(s.ladder) ? s.ladder : [];
  const rungs = ladder
    .map((r) => {
      if (!r || typeof r !== "object") return null;
      const rr = r as Record<string, unknown>;
      if (typeof rr.name !== "string" || !rr.name) return null;
      return {
        name: rr.name,
        cues: Array.isArray(rr.cues)
          ? rr.cues.filter((c): c is string => typeof c === "string")
          : [],
        searchTerm:
          typeof rr.searchTerm === "string" && rr.searchTerm
            ? rr.searchTerm
            : rr.name.toLowerCase(),
      };
    })
    .filter((r): r is Slot["ladder"][number] => r !== null);
  if (rungs.length === 0) return null;

  const range = Array.isArray(s.range) ? s.range : [];
  const min = typeof range[0] === "number" ? range[0] : 5;
  const max = typeof range[1] === "number" ? range[1] : 12;
  const unit: Unit = s.unit === "seconds" ? "seconds" : "reps";

  return {
    id,
    pattern: typeof s.pattern === "string" && s.pattern ? s.pattern : rungs[0].name,
    sets: typeof s.sets === "number" && s.sets > 0 ? Math.round(s.sets) : 3,
    unit,
    range: [Math.min(min, max), Math.max(min, max)],
    perSide: s.perSide === true,
    ladder: rungs,
  };
}

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

  // 1. Sanitize the user's custom exercises.
  const customSlots: Record<string, Slot> = {};
  if (parsed.customSlots && typeof parsed.customSlots === "object") {
    for (const [id, raw] of Object.entries(parsed.customSlots)) {
      const slot = sanitizeCustomSlot(raw, id);
      if (slot) customSlots[id] = slot;
    }
  }

  // 2. The effective set of known slots (built-ins + valid custom ones).
  const slotsById: Record<string, Slot> = { ...SLOTS_BY_ID, ...customSlots };

  // 3. Reconcile slot states for every known slot, clamping rung indices.
  const slotStates = { ...base.slotStates };
  for (const slot of [...SLOTS, ...Object.values(customSlots)]) {
    const incoming = parsed.slotStates?.[slot.id];
    const maxRung = slot.ladder.length - 1;
    slotStates[slot.id] = {
      rungIndex:
        incoming && typeof incoming.rungIndex === "number"
          ? Math.max(0, Math.min(incoming.rungIndex, maxRung))
          : 0,
      lastSets:
        incoming && Array.isArray(incoming.lastSets) ? incoming.lastSets : null,
    };
  }

  // 4. Session overrides: keep only ids that resolve to a known slot.
  let sessionSlots: Record<string, string[]> | undefined;
  if (parsed.sessionSlots && typeof parsed.sessionSlots === "object") {
    sessionSlots = {};
    for (const [sessionId, ids] of Object.entries(parsed.sessionSlots)) {
      if (Array.isArray(ids)) {
        sessionSlots[sessionId] = ids.filter(
          (id) => typeof id === "string" && slotsById[id],
        );
      }
    }
  }

  return {
    rotationIndex:
      typeof parsed.rotationIndex === "number" ? parsed.rotationIndex : 0,
    slotStates,
    logs: Array.isArray(parsed.logs) ? parsed.logs : [],
    ...(Object.keys(customSlots).length > 0 ? { customSlots } : {}),
    ...(sessionSlots ? { sessionSlots } : {}),
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
