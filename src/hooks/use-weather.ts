"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchWeather, type WeatherData } from "@/lib/weather";

interface LocationInput {
  id: string;
  coordinates: [number, number]; // [lat, lon]
}

const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
const STORAGE_KEY = "world-clock-weather-cache";
const STORAGE_UNIT_KEY = "world-clock-temp-unit";

interface CachedWeather {
  data: Record<string, WeatherData>;
  timestamp: number;
}

function loadCache(): CachedWeather | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedWeather;
    if (Date.now() - parsed.timestamp > REFRESH_INTERVAL) return null;
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

  const fetchAll = useCallback(async () => {
    if (fetchingRef.current || locations.length === 0) return;
    fetchingRef.current = true;

    // Fetch all in parallel with small stagger to avoid rate-limiting
    const results: Record<string, WeatherData> = {};
    const batches: Promise<void>[] = locations.map(async (loc) => {
      const data = await fetchWeather(loc.coordinates[0], loc.coordinates[1]);
      if (data) results[loc.id] = data;
    });

    await Promise.all(batches);
    setWeather(results);
    saveCache(results);
    setLoading(false);
    fetchingRef.current = false;
  }, [locations]);

  // Initial load — try cache first, then fetch
  useEffect(() => {
    const cached = loadCache();
    if (cached) {
      setWeather(cached.data);
      setLoading(false);
    }
    fetchAll();
  }, [fetchAll]);

  // Periodic refresh
  useEffect(() => {
    intervalRef.current = setInterval(fetchAll, REFRESH_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchAll]);

  return { weather, loading, unit, toggleUnit };
}
