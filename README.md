# Groundwork

A self-progressing bodyweight workout PWA. It serves the next session due, lets
you log what you actually did with one-handed +/- steppers, and **manages
strength progression for you** — you never edit the program by hand.

Mobile-first, installable to a home screen, works offline mid-session. No
accounts, no backend: everything lives in your browser's `localStorage` (with
JSON export/import for safety).

- **Stack:** Next.js (App Router) + TypeScript + Tailwind. No UI library.
- **Deploy target:** Vercel, zero env vars.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npm test             # progression-engine unit + integration tests
npm run resolve-media   # (re)generate data/media.json from free-exercise-db
```

## How progression works

Each **slot** is a movement pattern (e.g. "Horizontal pull") that climbs its own
**ladder** of variations from easiest (rung 0) to hardest. Progress uses
**double progression**:

1. Every strength slot is **3 working sets** in a **target rep range** (default
   **5–12 reps**; some slots override, and the two core slots use **seconds**).
2. Each session you log the reps/seconds per set. The card shows last time's
   numbers as the bar to beat.
3. **Advance** — when *every* one of the 3 sets pins the **top** of the range,
   the slot becomes *advance-eligible*. The app does **not** auto-advance:
   at the end of the session it asks *"Ready to level up to [next rung]?"*. Tap
   **Level up** (rung +1, rep bar resets to the bottom of the range) or **Not
   yet** (stay and keep adding reps). Advancing is your call because clean form
   is your judgement.
4. **Regress** — when the **two most recent** sessions for a slot both had set 1
   **below the bottom** of the range, it gently asks *"[slot] feeling tough —
   drop back to [previous rung]?"*. Accept → rung −1 (never below 0).
5. **Top of the ladder** — no harder rung; the review screen suggests adding
   reps or slowing the tempo instead.

Everyone starts at rung 0 on every slot. The engine lives in
[`lib/engine.ts`](lib/engine.ts) as pure functions and is fully unit-tested
([`lib/engine.test.ts`](lib/engine.test.ts),
[`data/program.test.ts`](data/program.test.ts)).

## Schedule

The rotation is **sequence-based, not calendar-locked**: the home screen shows
the next session due, alternating **A → B → A → B …**, and only advances when
you mark a session complete. Miss a day and nothing desyncs.

A separate **Recovery / mobility** session is always available as a secondary
button — it's never logged for progression. Aim for A and B about twice each per
week with a rest day between; just open the app on training days.

## Editing the program

Everything is data-driven from [`data/program.ts`](data/program.ts) — the engine
and UI read it directly, so this is the only file you touch to change the plan.

**Add or reorder a rung:** edit the slot's `ladder` array (index 0 = easiest).
Each rung is:

```ts
{
  name: "Bulgarian split squat",
  cues: ["Rear foot on a chair", "Weight on the front leg"], // 2–3 short cues
  searchTerm: "bulgarian split squat", // used for media matching + fallback link
}
```

Then run `npm run resolve-media` to (re)resolve imagery for any new `searchTerm`s.

**Notes on safety:** changing rungs is backward-safe. State is reconciled against
the program on load ([`lib/storage.ts`](lib/storage.ts)) — `rungIndex` is clamped
into range and missing slots are seeded at rung 0, so adding rungs/slots won't
corrupt existing progress. (If you *delete* or reorder rungs you've already
climbed past, your saved index may point at a different variation — export a
backup first.)

## Exercise visuals

Default source: **free-exercise-db** (public domain) via the jsDelivr CDN. These
are **stills (start/finish frames), not animated GIFs** — the robust, key-free,
rate-limit-free choice for a set-and-forget personal app. The card shows the two
frames as a tappable **start ⇄ finish** toggle, with the written cues beneath.

`npm run resolve-media` fetches the dataset, fuzzy-matches each `searchTerm`, and
writes [`data/media.json`](data/media.json) keyed by search term:

- Confident matches store `{ name, start, finish? }` image URLs.
- Weak/absent matches (the exotic progressions) store
  `{ "fallback": "https://www.youtube.com/results?search_query=… form" }`, which
  the UI renders as a **"Watch demo ▶"** button.

### Override a media URL

`data/media.json` is committed and hand-editable. To pin a better image or demo
for any movement, edit its entry directly — no code changes:

```jsonc
// images:
"shrimp squat": {
  "start": "https://example.com/shrimp-start.jpg",
  "finish": "https://example.com/shrimp-finish.jpg"
}
// or a demo link:
"shrimp squat": { "fallback": "https://youtu.be/your-clip" }
```

`npm run resolve-media` **preserves existing entries** by default, so your edits
survive re-runs. Pass `--force` to re-resolve everything from scratch.

### Switch to animated GIFs (optional)

A commented `ExerciseDB`/`WorkoutX` resolver stub lives in
[`lib/media.ts`](lib/media.ts) behind the same `getMedia(searchTerm)` interface.
It needs a RapidAPI key (env var) and has a monthly request cap, so it's **not**
wired up. To switch: supply `EXERCISEDB_API_KEY`, uncomment the stub, and route
`getMedia()` through it.

## PWA / offline

- [`public/manifest.json`](public/manifest.json) + generated icons
  (`npm run` the icon script below) make it installable to a phone home screen.
- A hand-rolled service worker ([`public/sw.js`](public/sw.js), registered only
  in production) caches the app shell (stale-while-revalidate) and exercise
  stills from jsDelivr (cache-first). Anything you view while online is then
  available offline mid-session.
- Regenerate icons (zero-dependency PNG generator) with:
  `node scripts/generate-icons.mjs`.

> Service workers don't run in `next dev`; test offline behaviour against
> `npm run build && npm start`.

## Deploy to Vercel

No env vars required.

```bash
npm i -g vercel
vercel          # preview
vercel --prod   # production
```

Or connect the repo via Vercel's Git integration — it auto-detects Next.js.

## Data backup

Settings → **Export backup** downloads your full state as JSON; **Import backup**
restores it (handy for moving between devices, since v1 is localStorage-only).
The storage layer ([`lib/storage.ts`](lib/storage.ts)) exposes `getState`,
`saveState`, `exportJSON`, and `importJSON` behind one module, so swapping
localStorage for Vercel KV / Postgres / Turso later means changing only that file.

## Project layout

```
app/                 # screens: home, session/[id], history, settings
components/           # AppStateProvider, SlotCard, Stepper, ExerciseMedia, review…
lib/
  engine.ts          # pure progression engine (advance/regress/clamp/record)
  types.ts           # data model
  storage.ts         # localStorage persistence (the one swappable backend file)
  media.ts           # getMedia() — image/fallback resolution at runtime
  format.ts          # small display helpers
data/
  program.ts         # THE program: slots, ladders, sessions, recovery list
  media.json         # generated + hand-editable media map
scripts/
  resolve-media.ts   # build/seed-time media resolver
  generate-icons.mjs # PWA icon generator
```
