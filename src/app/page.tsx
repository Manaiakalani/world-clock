"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
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
import { getRegionHour, getRegionMinute } from "@/lib/timezone-utils";
import { useCustomOrder } from "@/hooks/use-custom-order";
import { useDevMode } from "@/hooks/use-dev-mode";
import { Switch } from "@/components/ui/switch";
import { Clock, List, Settings2, Moon, Sun, Link2, Check, Calendar, Info, MoreHorizontal, Search, ArrowUpDown } from "lucide-react";

// Modal/conditional surfaces — lazy-loaded so they don't ship in the initial bundle.
const TimezoneManager = dynamic(
  () => import("@/components/timezone-manager").then((m) => m.TimezoneManager),
  {
    ssr: false,
    loading: () => <div className="h-full animate-pulse bg-muted/10 rounded-xl" />,
  }
);
const MeetingPlanner = dynamic(
  () => import("@/components/meeting-planner").then((m) => m.MeetingPlanner),
  {
    ssr: false,
    loading: () => <div className="h-full animate-pulse bg-muted/10 rounded-xl" />,
  }
);
const QuickSearch = dynamic(
  () => import("@/components/quick-search").then((m) => m.QuickSearch),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15%]">
        <div className="w-[90%] max-w-md h-48 animate-pulse bg-muted/10 rounded-xl border border-border" />
      </div>
    ),
  }
);
const AboutDialog = dynamic(
  () => import("@/components/about-dialog").then((m) => m.AboutDialog),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10%]">
        <div className="w-[90%] max-w-md h-64 animate-pulse bg-muted/10 rounded-xl border border-border" />
      </div>
    ),
  }
);
const TimeSlider = dynamic(
  () => import("@/components/time-slider").then((m) => m.TimeSlider),
  {
    ssr: false,
    loading: () => <div className="h-12 animate-pulse bg-muted/10 rounded-xl" />,
  }
);

