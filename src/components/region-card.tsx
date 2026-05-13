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
  devMode?: boolean;
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
  const dstTransition = useMemo(
    () => getNextDstTransition(region.timezone, now),
    [region.timezone, now]
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
              <span className="inline-block w-12 h-3 rounded bg-white/20 animate-pulse" />
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
          {weather?.sunrise && weather?.sunset && (
            <div className="mt-1.5 flex items-center gap-3 text-[11px] sm:text-xs text-white/80" suppressHydrationWarning>
              <span>
                🌅{" "}
                {new Intl.DateTimeFormat("en-US", {
                  timeZone: region.timezone,
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: !is24h,
                }).format(new Date(weather.sunrise))}
              </span>
              <span>
                🌇{" "}
                {new Intl.DateTimeFormat("en-US", {
                  timeZone: region.timezone,
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: !is24h,
                }).format(new Date(weather.sunset))}
              </span>
            </div>
          )}
          <div className="mt-1 text-[10px] text-white/50 font-mono">
            {region.timezone}
          </div>
          {devMode && (() => {
            const dev = getDevInfo(region.timezone, now);
            return (
              <div className="mt-1.5 pt-1.5 border-t border-white/10 font-mono text-[9px] sm:text-[10px] text-white/50 space-y-0.5">
                <div>ISO&nbsp; {dev.iso}</div>
                <div>
                  Unix {dev.unix}&nbsp; W{dev.week}&nbsp; D{dev.dayOfYear}&nbsp; DST {dev.isDST ? "✓" : "✗"}
                </div>
                <div>{dev.utcOffset}</div>
              </div>
            );
          })()}
        </div>
      )}
    </button>
  );
});
