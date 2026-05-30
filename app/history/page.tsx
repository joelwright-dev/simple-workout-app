"use client";

import Link from "next/link";
import { useAppState } from "@/components/AppStateProvider";
import { SESSIONS_BY_ID, SLOTS, SLOTS_BY_ID } from "@/data/program";
import { formatDate, rungName, rungProgress } from "@/lib/format";

export default function HistoryPage() {
  const { state, ready } = useAppState();

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ground-900">History</h1>
        <Link href="/" className="text-sm font-semibold text-ground-500">
          Home
        </Link>
      </header>

      {/* Per-slot current rung overview */}
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ground-100">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ground-500">
          Current rungs
        </h2>
        <ul className="flex flex-col divide-y divide-ground-100">
          {SLOTS.map((slot) => {
            const st = state.slotStates[slot.id];
            return (
              <li
                key={slot.id}
                className="flex items-center justify-between gap-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ground-900">
                    {rungName(slot, st.rungIndex)}
                  </p>
                  <p className="truncate text-xs text-ground-500">
                    {slot.pattern}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-ground-100 px-2.5 py-1 text-xs font-bold text-ground-600">
                  rung {rungProgress(slot, st.rungIndex)}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Session log, newest first */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ground-500">
          Sessions
        </h2>
        {!ready ? (
          <p className="text-ground-400">Loading…</p>
        ) : state.logs.length === 0 ? (
          <p className="rounded-2xl bg-white p-4 text-ground-500 shadow-sm ring-1 ring-ground-100">
            No sessions logged yet. Finish one and it&apos;ll show up here.
          </p>
        ) : (
          [...state.logs].reverse().map((log, idx) => {
            const def = SESSIONS_BY_ID[log.sessionId];
            return (
              <div
                key={`${log.dateISO}-${idx}`}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ground-100"
              >
                <div className="flex items-baseline justify-between">
                  <p className="font-bold text-ground-900">
                    {def?.name ?? log.sessionId}
                  </p>
                  <p className="text-xs text-ground-500">
                    {formatDate(log.dateISO)}
                  </p>
                </div>
                <ul className="mt-2 flex flex-col gap-1">
                  {log.slots.map((ls) => {
                    const slot = SLOTS_BY_ID[ls.slotId];
                    return (
                      <li
                        key={ls.slotId}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="truncate text-ground-700">
                          {slot ? rungName(slot, ls.rungIndex) : ls.slotId}
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums text-ground-900">
                          {ls.sets.join(", ")}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        )}
      </section>
    </main>
  );
}
