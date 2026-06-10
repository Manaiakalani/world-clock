"use client";

import { useCallback } from "react";
import { useLocalStorageState } from "./use-local-storage-state";

const STORAGE_KEY = "world-clock-dev-mode";

const parseBool = (raw: string) => raw === "true";
const serializeBool = (v: boolean) => String(v);

export function useDevMode(): { devMode: boolean; toggleDevMode: () => void } {
  const [devMode, setDevMode] = useLocalStorageState(
    STORAGE_KEY,
    false,
    parseBool,
    serializeBool,
  );

  const toggleDevMode = useCallback(() => {
    setDevMode((prev) => !prev);
  }, [setDevMode]);

  return { devMode, toggleDevMode };
}
