"use client";

import { memo, useMemo } from "react";

interface RegionCardDialProps {
  /** 0..24, fractional hour in the region's local time. */
  hour: number;
  /** Local sunrise hour (0..24). Defaults to 6 if omitted. */
  sunriseHour?: number;
  /** Local sunset hour (0..24). Defaults to 18 if omitted. */
  sunsetHour?: number;
  /** Pixel size of the dial (square). */
  size?: number;
  /** Optional class to overlay on the SVG. */
  className?: string;
}

const TAU = Math.PI * 2;

/**
 * Convert a 0..24 hour to an SVG arc point on a unit circle centered at (cx, cy),
 * with hour 0 (midnight) at the top and rotating clockwise.
 */
function hourToPoint(hour: number, cx: number, cy: number, r: number) {
  const angle = (hour / 24) * TAU - Math.PI / 2;
  return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as const;
}

/** Build an SVG arc path between two hours along a circle (clockwise). */
function buildArc(fromHour: number, toHour: number, cx: number, cy: number, r: number): string {
  const [x1, y1] = hourToPoint(fromHour, cx, cy, r);
  const [x2, y2] = hourToPoint(toHour, cx, cy, r);
  let span = toHour - fromHour;
  if (span <= 0) span += 24;
  const largeArc = span > 12 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

/**
 * Circular day/night dial — a 24-hour ring with the day arc (sunrise→sunset)
 * highlighted and a sun/moon indicator at the current local hour.
 *
 * Designed for region cards: small, glanceable, no text — pure visualization.
 */
export const RegionCardDial = memo(function RegionCardDial({
  hour,
  sunriseHour = 6,
  sunsetHour = 18,
  size = 72,
  className,
}: RegionCardDialProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  const dayArc = useMemo(() => buildArc(sunriseHour, sunsetHour, cx, cy, r), [sunriseHour, sunsetHour, cx, cy, r]);
  const nightArc = useMemo(() => buildArc(sunsetHour, sunriseHour, cx, cy, r), [sunriseHour, sunsetHour, cx, cy, r]);

  const [pipX, pipY] = useMemo(() => hourToPoint(hour, cx, cy, r), [hour, cx, cy, r]);

  // Is the current moment within daylight? Handles wrap-around.
  const isDay = useMemo(() => {
    if (sunriseHour < sunsetHour) return hour >= sunriseHour && hour < sunsetHour;
    return hour >= sunriseHour || hour < sunsetHour;
  }, [hour, sunriseHour, sunsetHour]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-hidden="true"
    >
      {/* Subtle inner disc — gives the dial weight against the gradient */}
      <circle cx={cx} cy={cy} r={r - 1} fill="rgba(0,0,0,0.18)" />

      {/* Night arc — soft, recedes */}
      <path
        d={nightArc}
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* Day arc — brighter, leads the eye */}
      <path
        d={dayArc}
        fill="none"
        stroke="rgba(255,255,255,0.65)"
        strokeWidth={2.5}
        strokeLinecap="round"
      />

      {/* Hour ticks at 6 / 12 / 18 */}
      {[6, 12, 18].map((h) => {
        const [tx, ty] = hourToPoint(h, cx, cy, r);
        return (
          <circle key={h} cx={tx} cy={ty} r={1.1} fill="rgba(255,255,255,0.55)" />
        );
      })}

      {/* Horizon line — divides the dial visually */}
      <line
        x1={cx - r * 0.85}
        y1={cy}
        x2={cx + r * 0.85}
        y2={cy}
        stroke="rgba(255,255,255,0.10)"
        strokeWidth={0.75}
      />

      {/* Current-time pip — sun or moon */}
      <g transform={`translate(${pipX}, ${pipY})`}>
        <circle
          r={isDay ? 5 : 4.5}
          fill={isDay ? "#fde68a" : "#e5e7eb"}
          stroke="rgba(0,0,0,0.35)"
          strokeWidth={0.5}
        />
        {isDay ? (
          // Sun rays
          <g stroke="#fde68a" strokeWidth={1} strokeLinecap="round" opacity={0.85}>
            <line x1={0} y1={-7.5} x2={0} y2={-9.5} />
            <line x1={0} y1={7.5} x2={0} y2={9.5} />
            <line x1={-7.5} y1={0} x2={-9.5} y2={0} />
            <line x1={7.5} y1={0} x2={9.5} y2={0} />
          </g>
        ) : (
          // Moon crescent — small offset circle to carve out the shape
          <circle r={3.2} cx={1.4} cy={-0.6} fill="rgba(0,0,0,0.55)" />
        )}
      </g>
    </svg>
  );
});
