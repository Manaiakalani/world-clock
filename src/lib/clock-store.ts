/**
 * Shared, drift-free wall-clock stores. One timer per precision is shared
 * across every subscriber — instead of N components each running their own
 * setInterval, we run a single setTimeout aligned to the next wall-clock
 * boundary and notify all subscribers.
 *
 * Pauses while the tab is hidden (no point re-rendering invisible UI) and
 * resumes on `visibilitychange`. Timer only runs while there is at least
 * one subscriber.
 */

type Precision = "second" | "minute";

class ClockStore {
  private readonly intervalMs: number;
  private listeners = new Set<() => void>();
  private snapshot: Date = new Date();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private visibilityBound = false;

  constructor(precision: Precision) {
    this.intervalMs = precision === "second" ? 1000 : 60_000;
  }

  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    if (this.listeners.size === 1) {
      this.start();
    }
    return () => {
      this.listeners.delete(cb);
      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  };

  getSnapshot = (): Date => this.snapshot;

  getServerSnapshot = (): Date => this.snapshot;

  private start() {
    // Refresh snapshot on (re)start so the first read after a long pause is current.
    this.snapshot = new Date();
    this.bindVisibility();
    if (typeof document !== "undefined" && document.hidden) {
      return;
    }
    this.schedule();
  }

  private stop() {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private schedule = () => {
    const delay = this.intervalMs - (Date.now() % this.intervalMs);
    this.timer = setTimeout(this.tick, delay);
  };

  private tick = () => {
    this.timer = null;
    this.snapshot = new Date();
    // Snapshot listeners to avoid issues with concurrent unsubscribe.
    for (const cb of Array.from(this.listeners)) cb();
    if (this.listeners.size > 0 && !(typeof document !== "undefined" && document.hidden)) {
      this.schedule();
    }
  };

  private bindVisibility() {
    if (this.visibilityBound || typeof document === "undefined") return;
    this.visibilityBound = true;
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.stop();
      } else if (this.listeners.size > 0) {
        // Resume: refresh snapshot, notify, and re-arm.
        this.snapshot = new Date();
        for (const cb of Array.from(this.listeners)) cb();
        this.schedule();
      }
    });
  }
}

export const secondStore = new ClockStore("second");
export const minuteStore = new ClockStore("minute");
