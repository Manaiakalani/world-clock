"use client";

import { useMemo, memo, useEffect, useRef, useState } from "react";
import { Region } from "@/data/regions";
import { useMinute } from "@/hooks/use-clock";
import { secondStore } from "@/lib/clock-store";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  getRegionHour,
  getRegionMinute,
  formatTime,
  formatTimeFull,
  getTimezoneAbbr,
} from "@/lib/timezone-utils";

const DEGREES_PER_SECOND = 6;
/** Length of the escapement-style settle after each one-second step. */
const SECOND_TICK_MS = 140;
/** Snap forward, overshoot a hair, then settle — the motion a real hand makes. */
const SECOND_TICK_EASING = "cubic-bezier(0.34, 1.8, 0.55, 1)";
/** The minute and hour hands move far less often, so they settle more slowly. */
const MINUTE_SETTLE_MS = 320;
/**
 * Timers are allowed to fire a fraction of a millisecond early. Reading the
 * clock slightly ahead of the boundary keeps the hand off the second that has
 * just ended without being perceptible.
 */
const TICK_EPSILON_MS = 25;

// Round to 2 decimal places to prevent SSR/client hydration mismatches
// from floating-point precision differences between Node.js and the browser
function r(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Drive one clock hand straight through the DOM.
 *
 * Keeping the hands off React's update path means the rendered `transform`
 * never changes, which matters for more than performance: a hand whose angle
 * is re-derived on every tick rewinds a whole turn when it passes 12
 * (59 → 0 minutes reads as a 354° sweep backwards). Unwrapping against the
 * last applied angle keeps every move short and in the direction the hand is
 * actually travelling.
 */
function useHand(angle: number, transition: string) {
  const ref = useRef<SVGLineElement | null>(null);
  const applied = useRef(angle);
  const primed = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let next = angle;
    while (next < applied.current - 180) next += 360;
    while (next > applied.current + 180) next -= 360;

    // The first placement reconciles whatever the server rendered with the
    // browser's real clock — that correction should land, not sweep.
    el.style.transition = primed.current ? transition : "";
    el.setAttribute("transform", `rotate(${r(next)}, 100, 100)`);
    applied.current = next;
    primed.current = true;
  }, [angle, transition]);

  return ref;
}

interface AnalogClockProps {
  regions: Region[];
  timeOffset?: number;
  localTimezone: string;
  is24h?: boolean;
  className?: string;
  /** Region id of the active card — highlighted on the dial. */
  activeRegionId?: string | null;
  /** Click handler — proxied through to the matching region. */
  onRegionClick?: (id: string) => void;
}

// Pre-computed static geometry — never changes, rendered once
const TICK_MARKS = Array.from({ length: 60 }, (_, i) => {
  const angleDeg = i * 6 - 90;
  const angleRad = (angleDeg * Math.PI) / 180;
  const isHour = i % 5 === 0;
  const r1 = isHour ? 82 : 85;
  const r2 = 88;
  return {
    key: i,
    x1: r(100 + r1 * Math.cos(angleRad)),
    y1: r(100 + r1 * Math.sin(angleRad)),
    x2: r(100 + r2 * Math.cos(angleRad)),
    y2: r(100 + r2 * Math.sin(angleRad)),
    isHour,
  };
});

const HOUR_NUMBERS = Array.from({ length: 12 }, (_, i) => {
  const num = i + 1;
  const angleDeg = num * 30 - 90;
  const angleRad = (angleDeg * Math.PI) / 180;
  // Just inside the tick ring — present enough to anchor a quick time read.
  const rad = 74;
  return {
    num,
    x: r(100 + rad * Math.cos(angleRad)),
    y: r(100 + rad * Math.sin(angleRad)),
  };
});

