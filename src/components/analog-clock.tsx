"use client";

import { useMemo, memo } from "react";
import { Region } from "@/data/regions";
import { useCurrentTime } from "@/hooks/use-current-time";
import {
  getRegionHour,
  getRegionMinute,
  getRegionSecond,
  formatTime,
  formatTimeFull,
  getTimezoneAbbr,
} from "@/lib/timezone-utils";

// Round to 2 decimal places to prevent SSR/client hydration mismatches
// from floating-point precision differences between Node.js and the browser
function r(n: number): number {
  return Math.round(n * 100) / 100;
}

interface AnalogClockProps {
  regions: Region[];
  timeOffset?: number;
  localTimezone: string;
  is24h?: boolean;
  className?: string;
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
 * Lay out region avatars on the clock with cluster-aware radial stacking.
 *
 * 1. Compute each region's angular position from its local hour+minute.
 * 2. Group neighbors that fall within `clusterWindowDeg` of each other.
 * 3. Place each cluster along a single radial spoke at the cluster's mean
 *    angle, stacking members from inner to outer radius — like beads on a
 *    string. This matches the iOS Clock convention and prevents the
 *    flag-on-flag overlap that compromises the dial when many cities sit
 *    in the same hour bucket (e.g. Sydney + Tokyo near 5–7).
 *
 * Coordinates are in container percentage space (50,50 = center).
 */
function layoutAvatars(
  regions: Region[],
  now: Date,
): Array<{ region: Region; x: number; y: number; clusterIndex: number; clusterSize: number }> {
  if (regions.length === 0) return [];

  const CLUSTER_WINDOW_DEG = 18;
  // Bands inside the numerals (which now sit at SVG r=74, ≈ container 37%):
  //   center cap → hands → R_BASE (18%) → +R_STEP (26%) → +R_STEP (max 28%) → numerals.
  // Stacked flags within a cluster sit on one spoke, separated by a full chip
  // diameter so they always read as distinct beads — never kissing edges.
  const R_BASE = 18;
  const R_STEP = 8;
  const R_MAX = 28;

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

  // 4. place each cluster along its mean radial spoke
  const placed: Array<{ region: Region; x: number; y: number; clusterIndex: number; clusterSize: number }> = [];
  for (const group of groups) {
    // mean angle, handling wrap-around (the merged wrap-cluster needs care)
    let sum = 0;
    let prev = group[0].angleDeg;
    let acc = prev;
    for (let i = 1; i < group.length; i++) {
      let a = group[i].angleDeg;
      // if this entry is more than 180 below prev, it wrapped — bump it up
      while (a < prev - 180) a += 360;
      acc = a;
      sum += a - group[0].angleDeg;
      prev = acc;
    }
    const meanAngle = group[0].angleDeg + sum / group.length;
    const angleRad = (meanAngle * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    group.forEach((g, i) => {
      const radius = Math.min(R_BASE + i * R_STEP, R_MAX);
      placed.push({
        region: g.region,
        x: r(50 + radius * cos),
        y: r(50 + radius * sin),
        clusterIndex: i,
        clusterSize: group.length,
      });
    });
  }

  return placed;
}

export const AnalogClock = memo(function AnalogClock({
  regions,
  timeOffset = 0,
  localTimezone,
  is24h,
  className,
}: AnalogClockProps) {
  // Self-subscribing second-precision clock — isolates 1s ticks to this component only
  const rawNow = useCurrentTime(1000);
  const now = useMemo(
    () => (timeOffset === 0 ? rawNow : new Date(rawNow.getTime() + timeOffset * 3600000)),
    [rawNow, timeOffset],
  );

  const localHour = getRegionHour(localTimezone, now);
  const localMinute = getRegionMinute(localTimezone, now);
  const localSecond = getRegionSecond(localTimezone, now);

  // Clock hand angles
  const secondAngle = localSecond * 6;
  const minuteAngle = localMinute * 6 + localSecond * 0.1;
  const hourAngle = (localHour % 12) * 30 + localMinute * 0.5;

  // Region positions only need minute precision — skip recomputation on second ticks
  const minuteKey = Math.floor(now.getTime() / 60000);
  const regionPositions = useMemo(() => {
    return layoutAvatars(regions, now).map((p) => ({
      ...p,
      time: formatTime(p.region.timezone, now, is24h),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regions, minuteKey, is24h]);

  return (
    <div className={`relative ${className ?? ""}`} suppressHydrationWarning>
      <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label="Analog clock" suppressHydrationWarning>
        <StaticClockFace />

        {/* Hour hand — thick and tapered */}
        <line
          x1="100" y1="100" x2="100" y2="58"
          className="stroke-foreground"
          strokeWidth="3.5"
          strokeLinecap="round"
          transform={`rotate(${r(hourAngle)}, 100, 100)`}
          style={{ transition: "transform 0.3s ease", willChange: "transform" }}
          suppressHydrationWarning
        />

        {/* Minute hand */}
        <line
          x1="100" y1="100" x2="100" y2="38"
          className="stroke-foreground"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${r(minuteAngle)}, 100, 100)`}
          style={{ transition: "transform 0.1s ease", willChange: "transform" }}
          suppressHydrationWarning
        />

        {/* Second hand */}
        <line
          x1="100" y1="106" x2="100" y2="34"
          stroke="#ef4444"
          strokeWidth="0.9"
          strokeLinecap="round"
          transform={`rotate(${secondAngle}, 100, 100)`}
          style={{ willChange: "transform" }}
          suppressHydrationWarning
        />

        {/* Center cap */}
        <circle cx="100" cy="100" r="3.5" className="fill-foreground" />
        <circle cx="100" cy="100" r="1.5" fill="#ef4444" />
      </svg>

      {/* Region avatars positioned on the clock face */}
      {regionPositions.map(({ region, x, y, time }) => (
        <div
          key={region.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 group"
          style={{ left: `${x}%`, top: `${y}%` }}
          suppressHydrationWarning
        >
          <div
            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full
                        border border-foreground/15 bg-background/90
                        shadow-[0_1px_3px_rgba(0,0,0,0.18)]
                        transition-transform duration-150 hover:scale-110 cursor-default"
            title={`${region.city}: ${time}`}
          >
            <span className="text-[14px] sm:text-base leading-none">
              {region.flag}
            </span>
          </div>
          {/* Tooltip on hover */}
          <div
            className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1
                        whitespace-nowrap rounded-md bg-popover px-2 py-1 text-[10px] font-medium
                        text-popover-foreground shadow-lg opacity-0 transition-opacity
                        group-hover:opacity-100 border border-border"
          >
            <div className="font-semibold">{region.city}</div>
            <div className="text-muted-foreground">{time}</div>
          </div>
        </div>
      ))}

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
