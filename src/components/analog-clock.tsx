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
  const r1 = isHour ? 68 : 72;
  const r2 = 76;
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
  const rad = 84;
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
      <circle cx="100" cy="100" r="96" fill="none" className="stroke-foreground/20" strokeWidth="2" />
      {TICK_MARKS.map((t) => (
        <line
          key={t.key}
          x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          className={t.isHour ? "stroke-foreground" : "stroke-muted-foreground/40"}
          strokeWidth={t.isHour ? 2.5 : 0.75}
          strokeLinecap="round"
        />
      ))}
      {HOUR_NUMBERS.map((h) => (
        <text
          key={h.num}
          x={h.x} y={h.y}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground text-[15px] font-extrabold"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {h.num}
        </text>
      ))}
    </>
  );
});

export function AnalogClock({
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

  // Position region avatars on the clock face at their hour
  const regionPositions = useMemo(() => {
    return regions.map((region) => {
      const hour = getRegionHour(region.timezone, now);
      const minute = getRegionMinute(region.timezone, now);
      const angleDeg = ((hour % 12) + minute / 60) * 30 - 90;
      const angleRad = (angleDeg * Math.PI) / 180;
      const radius = 28;
      return {
        region,
        x: r(50 + radius * Math.cos(angleRad)),
        y: r(50 + radius * Math.sin(angleRad)),
        time: formatTime(region.timezone, now, is24h),
      };
    });
  }, [regions, now, is24h]);

  return (
    <div className={`relative ${className ?? ""}`} suppressHydrationWarning>
      <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label="Analog clock" suppressHydrationWarning>
        <StaticClockFace />

        {/* Hour hand — thick and tapered */}
        <line
          x1="100" y1="100" x2="100" y2="44"
          className="stroke-foreground"
          strokeWidth="4.5"
          strokeLinecap="round"
          transform={`rotate(${r(hourAngle)}, 100, 100)`}
          style={{ transition: "transform 0.3s ease" }}
          suppressHydrationWarning
        />

        {/* Minute hand */}
        <line
          x1="100" y1="100" x2="100" y2="28"
          className="stroke-foreground"
          strokeWidth="2.5"
          strokeLinecap="round"
          transform={`rotate(${r(minuteAngle)}, 100, 100)`}
          style={{ transition: "transform 0.1s ease" }}
          suppressHydrationWarning
        />

        {/* Second hand */}
        <line
          x1="100" y1="112" x2="100" y2="24"
          stroke="#ef4444"
          strokeWidth="1.2"
          strokeLinecap="round"
          transform={`rotate(${secondAngle}, 100, 100)`}
          suppressHydrationWarning
        />

        {/* Center cap */}
        <circle cx="100" cy="100" r="4" className="fill-foreground" />
        <circle cx="100" cy="100" r="2" fill="#ef4444" />
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
            className="flex h-7 w-7 items-center justify-center rounded-full border-2
                        border-muted-foreground/30 bg-muted/80 backdrop-blur-sm
                        shadow-md transition-transform hover:scale-125 cursor-default"
            title={`${region.city}: ${time}`}
          >
            <span className="text-sm leading-none">
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
      <p className="mt-1 text-center font-mono text-sm sm:text-base font-bold tabular-nums tracking-widest" aria-live="polite" aria-atomic="true" suppressHydrationWarning>
        {formatTimeFull(localTimezone, now, is24h)}
        <span className="ml-1.5 text-[10px] sm:text-xs font-semibold text-muted-foreground/70 tracking-normal">
          {getTimezoneAbbr(localTimezone, now)}
        </span>
      </p>
    </div>
  );
}
