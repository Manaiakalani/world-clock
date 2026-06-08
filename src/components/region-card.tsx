"use client";

import { memo, useMemo } from "react";
import { Region } from "@/data/regions";
import {
  formatTime,
  getOffsetFromLocal,
  formatOffset,
  isWorkingHours,
  isAwake,
  getRegionHour,
  getRegionMinute,
  getDayDifference,
  getTimezoneAbbr,
  getNextDstTransition,
  getDevInfo,
  formatDateLong,
  formatSunTime,
} from "@/lib/timezone-utils";
import { getGradientForHour, gradientToCSS } from "@/lib/sky-gradients";
import { type WeatherData } from "@/lib/weather";
import { RegionCardDial } from "@/components/region-card-dial";

interface RegionCardProps {
  region: Region;
  now: Date;
  /** Called with the region id; stable across renders so React.memo isn't defeated. */
  onClick?: (id: string) => void;
  isActive?: boolean;
  weather?: WeatherData | null;
  is24h?: boolean;
  isLocal?: boolean;
  localTimezone?: string;
  devMode?: boolean;
}

/** Parse open-meteo's local ISO timestamp ("YYYY-MM-DDTHH:MM") into a fractional hour. */
function localHourFromIso(iso: string | undefined): number | undefined {
  if (!iso) return undefined;
  const m = /T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return undefined;
  return parseInt(m[1], 10) + parseInt(m[2], 10) / 60;
}

/** Relative-day pill text (Today / Tomorrow / Yesterday / +Nd). */
function relativeDayLabel(diff: string | null): string {
  if (!diff) return "Today";
  if (diff === "+1d") return "Tomorrow";
  if (diff === "-1d") return "Yesterday";
  return diff;
}

