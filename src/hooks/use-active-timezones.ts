"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { DEFAULT_TIMEZONES } from "@/data/timezone-data";
import { isKnownPlaceId } from "@/data/regions";
import { useLocalStorageState } from "./use-local-storage-state";

const STORAGE_KEY = "world-clock-active-timezones";
const URL_PARAM = "zones";
/** Upper bound on tracked zones — a shared link shouldn't be able to ask the
 *  browser to build, sort and weather-fetch an unbounded region list. */
const MAX_ZONES = 50;

/**
 * Drop unknown ids, collapse duplicates (they'd produce duplicate React keys and
 * duplicate weather requests) and cap the length. Returns null when nothing
 * usable survives so callers can fall back to the defaults.
 */
function sanitize(ids: unknown[]): string[] | null {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (typeof id !== "string" || seen.has(id) || !isKnownPlaceId(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= MAX_ZONES) break;
  }
  return out.length > 0 ? out : null;
}

function parseTimezones(raw: string): string[] {
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) {
    return sanitize(parsed) ?? DEFAULT_TIMEZONES;
  }
  return DEFAULT_TIMEZONES;
}

function readFromUrlParams(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const zones = params.get(URL_PARAM);
    if (zones) return sanitize(zones.split(",").filter(Boolean));
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
        prev.includes(tz)
          ? prev.filter((t) => t !== tz)
          : prev.length >= MAX_ZONES
            ? prev
            : [...prev, tz],
      );
    },
    [setActiveTimezones],
  );

  const isActive = useCallback(
    (tz: string) => activeTimezones.includes(tz),
    [activeTimezones],
  );

  const setTimezones = useCallback(
    (tzs: string[]) => setActiveTimezones(sanitize(tzs) ?? DEFAULT_TIMEZONES),
    [setActiveTimezones],
  );

  const getShareUrl = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set(URL_PARAM, activeTimezones.join(","));
    return url.toString();
  }, [activeTimezones]);

  return { activeTimezones, toggle, isActive, loaded, getShareUrl, setTimezones };
}
