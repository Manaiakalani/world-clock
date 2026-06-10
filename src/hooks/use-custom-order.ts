"use client";

import { useCallback } from "react";
import { useLocalStorageState } from "./use-local-storage-state";

const STORAGE_KEY = "world-clock-custom-order";

const parseBool = (raw: string) => raw === "true";
const serializeBool = (v: boolean) => String(v);

export function useCustomOrder() {
  const [customOrder, setCustomOrder] = useLocalStorageState(
    STORAGE_KEY,
    false,
    parseBool,
    serializeBool,
  );

  const toggleCustomOrder = useCallback(() => {
    setCustomOrder((prev) => !prev);
  }, [setCustomOrder]);

  return { customOrder, toggleCustomOrder };
}
