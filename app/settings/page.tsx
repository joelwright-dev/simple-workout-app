"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useAppState } from "@/components/AppStateProvider";
import { exportJSON, importJSON, initialState } from "@/lib/storage";

export default function SettingsPage() {
  const { setState } = useAppState();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    const blob = new Blob([exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 10);
    a.download = `groundwork-backup-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("Backup downloaded.");
    setError(null);
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = importJSON(String(reader.result));
        setState(next);
        setMessage("Backup restored.");
        setError(null);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not read that backup file.",
        );
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
    setMessage("Progress reset to a fresh program.");
    setError(null);
  };

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ground-900">Settings</h1>
        <Link href="/" className="text-sm font-semibold text-ground-500">
          Home
        </Link>
      </header>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ground-100">
        <h2 className="font-bold text-ground-900">Backup &amp; restore</h2>
        <p className="mt-1 text-sm text-ground-500">
          Everything lives in this browser only. Export a JSON backup to keep
          your progress safe or move it to another device.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-xl bg-clay-500 px-4 py-3 font-bold text-white active:scale-[0.99] active:bg-clay-600"
          >
            Export backup (.json)
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-xl bg-ground-100 px-4 py-3 font-bold text-ground-700 active:scale-[0.99]"
          >
            Import backup…
          </button>
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
          <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ground-100">
        <h2 className="font-bold text-ground-900">Danger zone</h2>
        <p className="mt-1 text-sm text-ground-500">
          Start over from scratch. This cannot be undone.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="mt-4 w-full rounded-xl border border-red-200 px-4 py-3 font-bold text-red-600 active:bg-red-50"
        >
          Reset all progress
        </button>
      </section>
    </main>
  );
}
