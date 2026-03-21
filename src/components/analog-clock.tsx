"use client";

import { useMemo } from "react";
import { Region } from "@/data/regions";
import {
  getRegionHour,
  getRegionMinute,
  getRegionSecond,
  formatTime,
} from "@/lib/timezone-utils";

interface AnalogClockProps {
  regions: Region[];
  now: Date;
  localTimezone: string;
  className?: string;
}

export function AnalogClock({
  regions,
  now,
  localTimezone,
  className,
}: AnalogClockProps) {
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
      const radius = 38; // % from center
      return {
        region,
        x: 50 + radius * Math.cos(angleRad),
        y: 50 + radius * Math.sin(angleRad),
        time: formatTime(region.timezone, now),
        hour,
      };
    });
  }, [regions, now]);

  return (
    <div className={`relative ${className ?? ""}`}>
      <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label="Analog clock">
        {/* Clock face */}
        <circle
          cx="100"
          cy="100"
          r="95"
          fill="none"
          className="stroke-border"
          strokeWidth="1"
        />

        {/* Working hours arc (9-5) */}
        <path
          d={describeArc(100, 100, 90, (9 * 30) - 90, (17 * 30) - 90)}
          fill="none"
          stroke="currentColor"
          className="text-primary/8"
          strokeWidth="18"
          strokeLinecap="round"
        />

        {/* Hour numbers 1-12 */}
        {Array.from({ length: 12 }, (_, i) => {
          const num = i + 1;
          const angleDeg = num * 30 - 90;
          const angleRad = (angleDeg * Math.PI) / 180;
          const r = 82;
          const x = 100 + r * Math.cos(angleRad);
          const y = 100 + r * Math.sin(angleRad);
          return (
            <text
              key={num}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-foreground text-[13px] font-semibold"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {num}
            </text>
          );
        })}

        {/* Tick marks */}
        {Array.from({ length: 60 }, (_, i) => {
          const angleDeg = i * 6 - 90;
          const angleRad = (angleDeg * Math.PI) / 180;
          const isHour = i % 5 === 0;
          const r1 = isHour ? 70 : 73;
          const r2 = 76;
          return (
            <line
              key={i}
              x1={100 + r1 * Math.cos(angleRad)}
              y1={100 + r1 * Math.sin(angleRad)}
              x2={100 + r2 * Math.cos(angleRad)}
              y2={100 + r2 * Math.sin(angleRad)}
              className={isHour ? "stroke-foreground" : "stroke-muted-foreground/40"}
              strokeWidth={isHour ? 1.5 : 0.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* Hour hand */}
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="48"
          className="stroke-foreground"
          strokeWidth="3.5"
          strokeLinecap="round"
          transform={`rotate(${hourAngle}, 100, 100)`}
          style={{ transition: "transform 0.3s ease" }}
        />

        {/* Minute hand */}
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="32"
          className="stroke-foreground"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${minuteAngle}, 100, 100)`}
          style={{ transition: "transform 0.1s ease" }}
        />

        {/* Second hand */}
        <line
          x1="100"
          y1="115"
          x2="100"
          y2="28"
          stroke="#ef4444"
          strokeWidth="1"
          strokeLinecap="round"
          transform={`rotate(${secondAngle}, 100, 100)`}
        />

        {/* Center dot */}
        <circle cx="100" cy="100" r="3" className="fill-foreground" />
        <circle cx="100" cy="100" r="1.5" fill="#ef4444" />
      </svg>

      {/* Region avatars positioned on the clock face */}
      {regionPositions.map(({ region, x, y, time, hour }) => (
        <div
          key={region.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 group"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs
                        shadow-md transition-transform hover:scale-125 cursor-default
                        ${hour >= 9 && hour < 17
                          ? "border-green-400 bg-green-500/20"
                          : "border-muted-foreground/30 bg-muted"
                        }`}
            title={`${region.city}: ${time}`}
          >
            <span className="text-[10px] leading-none">{region.emoji}</span>
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
    </div>
  );
}

// SVG arc helper
function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number
) {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}
