"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchWeather, type WeatherData } from "@/lib/weather";

interface LocationInput {
  id: string;
  coordinates: [number, number]; // [lat, lon]
}

const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes — background refresh cadence
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes — stale-while-revalidate window
const STORAGE_KEY = "world-clock-weather-cache";
const STORAGE_UNIT_KEY = "world-clock-temp-unit";

interface CachedWeather {
  data: Record<string, WeatherData>;
  timestamp: number;
}

// Defensive shape check — bail on anything that doesn't look like our schema
// so an old/garbled cache from a previous build can't poison render state.
function isValidCachedWeather(value: unknown): value is CachedWeather {
  if (!value || typeof value !== "object") return false;
  const v = value as { data?: unknown; timestamp?: unknown };
  if (typeof v.timestamp !== "number" || !v.data || typeof v.data !== "object") return false;
  for (const entry of Object.values(v.data as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object") return false;
    const e = entry as Partial<WeatherData>;
    if (
      typeof e.temperatureC !== "number" ||
      typeof e.temperatureF !== "number" ||
      typeof e.weatherCode !== "number" ||
      typeof e.isDay !== "boolean" ||
      typeof e.emoji !== "string" ||
      typeof e.label !== "string"
    ) {
      return false;
    }
  }
  return true;
}

function loadCache(): CachedWeather | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidCachedWeather(parsed)) return null;
    // SWR semantics: anything within the TTL is served immediately while we
    // refetch in the background. Past the TTL we drop it entirely.
    if (Date.now() - parsed.timestamp > CACHE_TTL) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCache(data: Record<string, WeatherData>) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {}
}

export function useWeather(locations: LocationInput[]) {
  const [weather, setWeather] = useState<Record<string, WeatherData>>({});
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState<"C" | "F">("C");
  const fetchingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stable identity for the location set — only changes when ids/coords actually change.
  // Without this, the regions useMemo upstream re-creates the array every minute even
  // when the inputs haven't changed, causing fetchAll to re-run unnecessarily.
  const locationsKey = locations
    .map((l) => `${l.id}:${l.coordinates[0]},${l.coordinates[1]}`)
    .join("|");

  // Load saved unit preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_UNIT_KEY);
      if (saved === "F" || saved === "C") setUnit(saved);
    } catch {}
  }, []);

  const toggleUnit = useCallback(() => {
    setUnit((prev) => {
      const next = prev === "C" ? "F" : "C";
      try {
        localStorage.setItem(STORAGE_UNIT_KEY, next);
      } catch {}
      return next;
    });
  }, []);

  const fetchAll = useCallback(async (signal?: AbortSignal) => {
    if (fetchingRef.current || locations.length === 0) return;
    fetchingRef.current = true;

    // Fetch all in parallel with small stagger to avoid rate-limiting
    const results: Record<string, WeatherData> = {};
    const batches: Promise<void>[] = locations.map(async (loc) => {
      const data = await fetchWeather(loc.coordinates[0], loc.coordinates[1], signal);
      if (data) results[loc.id] = data;
    });

    try {
      await Promise.all(batches);
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") {
        fetchingRef.current = false;
        return;
      }
    }
    setWeather(results);
    saveCache(results);
    setLoading(false);
    fetchingRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationsKey]);

  // Initial load — try cache first, then defer the network fetch until the
  // browser is idle so it doesn't compete with first-paint work.
  useEffect(() => {
    const controller = new AbortController();
    const cached = loadCache();
    if (cached) {
      setWeather(cached.data);
      setLoading(false);
    }

    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const w = window as IdleWindow;
    let handle: number | ReturnType<typeof setTimeout>;
    if (typeof w.requestIdleCallback === "function") {
      handle = w.requestIdleCallback(() => fetchAll(controller.signal), { timeout: 2000 });
    } else {
      handle = setTimeout(() => fetchAll(controller.signal), 250);
    }
    return () => {
      controller.abort();
      if (typeof handle === "number" && typeof w.cancelIdleCallback === "function") {
        w.cancelIdleCallback(handle);
      } else {
        clearTimeout(handle as ReturnType<typeof setTimeout>);
      }
    };
  }, [fetchAll]);

  // Periodic refresh
  useEffect(() => {
    intervalRef.current = setInterval(fetchAll, REFRESH_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchAll]);

  return { weather, loading, unit, toggleUnit };
}
