// Media resolution: maps a rung's `searchTerm` to exercise imagery.
//
// Default source: free-exercise-db (public domain) via the jsDelivr CDN.
// At seed time, scripts/resolve-media.ts fuzzy-matches each searchTerm against
// the dataset and writes data/media.json (hand-editable). At runtime we just
// read that file through getMedia().
//
// These are STILLS (start/finish frames), not animated GIFs — the robust,
// key-free, rate-limit-free choice for a set-and-forget personal app.

import type { MediaEntry } from "./types";
import mediaJson from "@/data/media.json";

export const FREE_EXERCISE_DB_BASE =
  "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/";

const MEDIA = mediaJson as Record<string, MediaEntry>;

/**
 * Resolve media for a searchTerm. Returns either {start, finish?} image URLs or
 * {fallback} (a "Watch demo" link). If a term is missing from media.json we
 * synthesise a YouTube-search fallback so the UI always has something to show.
 */
export function getMedia(searchTerm: string): MediaEntry {
  const entry = MEDIA[searchTerm];
  if (entry) return entry;
  return { fallback: youtubeSearch(searchTerm) };
}

export function youtubeSearch(searchTerm: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    searchTerm + " form",
  )}`;
}

// ---------------------------------------------------------------------------
// OPTIONAL animated-GIF upgrade (DISABLED by default).
//
// To switch to animated demos later, implement a resolver behind the SAME
// getMedia(searchTerm) interface — e.g. ExerciseDB / WorkoutX via RapidAPI.
// It requires an API key (env var) and has a monthly request cap, so it is NOT
// wired up. Uncomment, supply EXERCISEDB_API_KEY, and route getMedia() to it.
//
// async function getMediaFromExerciseDb(searchTerm: string): Promise<MediaEntry> {
//   const key = process.env.EXERCISEDB_API_KEY;
//   if (!key) return { fallback: youtubeSearch(searchTerm) };
//   const res = await fetch(
//     `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(searchTerm)}`,
//     {
//       headers: {
//         "X-RapidAPI-Key": key,
//         "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
//       },
//     },
//   );
//   const hits = await res.json();
//   const gif = hits?.[0]?.gifUrl;
//   return gif ? { start: gif } : { fallback: youtubeSearch(searchTerm) };
// }
// ---------------------------------------------------------------------------
