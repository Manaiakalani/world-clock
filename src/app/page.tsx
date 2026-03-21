"use client";

import { useState, useMemo } from "react";
import { useCurrentTime } from "@/hooks/use-current-time";
import { regions } from "@/data/regions";
import { GlobeViewer } from "@/components/globe-viewer";
import { AnalogClock } from "@/components/analog-clock";
import { RegionList } from "@/components/region-list";
import { Header } from "@/components/header";
import {
  getGradientForHour,
  gradientToCSS,
} from "@/lib/sky-gradients";
import { getRegionHour, isWorkingHours, formatTimeFull } from "@/lib/timezone-utils";
import { Switch } from "@/components/ui/switch";
import { Clock, List } from "lucide-react";

export default function WorldClockPage() {
  const now = useCurrentTime(1000);
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
  const [showClock, setShowClock] = useState(true);

  const localTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  );

  const localHour = getRegionHour(localTimezone, now);
  const pageGradient = getGradientForHour(localHour);

  const onlineCount = regions.filter((r) =>
    isWorkingHours(r.timezone, now)
  ).length;

  return (
    <div
      className="relative min-h-screen transition-all duration-[3000ms]"
      style={{ background: gradientToCSS(pageGradient) }}
    >
      {/* Glass overlay for readability */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm dark:bg-background/40" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header now={now} />

        <main className="flex flex-1 flex-col xl:flex-row gap-4 px-4 pb-6 sm:px-6 lg:gap-8 lg:px-8">
          {/* Globe — left side (hidden on mobile, visible from lg up) */}
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <GlobeViewer
              focusRegionId={activeRegionId}
              className="w-full max-w-[560px]"
            />
          </div>

          {/* Clock + Region list — right side (full width on mobile) */}
          <div className="flex w-full flex-col gap-4 xl:max-w-[520px]">
            {/* Team header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-semibold tracking-tight">Team</h2>
                <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  {onlineCount} online
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <Switch
                  checked={showClock}
                  onCheckedChange={setShowClock}
                  aria-label="Toggle clock view"
                />
                <List className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Analog clock */}
            {showClock && (
              <div className="mx-auto w-full max-w-[280px] sm:max-w-[320px]">
                <AnalogClock
                  regions={regions}
                  now={now}
                  localTimezone={localTimezone}
                  className="aspect-square"
                />
                <p className="mt-2 text-center font-mono text-xl font-bold tabular-nums tracking-widest">
                  {formatTimeFull(localTimezone, now)}
                </p>
              </div>
            )}

            {/* Region list */}
            <div className="flex-1 overflow-y-auto pr-1">
              <RegionList
                regions={regions}
                now={now}
                activeRegionId={activeRegionId}
                onRegionClick={(id) =>
                  setActiveRegionId(activeRegionId === id ? null : id)
                }
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
