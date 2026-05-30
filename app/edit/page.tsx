"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppState } from "@/components/AppStateProvider";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/Stepper";
import { SESSIONS } from "@/data/program";
import {
  addSlotToSession,
  createCustomExercise,
  moveSlotInSession,
  removeSlotFromSession,
  resolveAllSlots,
  resolveSessionSlotIds,
  resolveSessionSlots,
} from "@/lib/program";
import { rangeLabel } from "@/lib/format";
import type { Unit } from "@/lib/types";

const EDITABLE = SESSIONS.filter((s) => s.id !== "RECOVERY");

export default function EditPage() {
  const { ready } = useAppState();

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Edit sessions</h1>
          <p className="text-sm text-ink-muted">
            Add, remove, or reorder the exercises in each workout.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink-muted active:bg-line/60"
        >
          Done
        </Link>
      </header>

      {!ready ? (
        <p className="px-1 text-ink-faint">Loading…</p>
      ) : (
        EDITABLE.map((session) => (
          <SessionEditor
            key={session.id}
            sessionId={session.id}
            name={session.name}
          />
        ))
      )}
    </main>
  );
}

function SessionEditor({
  sessionId,
  name,
}: {
  sessionId: string;
  name: string;
}) {
  const { state, update } = useAppState();
  const [adding, setAdding] = useState(false);
  const slots = resolveSessionSlots(state, sessionId);
  const ids = resolveSessionSlotIds(state, sessionId);

  return (
    <section className="rounded-4xl bg-surface p-5 shadow-soft ring-1 ring-line/70">
      <h2 className="mb-3 text-lg font-extrabold text-ink">{name}</h2>

      {slots.length === 0 && (
        <p className="mb-2 rounded-2xl bg-paper px-4 py-3 text-sm text-ink-muted">
          No exercises yet — add one below.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {slots.map((slot, i) => (
          <li
            key={slot.id}
            className="flex items-center gap-2 rounded-2xl bg-paper py-2 pl-4 pr-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink">
                {slot.ladder[0].name}
              </p>
              <p className="truncate text-xs text-ink-muted">
                {slot.pattern} · {rangeLabel(slot)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <IconBtn
                label="Move up"
                disabled={i === 0}
                onClick={() =>
                  update((s) => moveSlotInSession(s, sessionId, i, -1))
                }
              >
                ↑
              </IconBtn>
              <IconBtn
                label="Move down"
                disabled={i === slots.length - 1}
                onClick={() =>
                  update((s) => moveSlotInSession(s, sessionId, i, 1))
                }
              >
                ↓
              </IconBtn>
              <IconBtn
                label="Remove"
                danger
                onClick={() =>
                  update((s) => removeSlotFromSession(s, sessionId, slot.id))
                }
              >
                ×
              </IconBtn>
            </div>
          </li>
        ))}
      </ul>

      {adding ? (
        <AddPanel
          sessionId={sessionId}
          existingIds={ids}
          onClose={() => setAdding(false)}
        />
      ) : (
        <Button
          variant="soft"
          className="mt-3 w-full"
          onClick={() => setAdding(true)}
        >
          + Add exercise
        </Button>
      )}
    </section>
  );
}

function AddPanel({
  sessionId,
  existingIds,
  onClose,
}: {
  sessionId: string;
  existingIds: string[];
  onClose: () => void;
}) {
  const { state, update } = useAppState();
  const [creating, setCreating] = useState(false);
  const library = resolveAllSlots(state).filter(
    (s) => !existingIds.includes(s.id),
  );

  if (creating) {
    return (
      <CreateForm
        sessionId={sessionId}
        onDone={onClose}
        onCancel={() => setCreating(false)}
      />
    );
  }

  return (
    <div className="mt-3 rounded-3xl bg-paper p-3">
      {library.length > 0 && (
        <>
          <p className="px-1 pb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">
            Add from library
          </p>
          <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
            {library.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    update((st) => addSlotToSession(st, sessionId, s.id));
                    onClose();
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-2xl bg-surface px-4 py-2.5 text-left ring-1 ring-line/70 active:bg-line/40"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {s.ladder[0].name}
                    </span>
                    <span className="block truncate text-xs text-ink-muted">
                      {s.pattern}
                    </span>
                  </span>
                  <span className="shrink-0 text-lg font-bold text-accent-ink">
                    +
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-3 flex gap-2">
        <Button
          variant="accent"
          className="flex-1"
          onClick={() => setCreating(true)}
        >
          Create new exercise
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function CreateForm({
  sessionId,
  onDone,
  onCancel,
}: {
  sessionId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { update } = useAppState();
  const [name, setName] = useState("");
  const [pattern, setPattern] = useState("");
  const [unit, setUnit] = useState<Unit>("reps");
  const [perSide, setPerSide] = useState(false);
  const [sets, setSets] = useState(3);
  const [min, setMin] = useState(5);
  const [max, setMax] = useState(12);
  const [cues, setCues] = useState("");

  const canSave = name.trim().length > 0;

  function save() {
    if (!canSave) return;
    update(
      (s) =>
        createCustomExercise(s, sessionId, {
          name,
          pattern,
          unit,
          perSide,
          sets,
          range: [min, max],
          cues: cues.split("\n"),
        }).state,
    );
    onDone();
  }

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-3xl bg-paper p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">
        New exercise
      </p>

      <TextField
        label="Name"
        value={name}
        onChange={setName}
        placeholder="e.g. Walking lunge"
      />
      <TextField
        label="Category (optional)"
        value={pattern}
        onChange={setPattern}
        placeholder="e.g. Single-leg"
      />

      <div>
        <FieldLabel>Measured in</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          {(["reps", "seconds"] as Unit[]).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
              className={`rounded-2xl px-4 py-2.5 text-sm font-semibold capitalize ring-1 transition ${
                unit === u
                  ? "bg-ink text-paper ring-ink"
                  : "bg-surface text-ink-muted ring-line"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3 ring-1 ring-line">
        <span className="text-sm font-semibold text-ink-soft">
          Per side (e.g. each leg)
        </span>
        <input
          type="checkbox"
          checked={perSide}
          onChange={(e) => setPerSide(e.target.checked)}
          className="h-5 w-5 accent-accent"
        />
      </label>

      <NumberRow label="Sets">
        <Stepper value={sets} min={1} max={10} onChange={setSets} />
      </NumberRow>
      <NumberRow label={`Target min (${unit})`}>
        <Stepper value={min} min={0} max={600} onChange={setMin} />
      </NumberRow>
      <NumberRow label={`Target max (${unit})`}>
        <Stepper value={max} min={0} max={600} onChange={setMax} />
      </NumberRow>

      <label className="flex flex-col gap-1.5">
        <FieldLabel>Form cues (optional, one per line)</FieldLabel>
        <textarea
          value={cues}
          onChange={(e) => setCues(e.target.value)}
          rows={3}
          placeholder={"Step forward\nKeep your torso tall"}
          className="rounded-2xl bg-surface px-4 py-3 text-ink ring-1 ring-line outline-none transition placeholder:text-ink-faint focus:ring-2 focus:ring-accent"
        />
      </label>

      <div className="mt-1 flex gap-2">
        <Button className="flex-1" disabled={!canSave} onClick={save}>
          Add to session
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Back
        </Button>
      </div>
    </div>
  );
}

// ---- small presentational helpers ----

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold ring-1 transition active:scale-95 disabled:opacity-30 ${
        danger
          ? "bg-surface text-red-500 ring-line"
          : "bg-surface text-ink-soft ring-line"
      }`}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-sm font-semibold text-ink-soft">
      {children}
    </span>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-2xl bg-surface px-4 py-3 text-ink ring-1 ring-line outline-none transition placeholder:text-ink-faint focus:ring-2 focus:ring-accent"
      />
    </label>
  );
}

function NumberRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-surface py-2 pl-4 pr-2 ring-1 ring-line">
      <span className="text-sm font-semibold text-ink-soft">{label}</span>
      {children}
    </div>
  );
}