// Static SVG elements that never change — extracted to avoid recreating on every tick
const StaticClockFace = memo(function StaticClockFace() {
  return (
    <>
      <circle cx="100" cy="100" r="96" className="fill-background/60" />
      <circle cx="100" cy="100" r="96" fill="none" className="stroke-foreground/15" strokeWidth="1.5" />
      {TICK_MARKS.map((t) => (
        <line
          key={t.key}
          x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          className={t.isHour ? "stroke-foreground/80" : "stroke-muted-foreground/30"}
          strokeWidth={t.isHour ? 1.75 : 0.5}
          strokeLinecap="round"
        />
      ))}
      {HOUR_NUMBERS.map((h) => (
        <text
          key={h.num}
          x={h.x} y={h.y}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground/85 text-[11px] font-semibold"
          style={{ fontFamily: "var(--font-sans)", letterSpacing: "-0.02em" }}
        >
          {h.num}
        </text>
      ))}
    </>
  );
});

/**
 * Lay out region avatars on the clock as one chunky chip per cluster.
 *
 * Production world-clock UIs (iOS Clock and the React community repos
 * surveyed for this project) never overlay multiple labels on a single
 * shared analog face — they give each city its own mini-dial. We keep the
 * shared-dial concept as a feature but compress same-hour cities into a
 * single chip with an overflow badge ("+2") so one clear flag stands in
 * for the whole cluster. Clicking a card adds a ring to the matching chip
 * so the dial echoes the selection.
 *
 * Coordinates are in container percentage space (50,50 = center).
 */
function layoutAvatars(
  regions: Region[],
  now: Date,
): Array<{ regions: Region[]; x: number; y: number }> {
  if (regions.length === 0) return [];

  const CLUSTER_WINDOW_DEG = 14;
  const RADIUS = 25; // single ring just inside the numerals (SVG r=74 ≈ 37%)

  // 1. compute each region's preferred angle
  const items = regions.map((region) => {
    const hour = getRegionHour(region.timezone, now);
    const minute = getRegionMinute(region.timezone, now);
    // 0° = top (12 o'clock). Hours sweep clockwise.
    const angleDeg = (((hour % 12) + minute / 60) * 30 - 90 + 360) % 360;
    return { region, angleDeg };
  });

  // 2. sort by angle so adjacent items in the list are adjacent on the dial
  items.sort((a, b) => a.angleDeg - b.angleDeg);

  // 3. group neighbors within the cluster window
  type Group = typeof items;
  const groups: Group[] = [];
  for (const it of items) {
    const last = groups[groups.length - 1];
    if (last && it.angleDeg - last[last.length - 1].angleDeg < CLUSTER_WINDOW_DEG) {
      last.push(it);
    } else {
      groups.push([it]);
    }
  }
  // Wrap: merge the last group with the first if they're close across midnight
  if (groups.length > 1) {
    const first = groups[0];
    const last = groups[groups.length - 1];
    const wrapGap = first[0].angleDeg + 360 - last[last.length - 1].angleDeg;
    if (wrapGap < CLUSTER_WINDOW_DEG) {
      groups[0] = [...last, ...first];
      groups.pop();
    }
  }

  // 4. place each cluster as one chip at the cluster's mean angle
  return groups.map((group) => {
    let prev = group[0].angleDeg;
    let sum = 0;
    for (let i = 1; i < group.length; i++) {
      let a = group[i].angleDeg;
      while (a < prev - 180) a += 360;
      sum += a - group[0].angleDeg;
      prev = a;
    }
    const meanAngle = group[0].angleDeg + sum / group.length;
    const angleRad = (meanAngle * Math.PI) / 180;
    return {
      regions: group.map((g) => g.region),
      x: r(50 + RADIUS * Math.cos(angleRad)),
      y: r(50 + RADIUS * Math.sin(angleRad)),
    };
  });
}

