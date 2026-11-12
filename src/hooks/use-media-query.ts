"use client";

import { useSyncExternalStore } from "react";

/**
 * Subscribes to a media query. The server snapshot is false so the first
 * client render matches SSR; `useSyncExternalStore` then corrects it.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onStoreChange);
      return () => media.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
