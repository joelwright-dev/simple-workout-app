"use client";

import Link from "next/link";
import { useAppState } from "@/components/AppStateProvider";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SESSIONS_BY_ID } from "@/data/program";
import { resolveSessionSlotIds, resolveSlot } from "@/lib/program";
import { currentRotationSessionId } from "@/lib/engine";
import { rangeLabel, rungName, rungProgress } from "@/lib/format";

export default function HomePage() {
  const { state, ready } = useAppState();

  if (!ready) return <Splash />;

  const dueId = currentRotationSessionId(state.rotationIndex);
  const due = SESSIONS_BY_ID[dueId];
  const nextId = dueId === "A" ? "B" : "A";
  const dueSlotIds = resolveSessionSlotIds(state, dueId);

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-sm font-black text-paper">
            G
          </span>
          <span className="text-lg font-extrabold tracking-tight text-ink">
            Groundwork
          </span>
        </div>
        <nav className="flex gap-1 text-sm font-semibold text-ink-muted">
          <Link href="/history" className="rounded-full px-3 py-1.5 active:bg-line/60">
            History
          </Link>
          <Link href="/settings" className="rounded-full px-3 py-1.5 active:bg-line/60">
            Settings
          </Link>
        </nav>
      </header>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent-ink">
            Up next
          </span>
          <span className="text-xs font-semibold text-ink-faint">
            then Session {nextId}
          </span>
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">
          {due.name}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {dueSlotIds.length} movements · 3 sets each
        </p>

        <ul className="mt-5 flex flex-col gap-1">
          {dueSlotIds.map((slotId) => {
            const slot = resolveSlot(state, slotId);
            const st = state.slotStates[slotId];
            if (!slot || !st) return null;
            return (
              <li
                key={slotId}
                className="flex items-center justify-between gap-3 rounded-2xl px-1 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">
                    {rungName(slot, st.rungIndex)}
                  </p>
                  <p className="truncate text-xs text-ink-muted">
                    {slot.pattern} · {rangeLabel(slot)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-paper px-2.5 py-1 text-xs font-bold text-ink-muted ring-1 ring-line">
                  {rungProgress(slot, st.rungIndex)}
                </span>
              </li>
            );
          })}
        </ul>

        <ButtonLink href={`/session/${dueId}`} className="mt-5 w-full">
          Start {due.name}
        </ButtonLink>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <ButtonLink href="/session/RECOVERY" variant="soft">
          Recovery
        </ButtonLink>
        <ButtonLink href="/edit" variant="soft">
          Edit sessions
        </ButtonLink>
      </div>

      <p className="mt-auto px-4 text-center text-xs leading-relaxed text-ink-faint">
        A and B alternate automatically — aim for each ~2× a week with a rest day
        between. Miss a day and nothing desyncs.
      </p>
    </main>
  );
}

function Splash() {
  return (
    <main className="flex flex-1 items-center justify-center">
      <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-ink text-xl font-black text-paper">
        G
      </span>
    </main>
  );
}