export const RegionCard = memo(function RegionCard({ region, now, onClick, isActive, weather, is24h, isLocal, localTimezone, devMode }: RegionCardProps) {
  const time = formatTime(region.timezone, now, is24h);
  const hour = getRegionHour(region.timezone, now);
  const minute = getRegionMinute(region.timezone, now);
  const offset = getOffsetFromLocal(region.timezone, now);
  const offsetStr = isLocal ? "Local" : formatOffset(offset);
  const dayDiff = localTimezone ? getDayDifference(region.timezone, localTimezone, now) : null;
  const working = isWorkingHours(region.timezone, now);
  const awake = isAwake(region.timezone, now);
  const tzAbbr = getTimezoneAbbr(region.timezone, now);
  const gradient = useMemo(
    () => getGradientForHour(hour + minute / 60),
    [hour, minute]
  );

  const sunriseHour = useMemo(() => localHourFromIso(weather?.sunrise), [weather?.sunrise]);
  const sunsetHour = useMemo(() => localHourFromIso(weather?.sunset), [weather?.sunset]);
  const dialHour = hour + minute / 60;

  // DST transitions are stable within a day — only recompute when the date changes
  const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const dstTransition = useMemo(
    () => getNextDstTransition(region.timezone, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [region.timezone, dayKey]
  );

  // Expanded-only computations — memoized to avoid work on collapsed cards
  const expandedDate = useMemo(
    () => isActive ? formatDateLong(region.timezone, now) : "",
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isActive, region.timezone, dayKey]
  );
  const sunriseStr = useMemo(
    () => isActive && weather?.sunrise ? formatSunTime(region.timezone, weather.sunrise, is24h) : "",
    [isActive, region.timezone, weather?.sunrise, is24h]
  );
  const sunsetStr = useMemo(
    () => isActive && weather?.sunset ? formatSunTime(region.timezone, weather.sunset, is24h) : "",
    [isActive, region.timezone, weather?.sunset, is24h]
  );
  const devInfo = useMemo(
    () => isActive && devMode ? getDevInfo(region.timezone, now) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isActive, devMode, region.timezone, minute]
  );

  return (
    <button
      onClick={onClick ? () => onClick(region.id) : undefined}
      aria-label={`${region.city}, ${region.flag} — ${time} ${offsetStr}`}
      className={`region-card group relative w-full overflow-hidden rounded-2xl border ${isLocal ? "border-white/25" : "border-white/10"} px-3 py-2.5 sm:px-3.5 sm:py-3 text-left
                  transition-[transform,box-shadow] duration-200
                  active:scale-[0.98]
                  ${isLocal ? "ring-1 ring-white/25" : ""}
                  ${isActive ? "ring-2 ring-white/30 shadow-lg" : ""}`}
      style={{
        background: gradientToCSS(gradient),
        transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
      }}
    >
      {/* Dark scrim for text readability across all sky gradients */}
      <div className="absolute inset-0 bg-black/25 rounded-2xl" />

      {/* Collapsed row — always visible. Keeps the compact information density users know. */}
      <div className="relative z-10 flex items-center gap-2.5" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
        <span className="text-lg leading-none shrink-0" style={{ textShadow: "none" }}>{region.flag}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] sm:text-sm font-semibold leading-tight tracking-tight text-white">
              {region.city}
            </span>
            <span className="text-[10px] leading-none shrink-0" style={{ textShadow: "none" }}>
              {awake ? "☀️" : "🌙"}
            </span>
            {working && (
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] sm:text-[11px] leading-tight text-white/70">
              {region.name} · {tzAbbr}
            </span>
            {weather ? (
              <span className="text-[10px] sm:text-[11px] leading-tight font-medium text-white/80">
                {weather.emoji} {Math.round(weather.temperatureC)}°/{weather.temperatureF}°
              </span>
            ) : (
              <span className="inline-block w-12 h-3 rounded bg-white/10 weather-shimmer" />
            )}
            {dstTransition && (
              <span className={`text-[10px] leading-tight ${dstTransition.daysUntil >= 0 ? "text-amber-300/90" : "text-white/50"}`}>
                ⏰ DST {dstTransition.daysUntil >= 0
                  ? dstTransition.daysUntil === 0 ? "today" : `in ${dstTransition.daysUntil}d`
                  : `${Math.abs(dstTransition.daysUntil)}d ago`}
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-[13px] sm:text-sm font-bold leading-tight tabular-nums text-white">
            {time}
          </div>
          <div className={`text-[10px] sm:text-[11px] leading-tight font-medium ${offset === 0 ? "text-white/50" : "text-white/70"}`}>
            {offsetStr}
            {dayDiff && <span className="ml-1 text-amber-300/90">· {dayDiff}</span>}
          </div>
        </div>
      </div>

      {/* Expanded panel — iOS-style: big time, central day/night dial, weather row */}
      <div
        className="region-card-expand relative z-10"
        data-expanded={isActive ? "true" : "false"}
      >
        <div className="overflow-hidden">
          {isActive && (
            <div className="mt-3 pt-3 border-t border-white/15"
                 style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white/90"
                          style={{ textShadow: "none" }}>
                      {relativeDayLabel(dayDiff)}
                    </span>
                    {isLocal && (
                      <span className="inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white/90"
                            style={{ textShadow: "none" }}>
                        ↗ Local
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 text-[11px] sm:text-xs text-white/80" suppressHydrationWarning>
                    {expandedDate}
                  </div>
                </div>

                <RegionCardDial
                  hour={dialHour}
                  sunriseHour={sunriseHour}
                  sunsetHour={sunsetHour}
                  size={68}
                  className="shrink-0"
                />

                <div className="text-right shrink-0">
                  <div className="font-mono text-2xl sm:text-3xl font-bold leading-none tabular-nums text-white">
                    {time}
                  </div>
                  <div className="mt-1 text-[11px] text-white/70 font-medium">
                    {offsetStr}
                    {dayDiff && <span className="ml-1 text-amber-300/90">· {dayDiff}</span>}
                  </div>
                </div>
              </div>

              {(sunriseStr || sunsetStr || weather) && (
                <div className="mt-3 flex items-center justify-between gap-3 text-[11px] sm:text-xs text-white/85" suppressHydrationWarning>
                  <div className="flex items-center gap-3">
                    {sunriseStr && <span>🌅 {sunriseStr}</span>}
                    {sunsetStr && <span>🌇 {sunsetStr}</span>}
                  </div>
                  {weather && (
                    <span className="font-medium">{weather.label}</span>
                  )}
                </div>
              )}

              <div className="mt-2 text-[10px] text-white/50 font-mono">
                {region.timezone}
              </div>
              {devInfo && (
                <div className="mt-1.5 pt-1.5 border-t border-white/10 font-mono text-[9px] sm:text-[10px] text-white/50 space-y-0.5">
                  <div>ISO&nbsp; {devInfo.iso}</div>
                  <div>
                    Unix {devInfo.unix}&nbsp; W{devInfo.week}&nbsp; D{devInfo.dayOfYear}&nbsp; DST {devInfo.isDST ? "✓" : "✗"}
                  </div>
                  <div>{devInfo.utcOffset}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
});
