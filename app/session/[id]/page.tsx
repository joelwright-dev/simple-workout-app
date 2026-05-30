"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState } from "@/components/AppStateProvider";
import { SlotCard } from "@/components/SlotCard";
import { SessionReview, type Decision } from "@/components/SessionReview";
import {
  RECOVERY_ITEMS,
  SESSIONS_BY_ID,
  SLOTS_BY_ID,
} from "@/data/program";
import {
  applyAdvance,
  applyRegress,
  evaluateSlot,
  recordSession,
  type Suggestion,
} from "@/lib/engine";
import { slotLoggedHistory } from "@/lib/engine";
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
        <p className="text-ground-600">Unknown session.</p>
        <Link href="/" className="font-semibold text-clay-600">
          Back home
        </Link>
      </main>
    );
  }

  if (session.id === "RECOVERY") {
    return <RecoverySession />;
  }

  return <StrengthSession sessionId={session.id} />;
}

function RecoverySession() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ground-900">
          Recovery / mobility
        </h1>
        <Link href="/" className="text-sm font-semibold text-ground-500">
          Done
        </Link>
      </header>
      <p className="text-sm text-ground-500">
        Easy, un-tracked work to keep things moving on a rest day.
      </p>
      <ul className="flex flex-col gap-3">
        {RECOVERY_ITEMS.map((item) => (
          <li
            key={item.name}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ground-100"
          >
            <p className="font-bold text-ground-900">{item.name}</p>
            <p className="mt-0.5 text-sm text-ground-600">{item.cue}</p>
          </li>
        ))}
      </ul>
      <Link
        href="/"
        className="mt-2 rounded-xl bg-ground-700 px-4 py-4 text-center text-lg font-bold text-white active:scale-[0.99]"
      >
        Finish
      </Link>
    </main>
  );
}

type Phase = "log" | "review";

function StrengthSession({ sessionId }: { sessionId: "A" | "B" }) {
  const router = useRouter();
  const { state, setState, ready } = useAppState();
  const session = SESSIONS_BY_ID[sessionId];

  const [phase, setPhase] = useState<Phase>("log");
  // Per-slot logged set values. Initialised lazily from current state.
  const [logged, setLogged] = useState<Record<string, number[]> | null>(null);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [recorded, setRecorded] = useState<AppState | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Seed the steppers once state is ready: default to last time's numbers, or
  // the bottom of the range on a fresh rung.
  const initialLogged = useMemo(() => {
    if (!ready) return null;
    const out: Record<string, number[]> = {};
    for (const slotId of session.slotIds) {
      const slot = SLOTS_BY_ID[slotId];
      const st = state.slotStates[slotId];
      const fallback = slot.range[0];
      const last = st.lastSets;
      out[slotId] = Array.from({ length: slot.sets }, (_, i) =>
        last && typeof last[i] === "number" ? last[i] : fallback,
      );
    }
    return out;
  }, [ready, session.slotIds, state.slotStates]);

  const values = logged ?? initialLogged;

  if (!ready || !values) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <p className="text-ground-400">Loading…</p>
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

    const dateISO = new Date().toISOString();
    const nextState = recordSession(state, sessionId, loggedSlots, dateISO);

    // Evaluate each slot against the history that now includes this session.
    const suggs: Suggestion[] = session.slotIds.map((slotId) => {
      const slot = SLOTS_BY_ID[slotId];
      const history = slotLoggedHistory(nextState.logs, slotId);
      return evaluateSlot(slot, nextState.slotStates[slotId], history);
    });

    setRecorded(nextState);
    setSuggestions(suggs);
    setPhase("review");
    window.scrollTo({ top: 0 });
  };

  const handleDecide = (slotId: string, decision: Decision) => {
    setDecisions((prev) => ({ ...prev, [slotId]: decision }));
  };

  const handleCommit = () => {
    if (!recorded) return;
    let finalState = recorded;
    const slotStates = { ...finalState.slotStates };
    for (const s of suggestions) {
      if (!s || decisions[s.slotId] !== "accepted") continue;
      const slot = SLOTS_BY_ID[s.slotId];
      if (s.type === "advance") {
        slotStates[s.slotId] = applyAdvance(slot, slotStates[s.slotId]);
      } else if (s.type === "regress") {
        slotStates[s.slotId] = applyRegress(slot, slotStates[s.slotId]);
      }
    }
    finalState = { ...finalState, slotStates };
    setState(finalState);
    router.push("/");
  };

  if (phase === "review") {
    return (
      <SessionReview
        suggestions={suggestions}
        decisions={decisions}
        onDecide={handleDecide}
        onFinish={handleCommit}
      />
    );
  }

  return (
    <main className="flex flex-1 flex-col px-4 py-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ground-900">
            {session.name}
          </h1>
          <p className="text-sm text-ground-500">
            {session.slotIds.length} movements · 3 sets each
          </p>
        </div>
        <Link href="/" className="text-sm font-semibold text-ground-500">
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

      <div className="sticky bottom-0 -mx-4 mt-4 bg-gradient-to-t from-ground-50 via-ground-50 to-transparent px-4 pb-safe pt-3">
        <button
          type="button"
          onClick={handleFinish}
          className="w-full rounded-xl bg-clay-500 px-4 py-4 text-lg font-bold text-white shadow-lg active:scale-[0.99] active:bg-clay-600"
        >
          Finish session
        </button>
      </div>
    </main>
  );
}
