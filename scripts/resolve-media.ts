// Build/seed-time media resolver.
//
//   npm run resolve-media
//
// Fetches free-exercise-db's exercises.json, fuzzy-matches each rung's
// searchTerm against exercise names, and writes data/media.json keyed by
// searchTerm. High-confidence matches store {start, finish?} image URLs; weak
// or missing matches store {fallback} (a YouTube-search link).
//
// data/media.json is committed and hand-editable — paste a better image/URL for
// any term without touching code, and it will survive re-runs unless you delete
// it (existing entries are preserved by default; pass --force to overwrite).

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SLOTS } from "../data/program";
import type { MediaEntry, MediaMap } from "../lib/types";

const FREE_EXERCISE_DB_BASE =
  "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/";
const EXERCISES_JSON = `${FREE_EXERCISE_DB_BASE}dist/exercises.json`;

// Minimum token-overlap score (0..1) to accept an image match. Below this we
// emit a "Watch demo" fallback instead.
const MATCH_THRESHOLD = 0.5;

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "../data/media.json");

interface DbExercise {
  name: string;
  images: string[]; // paths relative to /exercises/
}

const STOPWORDS = new Set(["up", "the", "a", "with", "to", "of", "and"]);

/** Crude singularizer so "squat" and "squats" match. */
function stem(tok: string): string {
  if (tok.length > 3 && tok.endsWith("s")) return tok.slice(0, -1);
  return tok;
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t))
    .map(stem);
}

/** Token-overlap similarity weighted toward covering the searchTerm's tokens. */
function score(term: string, name: string): number {
  const t = tokenize(term);
  const n = new Set(tokenize(name));
  if (t.length === 0) return 0;
  const matched = t.filter((tok) => n.has(tok)).length;
  // Cover ratio of the query, lightly penalised when the candidate name has
  // lots of extra unrelated tokens.
  const cover = matched / t.length;
  const extra = Math.max(0, n.size - matched);
  return cover - extra * 0.05;
}

function youtubeSearch(term: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    term + " form",
  )}`;
}

async function main() {
  const force = process.argv.includes("--force");

  let existing: MediaMap = {};
  if (existsSync(OUT_PATH)) {
    try {
      existing = JSON.parse(readFileSync(OUT_PATH, "utf8")) as MediaMap;
    } catch {
      existing = {};
    }
  }

  console.log(`Fetching ${EXERCISES_JSON} ...`);
  const res = await fetch(EXERCISES_JSON);
  if (!res.ok) {
    throw new Error(`Failed to fetch exercises.json: ${res.status}`);
  }
  const exercises = (await res.json()) as DbExercise[];
  console.log(`Loaded ${exercises.length} exercises.`);

  // Unique searchTerms across all ladders.
  const terms = new Set<string>();
  for (const slot of SLOTS) {
    for (const rung of slot.ladder) terms.add(rung.searchTerm);
  }

  const out: MediaMap = {};
  let images = 0;
  let fallbacks = 0;
  let preserved = 0;

  for (const term of terms) {
    // Preserve hand-edited / previously-resolved entries unless --force.
    if (!force && existing[term]) {
      out[term] = existing[term];
      preserved++;
      continue;
    }

    let best: DbExercise | null = null;
    let bestScore = -Infinity;
    for (const ex of exercises) {
      if (!ex.images || ex.images.length === 0) continue;
      const sc = score(term, ex.name);
      if (sc > bestScore) {
        bestScore = sc;
        best = ex;
      }
    }

    let entry: MediaEntry;
    if (best && bestScore >= MATCH_THRESHOLD) {
      const toUrl = (p: string) => `${FREE_EXERCISE_DB_BASE}exercises/${p}`;
      entry = {
        name: best.name,
        start: toUrl(best.images[0]),
        ...(best.images[1] ? { finish: toUrl(best.images[1]) } : {}),
      };
      images++;
      console.log(`  ✓ "${term}" → "${best.name}" (${bestScore.toFixed(2)})`);
    } else {
      entry = { fallback: youtubeSearch(term) };
      fallbacks++;
      const why = best ? `best "${best.name}" ${bestScore.toFixed(2)}` : "no match";
      console.log(`  ▶ "${term}" → fallback (${why})`);
    }
    out[term] = entry;
  }

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(sortKeys(out), null, 2) + "\n");
  console.log(
    `\nWrote ${OUT_PATH}\n  ${images} image matches, ${fallbacks} fallbacks, ${preserved} preserved.`,
  );
}

function sortKeys(m: MediaMap): MediaMap {
  return Object.fromEntries(
    Object.keys(m)
      .sort()
      .map((k) => [k, m[k]]),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
