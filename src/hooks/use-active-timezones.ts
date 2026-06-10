"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { DEFAULT_TIMEZONES } from "@/data/timezone-data";
import { useLocalStorageState } from "./use-local-storage-state";

const STORAGE_KEY = "world-clock-active-timezones";
const URL_PARAM = "zones";

function parseTimezones(raw: string): string[] {
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed.filter((t): t is string => typeof t === "string");
  }
  return DEFAULT_TIMEZONES;
}

function readFromUrlParams(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const zones = params.get(URL_PARAM);
    if (zones) {
      const parsed = zones.split(",").filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
  } catch {}
  return null;
}

// useSyncExternalStore-based hydration flag. Returns false on the server and
// during the initial client render (so SSR + hydration match), then flips to
// true once React has hydrated.
const NEVER_CHANGES = () => () => {};
function useHydrated(): boolean {
  return useSyncExternalStore(
    NEVER_CHANGES,
    () => true,
    () => false,
  );
}

export function useActiveTimezones() {
  const [activeTimezones, setActiveTimezones] = useLocalStorageState<string[]>(
    STORAGE_KEY,
    DEFAULT_TIMEZONES,
    parseTimezones,
  );
  const loaded = useHydrated();

  // URL params take precedence on first mount — write them to storage and
  // the store subscription propagates the new value into state without an
  // additional setState call.
  useEffect(() => {
    const fromUrl = readFromUrlParams();
    if (fromUrl) setActiveTimezones(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = useCallback(
    (tz: string) => {
      setActiveTimezones((prev) =>
        prev.includes(tz) ? prev.filter((t) => t !== tz) : [...prev, tz],
      );
    },
    [setActiveTimezones],
  );

  const isActive = useCallback(
    (tz: string) => activeTimezones.includes(tz),
    [activeTimezones],
  );

  const setTimezones = useCallback(
    (tzs: string[]) => setActiveTimezones(tzs),
    [setActiveTimezones],
  );

  const getShareUrl = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set(URL_PARAM, activeTimezones.join(","));
    return url.toString();
  }, [activeTimezones]);

  return { activeTimezones, toggle, isActive, loaded, getShareUrl, setTimezones };
}
