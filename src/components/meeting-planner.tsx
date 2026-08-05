"use client";

import { useMemo } from "react";
import { Region } from "@/data/regions";
import { getRegionTimeParts } from "@/lib/timezone-utils";
import { X } from "lucide-react";

interface MeetingPlannerProps {
  regions: Region[];
  now: Date;
  onClose: () => void;
  instant?: boolean;
}

const SLOT_COUNT = 24;
const HOURS_BEFORE_NOW = 6;
const WORK_START = 9;
const WORK_END = 17; // exclusive

export function MeetingPlanner({ regions, now, onClose, instant }: MeetingPlannerProps) {
  const { slots, regionRows, overlap, currentSlot } = useMemo(() => {
    // Real instants rather than integer hour offsets. Evaluating each region's
    // wall time at an actual Date is the only way to stay correct for sub-hour
    // zones (+05:45 Kathmandu, +08:45 Eucla, +12:45 Chatham) and across DST.
    const base = new Date(now);
    base.setMinutes(0, 0, 0);
    base.setHours(base.getHours() - HOURS_BEFORE_NOW);

    const slots = Array.from(
      { length: SLOT_COUNT },
      (_, i) => new Date(base.getTime() + i * 3600000)
    );

    const regionRows = regions.map((region) => {
      const cells = slots.map((slot) => {
        const { hour, minute } = getRegionTimeParts(region.timezone, slot);
        return {
          hour,
          minute,
          working: hour >= WORK_START && hour < WORK_END,
        };
      });
      return { region, cells };
    });

    // An empty selection has no overlap. Array.every() on an empty array is
    // vacuously true, which used to advertise a 24h overlap across zero regions.
    const overlap = slots.map((_, i) =>
      regionRows.length > 0 && regionRows.every((r) => r.cells[i].working)
    );

    const currentSlot = Math.floor((now.getTime() - base.getTime()) / 3600000);

    return { slots, regionRows, overlap, currentSlot };
  }, [regions, now]);

  const overlapCount = overlap.filter(Boolean).length;

  return (
    <div className={`flex h-full flex-col${instant ? " no-animate" : ""}`}>
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between pb-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Meeting Planner</h2>
          <p className="text-[11px] text-muted-foreground">
            {overlapCount > 0
              ? `${overlapCount}h overlap found`
              : "No overlapping work hours"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-border
                     bg-background/50 transition-colors hover:bg-accent"
          aria-label="Close meeting planner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex shrink-0 items-center gap-3 pb-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500/40" /> Working hours
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Overlap
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-foreground/10" /> Off hours
        </span>
      </div>

      {/* Time grid */}
      <div className="min-h-0 flex-1 overflow-y-auto" role="grid" aria-label="Meeting planner showing working hour overlaps">
        {/* Hour labels row — viewer-local time for each slot */}
        <div className="flex items-end gap-px mb-1 pl-[88px] sm:pl-[100px]" role="row">
          {slots.map((slot, i) => {
            const displayHour = slot.getHours();
            return (
              <div
                key={i}
                role="columnheader"
                className={`flex-1 text-center text-[8px] sm:text-[9px] tabular-nums ${
                  i === currentSlot ? "font-bold text-foreground" : "text-muted-foreground/60"
                }`}
              >
                {displayHour % 3 === 0 ? (displayHour === 0 ? "12a" : displayHour <= 12 ? `${displayHour}` : `${displayHour - 12}`) : ""}
              </div>
            );
          })}
        </div>

        {/* Region rows */}
        {regionRows.map(({ region, cells }) => (
          <div key={region.id} className="flex items-center gap-px mb-px" role="row">
            {/* Region label */}
            <div className="w-[88px] sm:w-[100px] shrink-0 flex items-center gap-1.5 pr-2">
              <span className="text-xs leading-none">{region.flag}</span>
              <span className="text-[10px] sm:text-[11px] font-medium truncate">{region.city}</span>
            </div>

            {/* Hour cells */}
            {cells.map((cell, i) => {
              const isOverlap = overlap[i];
              const label = `${region.city} ${String(cell.hour).padStart(2, "0")}:${String(cell.minute).padStart(2, "0")}`;
              return (
                <div
                  key={i}
                  role="gridcell"
                  aria-label={`${label}${cell.working ? ", working hours" : ""}${isOverlap ? ", overlap" : ""}`}
                  className={`flex-1 h-6 sm:h-7 rounded-[2px] transition-colors ${
                    isOverlap
                      ? "bg-emerald-400 dark:bg-emerald-500"
                      : cell.working
                      ? "bg-emerald-500/30 dark:bg-emerald-500/25"
                      : "bg-foreground/5 dark:bg-foreground/8"
                  } ${i === currentSlot ? "ring-1 ring-foreground/30" : ""}`}
                  title={label}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