export const AnalogClock = memo(function AnalogClock({
  regions,
  timeOffset = 0,
  localTimezone,
  is24h,
  className,
  activeRegionId,
  onRegionClick,
}: AnalogClockProps) {
  // Subscribe only to minute precision — hour/minute hands and cluster layout
  // never need sub-minute updates. The second hand below steps once per second
  // straight through the DOM, so it never triggers React reconciliation.
  const rawNow = useMinute();
  const now = useMemo(
    () => (timeOffset === 0 ? rawNow : new Date(rawNow.getTime() + timeOffset * 3600000)),
    [rawNow, timeOffset],
  );
  const prefersReducedMotion = usePrefersReducedMotion();

  const localHour = getRegionHour(localTimezone, now);
  const localMinute = getRegionMinute(localTimezone, now);

  // Every hand shares one motion language: a step, then a short settle. Reduced
  // motion keeps the steps and drops the settle.
  const settle = prefersReducedMotion
    ? ""
    : `transform ${SECOND_TICK_MS}ms ${SECOND_TICK_EASING}`;
  const minuteSettle = prefersReducedMotion
    ? ""
    : `transform ${MINUTE_SETTLE_MS}ms ${SECOND_TICK_EASING}`;

  const hourHandRef = useHand((localHour % 12) * 30 + localMinute * 0.5, minuteSettle);
  const minuteHandRef = useHand(localMinute * 6, minuteSettle);

  // The hands are positioned from effects, so the markup carries only the angle
  // at first render — enough for the server to draw a correct clock, and frozen
  // afterwards so React never fights the effect for the attribute.
  const [initialHands] = useState(() => ({
    hour: `rotate(${r((localHour % 12) * 30 + localMinute * 0.5)}, 100, 100)`,
    minute: `rotate(${r(localMinute * 6)}, 100, 100)`,
  }));

  // Second hand: a deadbeat tick, not a continuous sweep.
  //
  // A smooth 60 fps sweep never lets the hand rest, so there is no rhythm to
  // read the dial against and the clock feels like it is racing even though it
  // is keeping perfect time. One crisp step per second with a short settle
  // reads as calm and deliberate — and it costs one DOM write a second instead
  // of sixty, off the shared drift-free second store rather than its own rAF
  // loop (which also means it pauses with the rest of the clock in a hidden
  // tab).
  const secondHandRef = useRef<SVGLineElement | null>(null);
  useEffect(() => {
    const el = secondHandRef.current;
    if (!el) return;

    const offsetMs = timeOffset * 3600000;
    const currentSecond = () =>
      Math.floor((Date.now() + offsetMs + TICK_EPSILON_MS) / 1000) % 60;

    // Reduced motion still ticks — it just lands without the settle.
    let angle = currentSecond() * DEGREES_PER_SECOND;
    const paint = (next: number, animated: boolean) => {
      el.style.transition = animated ? settle : "";
      el.setAttribute("transform", `rotate(${next}, 100, 100)`);
      angle = next;
    };
    paint(angle, false);

    const tick = () => {
      // Fold a completed revolution away. rotate(360) and rotate(0) render
      // identically, so an untransitioned reset is invisible — but it has to be
      // flushed, or the browser coalesces it with the step below and animates
      // the long way round.
      if (angle >= 360) {
        paint(angle - 360, false);
        el.getBoundingClientRect();
      }

      let next = currentSecond() * DEGREES_PER_SECOND;
      while (next < angle) next += 360;
      // Animate an ordinary one-second step; anything larger (a tab catching up
      // after being hidden, a system clock change) snaps, so the hand is never
      // seen scrubbing to catch the truth.
      paint(next, next - angle === DEGREES_PER_SECOND);
    };

    return secondStore.subscribe(tick);
  }, [timeOffset, settle]);

  // Region positions only need minute precision — re-runs only when minute or regions change.
  const clusters = useMemo(
    () => layoutAvatars(regions, now),
    [regions, now],
  );

  return (
    <div className={`relative ${className ?? ""}`} suppressHydrationWarning>
      <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label="Analog clock" suppressHydrationWarning>
        <StaticClockFace />

        {/* Hour hand — thick and tapered */}
        <line
          ref={hourHandRef}
          x1="100" y1="100" x2="100" y2="58"
          className="stroke-foreground"
          strokeWidth="3.5"
          strokeLinecap="round"
          transform={initialHands.hour}
          style={{ willChange: "transform" }}
          suppressHydrationWarning
        />

        {/* Minute hand — steps once a minute with the same settle as the seconds */}
        <line
          ref={minuteHandRef}
          x1="100" y1="100" x2="100" y2="38"
          className="stroke-foreground"
          strokeWidth="2"
          strokeLinecap="round"
          transform={initialHands.minute}
          style={{ willChange: "transform" }}
          suppressHydrationWarning
        />

        {/* Second hand — stepped once a second by direct DOM mutation (no React re-renders) */}
        <line
          ref={secondHandRef}
          x1="100" y1="106" x2="100" y2="34"
          stroke="#ef4444"
          strokeWidth="0.9"
          strokeLinecap="round"
          style={{ willChange: "transform" }}
          suppressHydrationWarning
        />

        {/* Center cap */}
        <circle cx="100" cy="100" r="3.5" className="fill-foreground" />
        <circle cx="100" cy="100" r="1.5" fill="#ef4444" />
      </svg>

      {/* Region avatars — one chip per cluster with an overflow badge */}
      {clusters.map(({ regions: cluster, x, y }) => {
        // Pick a representative: the active region if it's in this cluster,
        // otherwise the first one (already sorted by angle).
        const activeMatch = activeRegionId ? cluster.find((r) => r.id === activeRegionId) : undefined;
        const lead = activeMatch ?? cluster[0];
        const overflow = cluster.length - 1;
        const isActiveCluster = !!activeMatch;
        const labels = cluster.map((r) => r.city).join(" · ");

        return (
          <button
            key={lead.id}
            type="button"
            onClick={onRegionClick ? () => onRegionClick(lead.id) : undefined}
            className={`absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none ${onRegionClick ? "cursor-pointer" : "cursor-default"}`}
            style={{ left: `${x}%`, top: `${y}%` }}
            aria-label={labels}
            title={labels}
            suppressHydrationWarning
          >
            <div
              className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center
                          rounded-full bg-background/95 shadow-[0_1px_4px_rgba(0,0,0,0.25)]
                          transition-transform duration-150 group-hover:scale-110
                          ${isActiveCluster
                            ? "ring-2 ring-ring border border-transparent"
                            : "border border-foreground/20"}`}
            >
              <span className="text-[15px] sm:text-base leading-none">{lead.flag}</span>
              {overflow > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center
                              rounded-full bg-foreground px-1 text-[8px] font-bold leading-none text-background
                              shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                  aria-hidden="true"
                >
                  +{overflow}
                </span>
              )}
            </div>
            {/* Tooltip on hover — lists all cities in the cluster */}
            <div
              className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5
                          whitespace-nowrap rounded-md bg-popover px-2 py-1 text-[10px] font-medium
                          text-popover-foreground shadow-lg opacity-0 transition-opacity
                          group-hover:opacity-100 border border-border z-10"
            >
              {cluster.map((r) => (
                <div key={r.id} className="flex items-center gap-1.5">
                  <span>{r.flag}</span>
                  <span className="font-semibold">{r.city}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatTime(r.timezone, now, is24h)}
                  </span>
                </div>
              ))}
            </div>
          </button>
        );
      })}

      {/* Digital time display */}
      <p className="mt-3 text-center font-mono text-sm sm:text-base font-bold tabular-nums tracking-widest" aria-live="polite" aria-atomic="true" suppressHydrationWarning>
        {formatTimeFull(localTimezone, now, is24h)}
        <span className="ml-1.5 text-[10px] sm:text-xs font-semibold text-muted-foreground/70 tracking-normal">
          {getTimezoneAbbr(localTimezone, now)}
        </span>
      </p>
    </div>
  );
});
