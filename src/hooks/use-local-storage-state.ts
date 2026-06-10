"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * A useState-like hook backed by localStorage. Uses useSyncExternalStore so
 * every component reading the same key stays in sync without effect cascades —
 * the previous setState-in-useEffect pattern was triggering React's
 * `react-hooks/set-state-in-effect` lint and caused an extra render on mount.
 *
 * Cross-tab updates via the native `storage` event are also picked up
 * automatically. Writes from within the same tab notify local subscribers
 * directly since the `storage` event doesn't fire on the tab that wrote it.
 */

type Serializer<T> = (value: T) => string;
type Parser<T> = (raw: string) => T;

const listeners = new Map<string, Set<() => void>>();

function subscribe(key: string, fn: () => void): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(fn);

  // Cross-tab sync: storage events only fire in *other* tabs, so the same-tab
  // subscriber wakeup must be triggered manually in setValue below.
  const handleStorage = (e: StorageEvent) => {
    if (e.key === key) fn();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    set!.delete(fn);
    if (set!.size === 0) listeners.delete(key);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function notify(key: string) {
  const set = listeners.get(key);
  if (set) for (const fn of set) fn();
}

export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
  parse: Parser<T> = JSON.parse as Parser<T>,
  serialize: Serializer<T> = JSON.stringify as Serializer<T>,
): [T, (value: T | ((prev: T) => T)) => void] {
  const getSnapshot = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }, [key]);

  // getServerSnapshot returns a stable sentinel so SSR + first client render
  // match. We map both to defaultValue below.
  const getServerSnapshot = useCallback((): string | null => null, []);

  const raw = useSyncExternalStore(
    useCallback((fn) => subscribe(key, fn), [key]),
    getSnapshot,
    getServerSnapshot,
  );

  let value: T;
  if (raw == null) {
    value = defaultValue;
  } else {
    try {
      value = parse(raw);
    } catch {
      value = defaultValue;
    }
  }

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const current = (() => {
        const r = getSnapshot();
        if (r == null) return defaultValue;
        try {
          return parse(r);
        } catch {
          return defaultValue;
        }
      })();
      const resolved =
        typeof next === "function"
          ? (next as (prev: T) => T)(current)
          : next;
      try {
        localStorage.setItem(key, serialize(resolved));
      } catch {
        // localStorage unavailable — still notify in-memory subscribers so
        // the UI reflects the intended state for this session.
      }
      notify(key);
    },
    [key, defaultValue, parse, serialize, getSnapshot],
  );

  return [value, setValue];
}
