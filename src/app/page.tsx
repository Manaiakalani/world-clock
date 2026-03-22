"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { useCurrentTime } from "@/hooks/use-current-time";
import { useActiveTimezones } from "@/hooks/use-active-timezones";
import { useTimeFormat } from "@/hooks/use-time-format";
import { useWeather } from "@/hooks/use-weather";
import { regionsFromTimezones } from "@/data/regions";
import { GlobeViewer } from "@/components/globe-viewer";
import { AnalogClock } from "@/components/analog-clock";
import { RegionList } from "@/components/region-list";
import { TimezoneManager } from "@/components/timezone-manager";
import { AuroraBackground } from "@/components/aurora-background";
import { Header } from "@/components/header";
import { QuickSearch } from "@/components/quick-search";
import { AboutDialog } from "@/components/about-dialog";
import { getRegionHour, getRegionMinute, formatTimeFull, getTimezoneAbbr } from "@/lib/timezone-utils";
import { Switch } from "@/components/ui/switch";
import { MeetingPlanner } from "@/components/meeting-planner";
import { Clock, List, Settings2, Moon, Sun, Link2, Check, Calendar, Info } from "lucide-react";

export default function WorldClockPage() {
  const now = useCurrentTime(1000);
  const { theme, setTheme } = useTheme();
  const { activeTimezones, toggle, isActive, loaded, setTimezones, getShareUrl } = useActiveTimezones();
  const { is24h, toggle: toggleTimeFormat } = useTimeFormat();
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
  const [showClock, setShowClock] = useState(true);
  const [showManager, setShowManager] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMeetingPlanner, setShowMeetingPlanner] = useState(false);
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(getShareUrl()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [getShareUrl]);

  const localTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  );

  // Sky-based marker colors update every minute (globe reads via ref, no re-init)
  const currentMinute = now.getMinutes();
  const regions = useMemo(
    () => regionsFromTimezones(activeTimezones, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTimezones, currentMinute]
  );

  const weatherLocations = useMemo(
    () => regions.map((r) => ({ id: r.id, coordinates: r.coordinates })),
    [regions]
  );
  const { weather } = useWeather(weatherLocations);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowQuickSearch((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        setShowManager((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "m") {
        e.preventDefault();
        setShowMeetingPlanner((prev) => !prev);
      }
      if (e.key === "Escape") {
        if (showMeetingPlanner) setShowMeetingPlanner(false);
        else if (showManager) setShowManager(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showManager, showMeetingPlanner]);

  const localHour = getRegionHour(localTimezone, now);
  const localMinute = getRegionMinute(localTimezone, now);
  const minuteFraction = localMinute / 60;

  if (!loaded) return null;

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Atmospheric scattering background — inspired by motion-core/halo */}
      <div className="absolute inset-0">
        <AuroraBackground hour={localHour} minuteFraction={minuteFraction} dark={theme === "dark"} />
      </div>

      {/* Light glass overlay */}
      <div className="absolute inset-0 bg-white/10 dark:bg-background/20" />

      <div className="relative z-10 flex h-full flex-col">
        <Header now={now} />

        <main id="main-content" className="flex min-h-0 flex-1 flex-col md:flex-row gap-3 px-4 pb-3 sm:px-6 lg:gap-6 lg:px-8">
          {/* Globe — left side (hidden on mobile, visible from lg up) */}
          <div className="hidden md:flex flex-1 items-center justify-center min-h-0">
            <GlobeViewer
              regions={regions}
              focusRegionId={activeRegionId}
              dark={theme === "dark"}
              className="w-full max-w-[320px] lg:max-w-[680px] xl:max-w-[720px] 2xl:max-w-[800px]"
            />
          </div>

          {/* Right panel — fixed width on desktop, fills on mobile */}
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden md:flex-initial md:w-[340px] lg:w-[420px] md:shrink-0 xl:w-[460px]">
            {showMeetingPlanner ? (
              <MeetingPlanner
                regions={regions}
                now={now}
                onClose={() => setShowMeetingPlanner(false)}
              />
            ) : showManager ? (
              /* Timezone Manager view */
              <TimezoneManager
                now={now}
                isActive={isActive}
                onToggle={toggle}
                onSetTimezones={setTimezones}
                onClose={() => setShowManager(false)}
                is24h={is24h}
              />
            ) : (
              /* Main view: clock + region cards */
              <>
                {/* Panel header */}
                <div className="flex shrink-0 items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight">Regions</h2>

                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 hidden sm:block" />
                      <Switch
                        checked={showClock}
                        onCheckedChange={setShowClock}
                        aria-label="Toggle clock view"
                      />
                      <List className="h-3.5 w-3.5 hidden sm:block" />
                    </div>
                    <button
                      onClick={toggleTimeFormat}
                      className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-border
                                 bg-background/50 transition-[transform,background-color] duration-160
                                 hover:bg-accent active:scale-[0.95] text-[10px] sm:text-xs font-bold"
                      style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
                      aria-label="Toggle time format"
                    >
                      {is24h ? "24" : "12"}
                    </button>
                    <button
                      onClick={() => { setShowManager(true); setShowMeetingPlanner(false); }}
                      className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-border
                                 bg-background/50 transition-[transform,background-color] duration-160
                                 hover:bg-accent active:scale-[0.95]"
                      style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
                      aria-label="Manage timezones"
                    >
                      <Settings2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      onClick={() => { setShowMeetingPlanner(true); setShowManager(false); }}
                      className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-border
                                 bg-background/50 transition-[transform,background-color] duration-160
                                 hover:bg-accent active:scale-[0.95]"
                      style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
                      aria-label="Meeting planner"
                    >
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-border
                                 bg-background/50 transition-[transform,background-color] duration-160
                                 hover:bg-accent active:scale-[0.95]"
                      style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
                      aria-label="Copy shareable link"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                      ) : (
                        <Link2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-border
                                 bg-background/50 transition-[transform,background-color] duration-160
                                 hover:bg-accent active:scale-[0.95]"
                      style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
                      aria-label="Toggle theme"
                    >
                      {theme === "dark" ? (
                        <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      ) : (
                        <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setShowAbout(true)}
                      className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-border
                                 bg-background/50 transition-[transform,background-color] duration-160
                                 hover:bg-accent active:scale-[0.95]"
                      style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
                      aria-label="About World Clock"
                    >
                      <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </div>

                {/* Analog clock */}
                {showClock && (
                  <div className="mx-auto w-full max-w-[180px] shrink-0 sm:max-w-[220px] xl:max-w-[200px] 2xl:max-w-[240px]">
                    <AnalogClock
                      regions={regions}
                      now={now}
                      localTimezone={localTimezone}
                      is24h={is24h}
                      className="aspect-square"
                    />
                    <p className="mt-1 text-center font-mono text-sm sm:text-base font-bold tabular-nums tracking-widest" aria-live="polite" aria-atomic="true" suppressHydrationWarning>
                      {formatTimeFull(localTimezone, now, is24h)}
                      <span className="ml-1.5 text-[10px] sm:text-xs font-semibold text-muted-foreground/70 tracking-normal">
                        {getTimezoneAbbr(localTimezone, now)}
                      </span>
                    </p>
                  </div>
                )}

                {/* Region list — scrolls only when cards overflow */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  <div className="flex flex-col gap-1.5 sm:gap-2 xl:gap-1.5 2xl:gap-2.5">
                    <RegionList
                      regions={regions}
                      now={now}
                      activeRegionId={activeRegionId}
                      onRegionClick={(id) =>
                        setActiveRegionId(activeRegionId === id ? null : id)
                      }
                      weather={weather}
                      is24h={is24h}
                      localTimezone={localTimezone}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* About dialog */}
      {showAbout && <AboutDialog onClose={() => setShowAbout(false)} />}

      {/* Quick search modal */}
      {showQuickSearch && (
        <QuickSearch
          now={now}
          isActive={isActive}
          onToggle={toggle}
          onClose={() => setShowQuickSearch(false)}
          is24h={is24h}
        />
      )}
    </div>
  );
}
