"use client";

import { Region } from "@/data/regions";
import { RegionCard } from "./region-card";
import type { WeatherData } from "@/lib/weather";

interface RegionListProps {
  regions: Region[];
  now: Date;
  activeRegionId: string | null;
  onRegionClick: (regionId: string) => void;
  weather?: Record<string, WeatherData>;
  is24h?: boolean;
  localTimezone?: string;
}

export function RegionList({
  regions,
  now,
  activeRegionId,
  onRegionClick,
  weather,
  is24h,
  localTimezone,
}: RegionListProps) {
  return (
    <div className="flex flex-col gap-2">
      {regions.map((region, index) => (
        <div
          key={region.id}
          className="region-card-enter"
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <RegionCard
            region={region}
            now={now}
            onClick={() => onRegionClick(region.id)}
            isActive={activeRegionId === region.id}
            weather={weather?.[region.id]}
            is24h={is24h}
            isLocal={region.timezone === localTimezone}
            localTimezone={localTimezone}
          />
        </div>
      ))}
    </div>
  );
}
