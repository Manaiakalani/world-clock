"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const EASING = "cubic-bezier(0.23, 1, 0.32, 1)";
const MIN_OFFSET = -12;
const MAX_OFFSET = 12;
const TICK_HOURS = [MIN_OFFSET, -9, -6, -3, 0, 3, 6, 9, MAX_OFFSET];

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function formatOffset(h: number): string {
  if (h === 0) return "Now";
  const sign = h > 0 ? "+" : "";
  return `${sign}${h}h`;
}

export function TimeSlider({
  offsetHours,
  onOffsetChange,
  className,
}: {
  offsetHours: number;
  onOffsetChange: (h: number) => void;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Convert offset → fraction [0,1] along the track
  const fraction = (offsetHours - MIN_OFFSET) / (MAX_OFFSET - MIN_OFFSET);

  const offsetFromPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return offsetHours;
      const rect = track.getBoundingClientRect();
      const pct = clamp((clientX - rect.left) / rect.width, 0, 1);
      const raw = MIN_OFFSET + pct * (MAX_OFFSET - MIN_OFFSET);
      return Math.round(raw);
    },
    [offsetHours],
  );

  // --- Pointer drag ---
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setIsDragging(true);
      onOffsetChange(offsetFromPointer(e.clientX));
    },
    [offsetFromPointer, onOffsetChange],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      onOffsetChange(offsetFromPointer(e.clientX));
    },
    [isDragging, offsetFromPointer, onOffsetChange],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // --- Keyboard ---
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let step = 0;
      if (e.key === "ArrowLeft") step = e.shiftKey ? -6 : -1;
      else if (e.key === "ArrowRight") step = e.shiftKey ? 6 : 1;
      if (step !== 0) {
        e.preventDefault();
        e.stopPropagation();
        onOffsetChange(clamp(offsetHours + step, MIN_OFFSET, MAX_OFFSET));
      }
    },
    [offsetHours, onOffsetChange],
  );

  // Auto-focus the track when mounted so keyboard works immediately
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-border bg-background/85 px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {/* Offset label */}
      <span
        className={cn(
          "shrink-0 min-w-[3.5rem] text-center font-mono text-sm font-bold tabular-nums transition-colors duration-200",
          offsetHours === 0 ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {formatOffset(offsetHours)}
      </span>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative flex-1 h-8 cursor-pointer touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Rail background */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-muted/40" />

        {/* Center marker (now line) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-px h-4 bg-muted-foreground/40"
          style={{ left: "50%" }}
        />

        {/* Fill from center to thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-primary/50"
          style={{
            left: fraction < 0.5 ? `${fraction * 100}%` : "50%",
            right: fraction >= 0.5 ? `${(1 - fraction) * 100}%` : "50%",
          }}
        />

        {/* Hour tick labels */}
        {TICK_HOURS.map((h) => {
          const pct = ((h - MIN_OFFSET) / (MAX_OFFSET - MIN_OFFSET)) * 100;
          return (
            <span
              key={h}
              className={cn(
                "absolute bottom-0 -translate-x-1/2 text-[9px] tabular-nums leading-none select-none pointer-events-none",
                h === 0
                  ? "font-semibold text-muted-foreground"
                  : "text-muted-foreground/50",
              )}
              style={{ left: `${pct}%` }}
            >
              {h === 0 ? "now" : formatOffset(h)}
            </span>
          );
        })}

        {/* Thumb */}
        <div
          className={cn(
            "slider-thumb absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 border-primary bg-background shadow-md",
            "transition-[box-shadow,transform] duration-200",
            isDragging && "shadow-lg ring-2 ring-primary/30 scale-110",
          )}
          style={{
            left: `${fraction * 100}%`,
            transitionTimingFunction: EASING,
          }}
        />
      </div>

      {/* Now button */}
      <button
        onClick={() => onOffsetChange(0)}
        disabled={offsetHours === 0}
        className={cn(
          "shrink-0 rounded-lg border border-border px-2 py-1 text-xs font-semibold",
          "bg-background/60 transition-[transform,opacity,background-color] duration-160 active:scale-[0.95]",
          offsetHours === 0
            ? "opacity-40 cursor-default"
            : "hover:bg-accent cursor-pointer",
        )}
        style={{ transitionTimingFunction: EASING }}
      >
        Now
      </button>
    </div>
  );
}
