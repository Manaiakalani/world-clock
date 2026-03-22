"use client";

import { useMemo } from "react";
import { Region } from "@/data/regions";
import { getRegionHour } from "@/lib/timezone-utils";
import { X } from "lucide-react";

interface MeetingPlannerProps {
  regions: Region[];
  now: Date;
  onClose: () => void;
}

export function MeetingPlanner({ regions, now, onClose }: MeetingPlannerProps) {
  const currentLocalHour = new Date().getHours();
  
  const data = useMemo(() => {
    // For each region, compute which UTC hours are their 9-17 working hours
    const regionWorkHours = regions.map((region) => {
      const currentRegionHour = getRegionHour(region.timezone, now);
      const currentUtcHour = now.getUTCHours();
      const offset = ((currentRegionHour - currentUtcHour) % 24 + 24) % 24;
      
      // Working hours in UTC
      const workStart = ((9 - offset) % 24 + 24) % 24;
      
      const workingUtcHours = new Set<number>();
      for (let h = 0; h < 8; h++) {
        workingUtcHours.add((workStart + h) % 24);
      }
      
      return {
        region,
        offset,
        workingUtcHours,
        currentHour: currentRegionHour,
      };
    });
    
    // Find overlap: UTC hours where ALL regions are working
    const overlapHours = new Set<number>();
    for (let h = 0; h < 24; h++) {
      if (regionWorkHours.every((rw) => rw.workingUtcHours.has(h))) {
        overlapHours.add(h);
      }
    }
    
    return { regionWorkHours, overlapHours };
  }, [regions, now]);
  
  // Display 24 columns (in local time for the viewer)
  const localOffset = now.getHours() - now.getUTCHours();
  
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between pb-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Meeting Planner</h2>
          <p className="text-[11px] text-muted-foreground">
            {data.overlapHours.size > 0
              ? `${data.overlapHours.size}h overlap found`
              : "No overlapping work hours"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border
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
        {/* Hour labels row */}
        <div className="flex items-end gap-px mb-1 pl-[88px] sm:pl-[100px]">
          {Array.from({ length: 24 }, (_, i) => {
            const utcHour = ((i + now.getUTCHours() - 6 + 24) % 24);
            const displayHour = ((utcHour + localOffset) % 24 + 24) % 24;
            const isNow = displayHour === currentLocalHour;
            return (
              <div
                key={i}
                className={`flex-1 text-center text-[8px] sm:text-[9px] tabular-nums ${
                  isNow ? "font-bold text-foreground" : "text-muted-foreground/60"
                }`}
              >
                {displayHour % 3 === 0 ? (displayHour === 0 ? "12a" : displayHour <= 12 ? `${displayHour}` : `${displayHour - 12}`) : ""}
              </div>
            );
          })}
        </div>
        
        {/* Region rows */}
        {data.regionWorkHours.map(({ region, workingUtcHours, currentHour }) => (
          <div key={region.id} className="flex items-center gap-px mb-px">
            {/* Region label */}
            <div className="w-[88px] sm:w-[100px] shrink-0 flex items-center gap-1.5 pr-2">
              <span className="text-xs leading-none">{region.flag}</span>
              <span className="text-[10px] sm:text-[11px] font-medium truncate">{region.city}</span>
            </div>
            
            {/* Hour cells */}
            {Array.from({ length: 24 }, (_, i) => {
              const utcHour = ((i + now.getUTCHours() - 6 + 24) % 24);
              const isWorking = workingUtcHours.has(utcHour);
              const isOverlap = data.overlapHours.has(utcHour);
              const regionHourForCell = ((utcHour + ((currentHour - now.getUTCHours() + 24) % 24)) % 24);
              const isCurrentHour = regionHourForCell === currentHour;
              
              return (
                <div
                  key={i}
                  className={`flex-1 h-6 sm:h-7 rounded-[2px] transition-colors ${
                    isOverlap && isWorking
                      ? "bg-emerald-400 dark:bg-emerald-500"
                      : isWorking
                      ? "bg-emerald-500/30 dark:bg-emerald-500/25"
                      : "bg-foreground/5 dark:bg-foreground/8"
                  } ${isCurrentHour ? "ring-1 ring-foreground/30" : ""}`}
                  title={`${region.city}: ${regionHourForCell}:00`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
