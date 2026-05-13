"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "world-clock-dev-mode";

export function useDevMode(): { devMode: boolean; toggleDevMode: () => void } {
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setDevMode(true);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const toggleDevMode = useCallback(() => {
    setDevMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // localStorage unavailable
      }
      return next;
    });
  }, []);

  return { devMode, toggleDevMode };
}
