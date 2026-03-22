"use client";

import { useState, useCallback, useEffect } from "react";

type TimeFormat = "12h" | "24h";

const STORAGE_KEY = "world-clock-time-format";

export function useTimeFormat() {
  const [format, setFormat] = useState<TimeFormat>("12h");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "12h" || stored === "24h") {
      setFormat(stored);
    }
  }, []);

  const toggle = useCallback(() => {
    setFormat((prev) => {
      const next = prev === "12h" ? "24h" : "12h";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { format, toggle, is24h: format === "24h" };
}
