"use client";

import Link from "next/link";
import { useAppState } from "@/components/AppStateProvider";
import { SESSIONS_BY_ID } from "@/data/program";
import { resolveAllSlots, resolveSlot } from "@/lib/program";
import { formatDate, rungName, rungProgress } from "@/lib/format";

export default function HistoryPage() {
  const { state, ready } = useAppState();

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink">History</h1>
        <Link
          href="/"
          className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink-muted active:bg-line/60"
        >
          Home
        </Link>
      </header>

      <section className="rounded-4xl bg-surface p-5 shadow-soft ring-1 ring-line/70">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-faint">
          Current rungs
        </h2>
        <ul className="flex flex-col gap-1">
          {resolveAllSlots(state).map((slot) => {
            const st = state.slotStates[slot.id];
            if (!st) return null;
            return (
              <li
                key={slot.id}
                className="flex items-center justify-between gap-3 py-1.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {rungName(slot, st.rungIndex)}
                  </p>
                  <p className="truncate text-xs text-ink-muted">{slot.pattern}</p>
                </div>
                <span className="shrink-0 rounded-full bg-paper px-2.5 py-1 text-xs font-bold text-ink-muted ring-1 ring-line">
                  {rungProgress(slot, st.rungIndex)}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="px-1 text-xs font-bold uppercase tracking-wide text-ink-faint">
          Sessions
        </h2>
        {!ready ? (
          <p className="px-1 text-ink-faint">Loading…</p>
        ) : state.logs.length === 0 ? (
          <p className="rounded-4xl bg-surface p-5 text-ink-muted shadow-soft ring-1 ring-line/70">
            No sessions logged yet. Finish one and it&apos;ll show up here.
          </p>
        ) : (
          [...state.logs].reverse().map((log, idx) => {
            const def = SESSIONS_BY_ID[log.sessionId];
            return (
              <div
                key={`${log.dateISO}-${idx}`}
                className="rounded-4xl bg-surface p-5 shadow-soft ring-1 ring-line/70"
              >
                <div className="flex items-baseline justify-between">
                  <p className="font-bold text-ink">
                    {def?.name ?? log.sessionId}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {formatDate(log.dateISO)}
                  </p>
                </div>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {log.slots.map((ls) => {
                    const slot = resolveSlot(state, ls.slotId);
                    return (
                      <li
                        key={ls.slotId}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="truncate text-ink-soft">
                          {slot ? rungName(slot, ls.rungIndex) : ls.slotId}
                        </span>
                        <span className="shrink-0 font-bold tabular-nums text-ink">
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
