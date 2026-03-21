"use client";

import { Region } from "@/data/regions";
import {
  formatTime,
  getOffsetFromLocal,
  formatOffset,
  isWorkingHours,
  getRegionHour,
} from "@/lib/timezone-utils";
import { getGradientForHour, gradientToCSS, isDarkTime } from "@/lib/sky-gradients";

interface RegionCardProps {
  region: Region;
  now: Date;
  onClick?: () => void;
  isActive?: boolean;
}

export function RegionCard({ region, now, onClick, isActive }: RegionCardProps) {
  const time = formatTime(region.timezone, now);
  const hour = getRegionHour(region.timezone, now);
  const offset = getOffsetFromLocal(region.timezone, now);
  const offsetStr = formatOffset(offset);
  const working = isWorkingHours(region.timezone, now);
  const gradient = getGradientForHour(hour + getMinuteFraction(region.timezone, now));
  const dark = isDarkTime(hour);

  return (
    <button
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-xl border p-3.5 text-left
                  transition-all duration-300 hover:scale-[1.02] hover:shadow-lg
                  ${isActive ? "ring-2 ring-primary shadow-lg" : ""}
                  ${dark ? "border-white/10" : "border-black/10"}`}
      style={{ background: gradientToCSS(gradient) }}
    >
      <div className="relative z-10 flex items-center gap-3">
        {/* Emoji + online indicator */}
        <div className="relative">
          <span className="text-2xl leading-none">{region.emoji}</span>
          {working && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-green-400/20" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className={`text-[15px] font-semibold tracking-tight ${dark ? "text-white" : "text-gray-900"}`}>
            {region.city}
          </div>
          <div className={`text-xs ${dark ? "text-white/50" : "text-gray-500"}`}>
            {region.name}
          </div>
        </div>

        {/* Time */}
        <div className="text-right">
          <div className={`font-mono text-[15px] font-bold tabular-nums ${dark ? "text-white" : "text-gray-900"}`}>
            {time}
          </div>
          <div className={`text-xs font-medium ${offset === 0 ? (dark ? "text-white/40" : "text-gray-400") : dark ? "text-white/60" : "text-gray-600"}`}>
            {offsetStr}
          </div>
        </div>
      </div>
    </button>
  );
}

function getMinuteFraction(timezone: string, now: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    minute: "numeric",
  }).formatToParts(now);
  const min = parts.find((p) => p.type === "minute");
  return min ? parseInt(min.value, 10) / 60 : 0;
}
