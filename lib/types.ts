// Core data model for the Groundwork progression engine.
// See README for how slots / ladders / double-progression fit together.

export type Unit = "reps" | "seconds";

export interface Rung {
  name: string;
  cues: string[]; // 2–3 short form cues
  searchTerm: string; // canonical name for media matching + fallback link
}

export interface Slot {
  id: string;
  pattern: string; // e.g. "Horizontal pull"
  sets: number; // 3
  unit: Unit; // 'reps' | 'seconds'
  range: [number, number];
  perSide: boolean; // true => reps/secs are per side
  ladder: Rung[]; // ordered easiest -> hardest
}

export type SessionId = "A" | "B" | "RECOVERY";

export interface SessionDef {
  id: SessionId;
  name: string;
  slotIds: string[];
}

export interface SlotState {
  rungIndex: number;
  lastSets: number[] | null;
}

export interface LoggedSlot {
  slotId: string;
  rungIndex: number;
  sets: number[];
}

export interface SessionLog {
  dateISO: string;
  sessionId: string;
  slots: LoggedSlot[];
}

export interface AppState {
  rotationIndex: number; // position in the A/B rotation
  slotStates: Record<string, SlotState>; // keyed by slot id
  logs: SessionLog[];

  // ---- Per-user customization (optional; defaults used when absent) ----
  // Exercises the user created. Merged over the built-in program by id.
  customSlots?: Record<string, Slot>;
  // Per-session ordered slot id lists that OVERRIDE the built-in session
  // (keyed by "A" / "B"). Absent => use the default session contents.
  sessionSlots?: Record<string, string[]>;
}

// ---- Media resolution shapes (data/media.json) ----

export interface MediaImages {
  // Resolved image URLs (start / finish frames). Optional finish frame.
  start: string;
  finish?: string;
  name?: string; // matched exercise name, for reference/editing
}

export interface MediaFallback {
  fallback: string; // e.g. a YouTube search URL
}

export type MediaEntry = MediaImages | MediaFallback;

export type MediaMap = Record<string, MediaEntry>;

export function isFallback(entry: MediaEntry | undefined): entry is MediaFallback {
  return !!entry && "fallback" in entry;
}
