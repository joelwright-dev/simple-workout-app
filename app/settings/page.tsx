"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useAppState } from "@/components/AppStateProvider";
import { Button } from "@/components/ui/Button";
import { SignOutButton } from "@/components/SignOutButton";
import { initialState, parseImport, serializeState } from "@/lib/storage";

export default function SettingsPage() {
  const { state, setState } = useAppState();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const flash = (msg: string) => {
    setMessage(msg);
    setError(null);
  };

  const handleExport = () => {
    const blob = new Blob([serializeState(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `groundwork-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash("Backup downloaded.");
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setState(parseImport(String(reader.result)));
        flash("Backup restored.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not read that file.");
        setMessage(null);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (
      !window.confirm(
        "Reset all progress? Every slot returns to rung 0 and history is cleared. Export a backup first if unsure.",
      )
    ) {
      return;
    }
    setState(initialState());
    flash("Progress reset to a fresh program.");
  };

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink">Settings</h1>
        <Link
          href="/"
          className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink-muted active:bg-line/60"
        >
          Home
        </Link>
      </header>

      <section className="rounded-4xl bg-surface p-5 shadow-soft ring-1 ring-line/70">
        <h2 className="font-bold text-ink">Account</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Your progress is saved to your account and syncs across devices.
        </p>
        <div className="mt-4">
          <SignOutButton />
        </div>
      </section>

      <section className="rounded-4xl bg-surface p-5 shadow-soft ring-1 ring-line/70">
        <h2 className="font-bold text-ink">Backup &amp; restore</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Export a JSON snapshot, or restore one you saved earlier.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <Button onClick={handleExport} className="w-full">
            Export backup (.json)
          </Button>
          <Button
            variant="soft"
            onClick={() => fileRef.current?.click()}
            className="w-full"
          >
            Import backup…
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = "";
            }}
          />
        </div>

        {message && (
          <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
      </section>

      <section className="rounded-4xl bg-surface p-5 shadow-soft ring-1 ring-line/70">
        <h2 className="font-bold text-ink">Danger zone</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Start over from scratch. This cannot be undone.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="mt-4 w-full rounded-2xl px-4 py-3 font-semibold text-red-600 ring-1 ring-red-200 active:bg-red-50"
        >
          Reset all progress
        </button>
      </section>
    </main>
  );
}
