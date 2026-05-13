"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "world-clock-custom-order";

function readOrder(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeOrder(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {}
}

export function useCustomOrder() {
  const [customOrder, setCustomOrder] = useState(false);

  useEffect(() => {
    setCustomOrder(readOrder());
  }, []);

  const toggleCustomOrder = useCallback(() => {
    setCustomOrder((prev) => {
      const next = !prev;
      writeOrder(next);
      return next;
    });
  }, []);

  return { customOrder, toggleCustomOrder };
}
