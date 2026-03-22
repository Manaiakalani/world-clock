"use client";

import { useState, useEffect, useCallback } from "react";
import { DEFAULT_TIMEZONES } from "@/data/timezone-data";

const STORAGE_KEY = "world-clock-active-timezones";
const URL_PARAM = "zones";

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

function readFromStorage(): string[] {
  if (typeof window === "undefined") return DEFAULT_TIMEZONES;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_TIMEZONES;
}

function writeToStorage(timezones: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timezones));
  } catch {}
}

export function useActiveTimezones() {
  const [activeTimezones, setActiveTimezones] = useState<string[]>(DEFAULT_TIMEZONES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fromUrl = readFromUrlParams();
    if (fromUrl) {
      setActiveTimezones(fromUrl);
      writeToStorage(fromUrl);
    } else {
      setActiveTimezones(readFromStorage());
    }
    setLoaded(true);
  }, []);

  const toggle = useCallback((tz: string) => {
    setActiveTimezones((prev) => {
      const next = prev.includes(tz)
        ? prev.filter((t) => t !== tz)
        : [...prev, tz];
      writeToStorage(next);
      return next;
    });
  }, []);

  const isActive = useCallback(
    (tz: string) => activeTimezones.includes(tz),
    [activeTimezones]
  );

  const setTimezones = useCallback((tzs: string[]) => {
    setActiveTimezones(tzs);
    writeToStorage(tzs);
  }, []);

  const getShareUrl = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set(URL_PARAM, activeTimezones.join(","));
    return url.toString();
  }, [activeTimezones]);

  return { activeTimezones, toggle, isActive, loaded, getShareUrl, setTimezones };
}
