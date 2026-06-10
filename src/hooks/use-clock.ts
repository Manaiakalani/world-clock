"use client";

import { useSyncExternalStore } from "react";
import { secondStore, minuteStore } from "@/lib/clock-store";

/** Wall-clock Date that updates once per second, shared across all subscribers. */
export function useSecond(): Date {
  return useSyncExternalStore(
    secondStore.subscribe,
    secondStore.getSnapshot,
    secondStore.getServerSnapshot,
  );
}

/** Wall-clock Date that updates once per minute, shared across all subscribers. */
export function useMinute(): Date {
  return useSyncExternalStore(
    minuteStore.subscribe,
    minuteStore.getSnapshot,
    minuteStore.getServerSnapshot,
  );
}
