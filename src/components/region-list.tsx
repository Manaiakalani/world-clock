"use client";

import { Region } from "@/data/regions";
import { RegionCard } from "./region-card";

interface RegionListProps {
  regions: Region[];
  now: Date;
  activeRegionId: string | null;
  onRegionClick: (regionId: string) => void;
}

export function RegionList({
  regions,
  now,
  activeRegionId,
  onRegionClick,
}: RegionListProps) {
  return (
    <div className="flex flex-col gap-2">
      {regions.map((region) => (
        <RegionCard
          key={region.id}
          region={region}
          now={now}
          onClick={() => onRegionClick(region.id)}
          isActive={activeRegionId === region.id}
        />
      ))}
    </div>
  );
}
