"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { AppState } from "@/lib/types";
import { initialState, readLegacyLocalState, clearLegacyLocalState } from "@/lib/storage";
import { loadState, persistState } from "@/lib/actions";

interface AppStateContextValue {
  state: AppState;
  setState: (next: AppState) => void;
  update: (fn: (prev: AppState) => AppState) => void;
  ready: boolean;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

const SAVE_DEBOUNCE_MS = 700;

export function AppStateProvider({
  userId,
  children,
}: {
  userId: string | null;
  children: React.ReactNode;
}) {
  const [state, setStateRaw] = useState<AppState>(initialState);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced server persistence.
  const scheduleSave = useCallback((next: AppState) => {
    if (!userId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      persistState(next).catch(() => {
        /* best-effort; will retry on next change */
      });
    }, SAVE_DEBOUNCE_MS);
  }, [userId]);

  // Initial load from the server (authenticated routes only).
  useEffect(() => {
    if (!userId) {
      setReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        let loaded = await loadState();
        // One-time migration of v1 on-device data into a fresh account.
        if (loaded.logs.length === 0) {
          const legacy = readLegacyLocalState();
          if (legacy && legacy.logs.length > 0) {
            loaded = legacy;
            await persistState(loaded);
            clearLegacyLocalState();
          }
        }
        if (!cancelled) setStateRaw(loaded);
      } catch {
        /* leave seeded initialState */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Flush a pending save when the tab is hidden/closed.
  useEffect(() => {
    const flush = () => {
      if (saveTimer.current && userId) {
        clearTimeout(saveTimer.current);
        persistState(state).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", flush);
    return () => document.removeEventListener("visibilitychange", flush);
  }, [state, userId]);

  const setState = useCallback(
    (next: AppState) => {
      setStateRaw(next);
      scheduleSave(next);
    },
    [scheduleSave],
  );

  const update = useCallback(
    (fn: (prev: AppState) => AppState) => {
      setStateRaw((prev) => {
        const next = fn(prev);
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

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
