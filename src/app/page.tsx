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

        <main className="flex flex-1 flex-col lg:flex-row gap-6 px-6 pb-6">
          {/* Globe — left side */}
          <div className="flex flex-1 items-center justify-center lg:max-w-[55%]">
            <GlobeViewer
              focusRegionId={activeRegionId}
              className="w-full max-w-[600px]"
            />
          </div>

          {/* Clock + Region list — right side */}
          <div className="flex flex-1 flex-col gap-4 lg:max-w-[45%]">
            {/* Team header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">Team</h2>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  {onlineCount} online
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
              <div className="mx-auto w-full max-w-[320px]">
                <AnalogClock
                  regions={regions}
                  now={now}
                  localTimezone={localTimezone}
                  className="aspect-square"
                />
                <p className="mt-1 text-center font-mono text-lg font-bold tabular-nums tracking-wider">
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
