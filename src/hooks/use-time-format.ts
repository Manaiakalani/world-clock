"use client";

import { useCallback } from "react";
import { useLocalStorageState } from "./use-local-storage-state";

type TimeFormat = "12h" | "24h";

const STORAGE_KEY = "world-clock-time-format";

const parseFormat = (raw: string): TimeFormat =>
  raw === "24h" ? "24h" : "12h";
const serializeFormat = (v: TimeFormat) => v;

export function useTimeFormat() {
  const [format, setFormat] = useLocalStorageState<TimeFormat>(
    STORAGE_KEY,
    "12h",
    parseFormat,
    serializeFormat,
  );

  const toggle = useCallback(() => {
    setFormat((prev) => (prev === "12h" ? "24h" : "12h"));
  }, [setFormat]);

  return { format, toggle, is24h: format === "24h" };
}
