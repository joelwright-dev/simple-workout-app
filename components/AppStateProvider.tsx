"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { AppState } from "@/lib/types";
import { getState, initialState, saveState } from "@/lib/storage";

interface AppStateContextValue {
  state: AppState;
  /** Replace state and persist. */
  setState: (next: AppState) => void;
  /** Mutate via an updater and persist. */
  update: (fn: (prev: AppState) => AppState) => void;
  /** True once we've hydrated from localStorage (avoids SSR mismatch). */
  ready: boolean;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setStateRaw] = useState<AppState>(initialState);
  const [ready, setReady] = useState(false);

  // Hydrate from storage on the client only.
  useEffect(() => {
    setStateRaw(getState());
    setReady(true);
  }, []);

  const setState = (next: AppState) => {
    setStateRaw(next);
    saveState(next);
  };

  const update = (fn: (prev: AppState) => AppState) => {
    setStateRaw((prev) => {
      const next = fn(prev);
      saveState(next);
      return next;
    });
  };

  return (
    <AppStateContext.Provider value={{ state, setState, update, ready }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return ctx;
}
