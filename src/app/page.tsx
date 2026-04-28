"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useCurrentTime } from "@/hooks/use-current-time";
import { useCurrentMinute } from "@/hooks/use-current-minute";
import { useActiveTimezones } from "@/hooks/use-active-timezones";
import { useTimeFormat } from "@/hooks/use-time-format";
import { useWeather } from "@/hooks/use-weather";
import { regionsFromTimezones } from "@/data/regions";
import { GlobeViewer } from "@/components/globe-viewer";
import { AnalogClock } from "@/components/analog-clock";
import { RegionList } from "@/components/region-list";
import { AuroraBackground } from "@/components/aurora-background";
import { Header } from "@/components/header";
import { getRegionHour, getRegionMinute, formatTimeFull, getTimezoneAbbr } from "@/lib/timezone-utils";
import { Switch } from "@/components/ui/switch";
import { Clock, List, Settings2, Moon, Sun, Link2, Check, Calendar, Info, MoreHorizontal, Search } from "lucide-react";

// Modal/conditional surfaces — lazy-loaded so they don't ship in the initial bundle.
const TimezoneManager = dynamic(
  () => import("@/components/timezone-manager").then((m) => m.TimezoneManager),
  { ssr: false }
);
const MeetingPlanner = dynamic(
  () => import("@/components/meeting-planner").then((m) => m.MeetingPlanner),
  { ssr: false }
);
const QuickSearch = dynamic(
  () => import("@/components/quick-search").then((m) => m.QuickSearch),
  { ssr: false }
);
const AboutDialog = dynamic(
  () => import("@/components/about-dialog").then((m) => m.AboutDialog),
  { ssr: false }
);

export default function WorldClockPage() {
  // Second-precision clock — only the analog clock face needs this tick.
  const now = useCurrentTime(1000);
  // Minute-precision clock — drives everything else (regions, sky, weather, chrome).
  const nowMinute = useCurrentMinute();
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
  const [showOverflow, setShowOverflow] = useState(false);

  const handleShare = useCallback(() => {
    const url = getShareUrl();
    // Prefer native share on mobile, fall back to clipboard.
    const canShare =
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      // Coarse-pointer heuristic — only auto-trigger native share on touch devices.
      window.matchMedia?.("(hover: none) and (pointer: coarse)").matches;
    if (canShare) {
      navigator
        .share({ title: "World Clock", url })
        .catch(() => {
          // User dismissed or share failed — fall through to clipboard copy.
          navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          });
        });
      return;
    }
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [getShareUrl]);

  const localTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  );

  // Sky-based marker colors update every minute — driven by the minute-tick clock
  // so the entire region list doesn't re-render every second.
  const regions = useMemo(
    () => regionsFromTimezones(activeTimezones, nowMinute),
    [activeTimezones, nowMinute]
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

  // Aurora sun direction & header date only need minute precision.
  const localHour = getRegionHour(localTimezone, nowMinute);
  const localMinute = getRegionMinute(localTimezone, nowMinute);
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
        <Header now={nowMinute} />

        <main id="main-content" className="flex min-h-0 flex-1 flex-col md:flex-row gap-3 px-4 pb-20 sm:pb-3 sm:px-6 lg:gap-6 lg:px-8">
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
                now={nowMinute}
                onClose={() => setShowMeetingPlanner(false)}
              />
            ) : showManager ? (
              /* Timezone Manager view */
              <TimezoneManager
                now={nowMinute}
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
                    {/* Desktop / tablet icon row — hidden on phones in favor of the bottom action bar */}
                    <div className="hidden sm:flex items-center gap-1">
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
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
                  <div className="flex flex-col gap-1.5 sm:gap-2 xl:gap-1.5 2xl:gap-2.5">
                    <RegionList
                      regions={regions}
                      now={nowMinute}
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
          now={nowMinute}
          isActive={isActive}
          onToggle={toggle}
          onClose={() => setShowQuickSearch(false)}
          is24h={is24h}
        />
      )}

      {/* Mobile bottom action bar — hidden on sm+ where the icon row in the panel header is shown.
          Stays out of the way of the panel sub-views (manager / planner) which provide their own back affordance. */}
      {!showManager && !showMeetingPlanner && (
        <nav
          aria-label="Primary actions"
          className="sm:hidden fixed inset-x-0 bottom-0 z-30 border-t border-border
                     bg-background/70 backdrop-blur-md
                     pb-[env(safe-area-inset-bottom)]"
        >
          <div className="flex items-center justify-around px-2 py-1.5">
            <button
              onClick={() => setShowQuickSearch(true)}
              className="flex h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-lg
                         text-[10px] text-muted-foreground active:scale-[0.95] active:bg-accent/50
                         transition-transform duration-160"
              style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
              aria-label="Quick search"
            >
              <Search className="h-5 w-5" />
              <span className="leading-none">Search</span>
            </button>
            <button
              onClick={() => { setShowManager(true); setShowOverflow(false); }}
              className="flex h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-lg
                         text-[10px] text-muted-foreground active:scale-[0.95] active:bg-accent/50
                         transition-transform duration-160"
              style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
              aria-label="Manage timezones"
            >
              <Settings2 className="h-5 w-5" />
              <span className="leading-none">Manage</span>
            </button>
            <button
              onClick={() => { setShowMeetingPlanner(true); setShowOverflow(false); }}
              className="flex h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-lg
                         text-[10px] text-muted-foreground active:scale-[0.95] active:bg-accent/50
                         transition-transform duration-160"
              style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
              aria-label="Meeting planner"
            >
              <Calendar className="h-5 w-5" />
              <span className="leading-none">Plan</span>
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-lg
                         text-[10px] text-muted-foreground active:scale-[0.95] active:bg-accent/50
                         transition-transform duration-160"
              style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="leading-none">Theme</span>
            </button>
            <button
              onClick={() => setShowOverflow((v) => !v)}
              aria-expanded={showOverflow}
              aria-label="More actions"
              className="flex h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-lg
                         text-[10px] text-muted-foreground active:scale-[0.95] active:bg-accent/50
                         transition-transform duration-160"
              style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="leading-none">More</span>
            </button>
          </div>

          {/* Overflow popover — anchored above the bar */}
          {showOverflow && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowOverflow(false)}
                aria-hidden="true"
              />
              <div
                role="menu"
                className="absolute right-2 bottom-[calc(100%+8px)] z-20 w-44 rounded-xl border border-border
                           bg-popover/95 backdrop-blur-md shadow-lg overflow-hidden"
              >
                <button
                  role="menuitem"
                  onClick={() => { toggleTimeFormat(); setShowOverflow(false); }}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-accent active:bg-accent"
                >
                  <span>Time format</span>
                  <span className="font-mono text-xs font-bold text-muted-foreground">{is24h ? "24h" : "12h"}</span>
                </button>
                <button
                  role="menuitem"
                  onClick={() => { setShowClock((v) => !v); setShowOverflow(false); }}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-accent active:bg-accent"
                >
                  <span>{showClock ? "Hide clock" : "Show clock"}</span>
                  {showClock ? <Clock className="h-4 w-4 text-muted-foreground" /> : <List className="h-4 w-4 text-muted-foreground" />}
                </button>
                <button
                  role="menuitem"
                  onClick={() => { handleShare(); setShowOverflow(false); }}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-accent active:bg-accent"
                >
                  <span>Share link</span>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4 text-muted-foreground" />}
                </button>
                <button
                  role="menuitem"
                  onClick={() => { setShowAbout(true); setShowOverflow(false); }}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-accent active:bg-accent"
                >
                  <span>About</span>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </>
          )}
        </nav>
      )}
    </div>
  );
}
