"use client";

import { memo, useMemo } from "react";
import { Region } from "@/data/regions";
import {
  formatTime,
  getOffsetFromLocal,
  formatOffset,
  isWorkingHours,
  getRegionHour,
  getRegionMinute,
  getDayDifference,
  getTimezoneAbbr,
} from "@/lib/timezone-utils";
import { getGradientForHour, gradientToCSS } from "@/lib/sky-gradients";
import { type WeatherData } from "@/lib/weather";

interface RegionCardProps {
  region: Region;
  now: Date;
  onClick?: () => void;
  isActive?: boolean;
  weather?: WeatherData | null;
  is24h?: boolean;
  isLocal?: boolean;
  localTimezone?: string;
}

export const RegionCard = memo(function RegionCard({ region, now, onClick, isActive, weather, is24h, isLocal, localTimezone }: RegionCardProps) {
  const time = formatTime(region.timezone, now, is24h);
  const hour = getRegionHour(region.timezone, now);
  const minute = getRegionMinute(region.timezone, now);
  const offset = getOffsetFromLocal(region.timezone, now);
  const offsetStr = isLocal ? "Local" : formatOffset(offset);
  const dayDiff = localTimezone ? getDayDifference(region.timezone, localTimezone, now) : null;
  const working = isWorkingHours(region.timezone, now);
  const tzAbbr = getTimezoneAbbr(region.timezone, now);
  const gradient = useMemo(
    () => getGradientForHour(hour + minute / 60),
    [hour, minute]
  );

  return (
    <button
      onClick={onClick}
      aria-label={`${region.city}, ${region.flag} — ${time} ${offsetStr}`}
      className={`region-card group relative w-full overflow-hidden rounded-lg border ${isLocal ? "border-white/25" : "border-white/10"} px-2.5 py-2 sm:px-3 sm:py-2.5 xl:py-2 2xl:px-3.5 2xl:py-3 text-left
                  transition-[transform,box-shadow] duration-200
                  active:scale-[0.97]
                  ${isLocal ? "ring-1 ring-white/25" : ""}
                  ${isActive ? "ring-2 ring-white/30 shadow-lg" : ""}`}
      style={{
        background: gradientToCSS(gradient),
        transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
      }}
    >
      {/* Dark scrim for text readability across all sky gradients */}
      <div className="absolute inset-0 bg-black/25 rounded-lg" />

      <div className="relative z-10 flex items-center gap-2" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
        {/* Flag */}
        <span className="text-lg leading-none shrink-0" style={{ textShadow: "none" }}>{region.flag}</span>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] sm:text-sm font-semibold leading-tight tracking-tight text-white">
              {region.city}
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
              <span className="inline-block w-12 h-3 rounded bg-white/20 animate-pulse" />
            )}
          </div>
        </div>

        {/* Time */}
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

      {/* Expanded details */}
      {isActive && (
        <div className="relative z-10 mt-2 pt-2 border-t border-white/15"
             style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-white/80">
            <span suppressHydrationWarning>
              {new Intl.DateTimeFormat("en-US", {
                timeZone: region.timezone,
                weekday: "long",
                month: "long",
                day: "numeric",
              }).format(now)}
            </span>
            {weather && (
              <span className="font-medium">{weather.label}</span>
            )}
          </div>
          <div className="mt-1 text-[10px] text-white/50 font-mono">
            {region.timezone}
          </div>
        </div>
      )}
    </button>
  );
});
