"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState } from "@/components/AppStateProvider";
import { SlotCard } from "@/components/SlotCard";
import { SessionReview, type Decision } from "@/components/SessionReview";
import { ButtonLink } from "@/components/ui/Button";
import { RECOVERY_ITEMS, SESSIONS_BY_ID, SLOTS_BY_ID } from "@/data/program";
import {
  applyAdvance,
  applyRegress,
  evaluateSlot,
  recordSession,
  slotLoggedHistory,
  type Suggestion,
} from "@/lib/engine";
import type { AppState, LoggedSlot } from "@/lib/types";

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const session = SESSIONS_BY_ID[id];

  if (!session) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <p className="text-ink-muted">Unknown session.</p>
        <ButtonLink href="/" variant="soft">
          Back home
        </ButtonLink>
      </main>
    );
  }

  if (session.id === "RECOVERY") return <RecoverySession />;
  return <StrengthSession sessionId={session.id} />;
}

function RecoverySession() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink">Recovery</h1>
        <Link
          href="/"
          className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink-muted active:bg-line/60"
        >
          Done
        </Link>
      </header>
      <p className="px-1 text-sm text-ink-muted">
        Easy, un-tracked work to keep things moving on a rest day.
      </p>
      <ul className="flex flex-col gap-3">
        {RECOVERY_ITEMS.map((item) => (
          <li
            key={item.name}
            className="rounded-4xl bg-surface p-5 shadow-soft ring-1 ring-line/70"
          >
            <p className="font-bold text-ink">{item.name}</p>
            <p className="mt-0.5 text-sm text-ink-muted">{item.cue}</p>
          </li>
        ))}
      </ul>
      <ButtonLink href="/" className="mt-2 w-full">
        Finish
      </ButtonLink>
    </main>
  );
}

type Phase = "log" | "review";

function StrengthSession({ sessionId }: { sessionId: "A" | "B" }) {
  const router = useRouter();
  const { state, setState, ready } = useAppState();
  const session = SESSIONS_BY_ID[sessionId];

  const [phase, setPhase] = useState<Phase>("log");
  const [logged, setLogged] = useState<Record<string, number[]> | null>(null);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [recorded, setRecorded] = useState<AppState | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Seed steppers: default to last time's numbers, or the bottom of the range.
  const initialLogged = useMemo(() => {
    if (!ready) return null;
    const out: Record<string, number[]> = {};
    for (const slotId of session.slotIds) {
      const slot = SLOTS_BY_ID[slotId];
      const last = state.slotStates[slotId].lastSets;
      out[slotId] = Array.from({ length: slot.sets }, (_, i) =>
        last && typeof last[i] === "number" ? last[i] : slot.range[0],
      );
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, sessionId]);

  const values = logged ?? initialLogged;

  if (!ready || !values) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <span className="h-10 w-10 animate-pulse rounded-2xl bg-ink" />
      </main>
    );
  }

  const setSetValue = (slotId: string, setIndex: number, value: number) => {
    setLogged((prev) => {
      const base = prev ?? values;
      const next = { ...base, [slotId]: [...base[slotId]] };
      next[slotId][setIndex] = value;
      return next;
    });
  };

  const handleFinish = () => {
    const loggedSlots: LoggedSlot[] = session.slotIds.map((slotId) => ({
      slotId,
      rungIndex: state.slotStates[slotId].rungIndex,
      sets: values[slotId],
    }));

    const nextState = recordSession(
      state,
      sessionId,
      loggedSlots,
      new Date().toISOString(),
    );

    const suggs: Suggestion[] = session.slotIds.map((slotId) =>
      evaluateSlot(
        SLOTS_BY_ID[slotId],
        nextState.slotStates[slotId],
        slotLoggedHistory(nextState.logs, slotId),
      ),
    );

    setRecorded(nextState);
    setSuggestions(suggs);
    setPhase("review");
    window.scrollTo({ top: 0 });
  };

  const handleCommit = () => {
    if (!recorded) return;
    const slotStates = { ...recorded.slotStates };
    for (const s of suggestions) {
      if (!s || decisions[s.slotId] !== "accepted") continue;
      const slot = SLOTS_BY_ID[s.slotId];
      if (s.type === "advance") {
        slotStates[s.slotId] = applyAdvance(slot, slotStates[s.slotId]);
      } else if (s.type === "regress") {
        slotStates[s.slotId] = applyRegress(slot, slotStates[s.slotId]);
      }
    }
    setState({ ...recorded, slotStates });
    router.push("/");
  };

  if (phase === "review") {
    return (
      <SessionReview
        suggestions={suggestions}
        decisions={decisions}
        onDecide={(slotId, decision) =>
          setDecisions((prev) => ({ ...prev, [slotId]: decision }))
        }
        onFinish={handleCommit}
      />
    );
  }

  return (
    <main className="flex flex-1 flex-col px-4 py-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{session.name}</h1>
          <p className="text-sm text-ink-muted">
            {session.slotIds.length} movements · 3 sets each
          </p>
        </div>
        <Link
          href="/"
          className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink-muted active:bg-line/60"
        >
          Cancel
        </Link>
      </header>

      <div className="flex flex-col gap-4">
        {session.slotIds.map((slotId) => {
          const slot = SLOTS_BY_ID[slotId];
          const st = state.slotStates[slotId];
          return (
            <SlotCard
              key={slotId}
              slot={slot}
              rungIndex={st.rungIndex}
              sets={values[slotId]}
              lastSets={st.lastSets}
              onChangeSet={(i, v) => setSetValue(slotId, i, v)}
            />
          );
        })}
      </div>

      <div className="sticky bottom-0 -mx-4 mt-4 bg-gradient-to-t from-paper via-paper to-transparent px-4 pb-safe pt-4">
        <button
          type="button"
          onClick={handleFinish}
          className="w-full rounded-2xl bg-ink px-5 py-4 text-lg font-bold text-paper shadow-lift transition active:scale-[0.99] active:bg-ink-soft"
        >
          Finish session
        </button>
      </div>
    </main>
  );
}
