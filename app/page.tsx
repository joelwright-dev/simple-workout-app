"use client";

import Link from "next/link";
import { useAppState } from "@/components/AppStateProvider";
import { SESSIONS_BY_ID, SLOTS_BY_ID } from "@/data/program";
import { currentRotationSessionId } from "@/lib/engine";
import { rangeLabel, rungName, rungProgress } from "@/lib/format";

export default function HomePage() {
  const { state, ready } = useAppState();

  if (!ready) {
    return <LoadingShell />;
  }

  const dueId = currentRotationSessionId(state.rotationIndex);
  const due = SESSIONS_BY_ID[dueId];

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-ground-900">
          Groundwork
        </h1>
        <nav className="flex gap-3 text-sm font-semibold text-ground-500">
          <Link href="/history" className="active:text-clay-600">
            History
          </Link>
          <Link href="/settings" className="active:text-clay-600">
            Settings
          </Link>
        </nav>
      </header>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ground-100">
        <p className="text-sm font-semibold uppercase tracking-wide text-clay-600">
          Today
        </p>
        <h2 className="mt-1 text-2xl font-bold text-ground-900">{due.name}</h2>

        <ul className="mt-4 flex flex-col divide-y divide-ground-100">
          {due.slotIds.map((slotId) => {
            const slot = SLOTS_BY_ID[slotId];
            const st = state.slotStates[slotId];
            return (
              <li
                key={slotId}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ground-900">
                    {rungName(slot, st.rungIndex)}
                  </p>
                  <p className="truncate text-xs text-ground-500">
                    {slot.pattern} · {rangeLabel(slot)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-ground-100 px-2.5 py-1 text-xs font-bold text-ground-600">
                  {rungProgress(slot, st.rungIndex)}
                </span>
              </li>
            );
          })}
        </ul>

        <Link
          href={`/session/${dueId}`}
          className="mt-5 flex w-full items-center justify-center rounded-xl bg-clay-500 px-4 py-4 text-lg font-bold text-white shadow active:scale-[0.99] active:bg-clay-600"
        >
          Start {due.name}
        </Link>
      </section>

      <Link
        href="/session/RECOVERY"
        className="flex items-center justify-center rounded-xl border border-ground-200 bg-ground-50 px-4 py-3.5 font-semibold text-ground-700 active:bg-ground-100"
      >
        Recovery / mobility session
      </Link>

      <p className="mt-auto px-2 text-center text-xs leading-relaxed text-ground-400">
        Run A and B about twice each per week, with a rest day between. The app
        serves the next session whenever you open it on a training day — miss a
        day and nothing desyncs.
      </p>
    </main>
  );
}

function LoadingShell() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-6">
      <p className="text-ground-400">Loading…</p>
    </main>
  );
}
