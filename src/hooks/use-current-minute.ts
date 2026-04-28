"use client";

import { useState, useEffect } from "react";

/**
 * Returns a Date that only changes when the wall-clock minute rolls over.
 * Use this for any UI that doesn't need second precision (region cards,
 * weather, sky gradients, panel chrome) — it cuts re-renders by ~98%
 * compared to a 1s tick.
 */
export function useCurrentMinute(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;

    function schedule() {
      const d = new Date();
      const msUntilNextMinute =
        (60 - d.getSeconds()) * 1000 - d.getMilliseconds();

      timeout = setTimeout(() => {
        setNow(new Date());
        interval = setInterval(() => setNow(new Date()), 60_000);
      }, msUntilNextMinute);
    }

    schedule();
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return now;
}