export default function WorldClockPage() {
  // Minute-precision clock — drives everything (regions, sky, weather, chrome).
  // The AnalogClock self-subscribes to its own 1s timer internally.
  const nowMinute = useCurrentMinute();
  const { theme, setTheme } = useTheme();
  const { activeTimezones, toggle, isActive, loaded, setTimezones, getShareUrl } = useActiveTimezones();
  const { is24h, toggle: toggleTimeFormat } = useTimeFormat();
  const { customOrder, toggleCustomOrder } = useCustomOrder();
  const { devMode, toggleDevMode } = useDevMode();
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
  const [showClock, setShowClock] = useState(true);
  const [showManager, setShowManager] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMeetingPlanner, setShowMeetingPlanner] = useState(false);
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showOverflow, setShowOverflow] = useState(false);
  const [showTimeSlider, setShowTimeSlider] = useState(false);
  const [timeOffset, setTimeOffset] = useState(0);

  // Track whether the last open was triggered by keyboard (skip enter animations)
  const openedViaKeyboard = useRef(false);

  // Time travel: shift all minute-precision clocks.
  const adjustedMinute = useMemo(
    () => (timeOffset === 0 ? nowMinute : new Date(nowMinute.getTime() + timeOffset * 3600000)),
    [nowMinute, timeOffset],
  );

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
    () => regionsFromTimezones(activeTimezones, adjustedMinute, customOrder),
    [activeTimezones, adjustedMinute, customOrder]
  );

  // Stable click handler — functional setState avoids closing over activeRegionId
  const handleRegionClick = useCallback((id: string) => {
    setActiveRegionId((prev) => (prev === id ? null : id));
  }, []);

  // Use ref for regions so handleReorder doesn't recreate when regions change
  const regionsRef = useRef(regions);
  regionsRef.current = regions;

  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    const regionTimezones = regionsRef.current.map((r) => r.timezone);
    const reordered = [...regionTimezones];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setTimezones(reordered);
  }, [setTimezones]);

  const weatherLocations = useMemo(
    () => regions.map((r) => ({ id: r.id, coordinates: r.coordinates })),
    [regions]
  );
  const { weather } = useWeather(weatherLocations);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openedViaKeyboard.current = true;
        setShowQuickSearch((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        openedViaKeyboard.current = true;
        setShowManager((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "m") {
        e.preventDefault();
        openedViaKeyboard.current = true;
        setShowMeetingPlanner((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "t") {
        e.preventDefault();
        setShowTimeSlider((prev) => {
          if (prev) setTimeOffset(0);
          return !prev;
        });
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        toggleDevMode();
      }
      if (e.key === "Escape") {
        if (showTimeSlider) { setShowTimeSlider(false); setTimeOffset(0); }
        else if (showMeetingPlanner) setShowMeetingPlanner(false);
        else if (showManager) setShowManager(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showManager, showMeetingPlanner, showTimeSlider, toggleDevMode]);

  // Aurora sun direction & header date only need minute precision.
  const localHour = getRegionHour(localTimezone, adjustedMinute);
  const localMinute = getRegionMinute(localTimezone, adjustedMinute);
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
        <Header now={adjustedMinute} />

        {/* Time travel offset indicator + slider */}
        {showTimeSlider && (
          <div className="shrink-0 px-4 sm:px-6 lg:px-8 pb-1">
            {timeOffset !== 0 && (
              <p className="mb-1 text-center text-xs font-medium text-muted-foreground">
                Viewing time at{" "}
                <span className="font-mono font-bold text-foreground">
                  {timeOffset > 0 ? "+" : ""}{timeOffset}h
                </span>{" "}
                from now
              </p>
            )}
            <TimeSlider
              offsetHours={timeOffset}
              onOffsetChange={setTimeOffset}
            />
          </div>
        )}

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
                now={adjustedMinute}
                onClose={() => setShowMeetingPlanner(false)}
                instant={openedViaKeyboard.current}
              />
            ) : showManager ? (
              /* Timezone Manager view */
              <TimezoneManager
                now={adjustedMinute}
                isActive={isActive}
                onToggle={toggle}
                onSetTimezones={setTimezones}
                onClose={() => setShowManager(false)}
                is24h={is24h}
                instant={openedViaKeyboard.current}
              />
            ) : (
              /* Main view: clock + region cards */
              <>
                {/* Panel header */}
                <div className="flex shrink-0 items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-lg font-semibold tracking-tight">Regions</h2>
                    {devMode && (
                      <span className="font-mono text-[10px] text-muted-foreground/60 select-none">&lt;/&gt;</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 hidden sm:block" />
                      <Switch
                        checked={showClock}
                        onCheckedChange={setShowClock}
                        aria-label="Toggle clock view"
                      />
                      <List className="h-3.5 w-3.5 hidden sm:block" />
                    </div>
                    {/* Desktop / tablet icon row — hidden on phones in favor of the bottom action bar */}
                    <div className="hidden sm:flex items-center gap-1.5 border-l border-border/60 pl-3">
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
                      onClick={() => { openedViaKeyboard.current = false; setShowManager(true); setShowMeetingPlanner(false); }}
                      className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-border
                                 bg-background/50 transition-[transform,background-color] duration-160
                                 hover:bg-accent active:scale-[0.95]"
                      style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
                      aria-label="Manage timezones"
                    >
                      <Settings2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      onClick={() => { openedViaKeyboard.current = false; setShowMeetingPlanner(true); setShowManager(false); }}
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
                      onClick={() => { openedViaKeyboard.current = false; setShowAbout(true); }}
                      className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-border
                                 bg-background/50 transition-[transform,background-color] duration-160
                                 hover:bg-accent active:scale-[0.95]"
                      style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
                      aria-label="About World Clock"
                    >
                      <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      onClick={toggleCustomOrder}
                      className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-border
                                 transition-[transform,background-color] duration-160
                                 hover:bg-accent active:scale-[0.95]
                                 ${customOrder ? "bg-accent/80" : "bg-background/50"}`}
                      style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
                      aria-label={customOrder ? "Sort by time" : "Custom order (drag to reorder)"}
                      title={customOrder ? "Sort by time" : "Custom order"}
                    >
                      <ArrowUpDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    </div>
                  </div>
                </div>

                {/* Analog clock — self-ticking at 1s internally */}
                {showClock && (
                  <div className="mx-auto w-full max-w-[160px] shrink-0 sm:max-w-[220px] xl:max-w-[200px] 2xl:max-w-[240px]">
                    <AnalogClock
                      regions={regions}
                      timeOffset={timeOffset}
                      localTimezone={localTimezone}
                      is24h={is24h}
                      activeRegionId={activeRegionId}
                      onRegionClick={handleRegionClick}
                      className="aspect-square"
                    />
                  </div>
                )}

                {/* Region list — scrolls only when cards overflow */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
                  <div className="flex flex-col gap-1.5 sm:gap-2 xl:gap-1.5 2xl:gap-2.5">
                    <RegionList
                      regions={regions}
                      now={adjustedMinute}
                      activeRegionId={activeRegionId}
                      onRegionClick={handleRegionClick}
                      weather={weather}
                      is24h={is24h}
                      localTimezone={localTimezone}
                      customOrder={customOrder}
                      onReorder={handleReorder}
                      devMode={devMode}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* About dialog */}
      {showAbout && <AboutDialog onClose={() => setShowAbout(false)} instant={openedViaKeyboard.current} />}

      {/* Quick search modal */}
      {showQuickSearch && (
        <QuickSearch
          now={adjustedMinute}
          isActive={isActive}
          onToggle={toggle}
          onClose={() => setShowQuickSearch(false)}
          is24h={is24h}
          instant={openedViaKeyboard.current}
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
              onClick={() => { openedViaKeyboard.current = false; setShowQuickSearch(true); }}
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
              onClick={() => { openedViaKeyboard.current = false; setShowManager(true); setShowOverflow(false); }}
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
              onClick={() => { openedViaKeyboard.current = false; setShowMeetingPlanner(true); setShowOverflow(false); }}
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
                className="overflow-menu-enter absolute right-2 bottom-[calc(100%+8px)] z-20 w-44 rounded-xl border border-border
                           bg-popover/95 backdrop-blur-md shadow-lg overflow-hidden"
                style={{ transformOrigin: "bottom right" }}
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
                  onClick={() => { toggleCustomOrder(); setShowOverflow(false); }}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-accent active:bg-accent"
                >
                  <span>{customOrder ? "Sort by time" : "Custom order"}</span>
                  <span className="text-[10px] font-medium text-muted-foreground">{customOrder ? "drag" : "UTC"}</span>
                </button>
                <button
                  role="menuitem"
                  onClick={() => { openedViaKeyboard.current = false; setShowAbout(true); setShowOverflow(false); }}
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
