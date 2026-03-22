import { ALL_TIMEZONES, type TimezoneEntry } from "@/data/timezone-data";
import { getFlagForTimezone } from "@/lib/timezone-flags";
import { getRegionHour, getRegionMinute } from "@/lib/timezone-utils";
import { getGradientForHour } from "@/lib/sky-gradients";

// Get UTC offset in minutes for a timezone (negative = west, positive = east)
function getUtcOffset(timezone: string, now: Date): number {
  const utcStr = now.toLocaleString("en-US", { timeZone: "UTC" });
  const tzStr = now.toLocaleString("en-US", { timeZone: timezone });
  return new Date(tzStr).getTime() - new Date(utcStr).getTime();
}

export interface Region {
  id: string;
  name: string;
  city: string;
  timezone: string;
  coordinates: [number, number]; // [lat, lon]
  color: [number, number, number]; // RGB 0-1 for COBE marker
  flag: string; // Country flag emoji
}

// Parse hex color string to [r,g,b] tuple (0-1 range)
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ];
}

// Get the sky gradient color for a timezone's current hour
function skyColorForTimezone(timezone: string, now: Date): [number, number, number] {
  const hour = getRegionHour(timezone, now);
  const minute = getRegionMinute(timezone, now);
  const gradient = getGradientForHour(hour + minute / 60);
  // Use the midpoint 'via' color for a representative sky tone
  return hexToRgb(gradient.via);
}

export function regionsFromTimezones(timezoneIds: string[], now?: Date): Region[] {
  const currentTime = now ?? new Date();
  return timezoneIds
    .map((tzId) => {
      const entry = ALL_TIMEZONES.find((t) => t.timezone === tzId);
      if (!entry) return null;
      return {
        id: tzId.replace(/\//g, "-").toLowerCase(),
        name: entry.continent,
        city: entry.label,
        timezone: entry.timezone,
        coordinates: entry.coordinates as [number, number],
        color: skyColorForTimezone(tzId, currentTime),
        flag: getFlagForTimezone(tzId),
      };
    })
    .filter((r): r is Region => r !== null)
    .sort((a, b) => {
      // Sort by UTC offset (west → east)
      const aOff = getUtcOffset(a.timezone, currentTime);
      const bOff = getUtcOffset(b.timezone, currentTime);
      return aOff - bOff;
    });
}

// Generate arc pairs — connect every region to its nearest neighbor by longitude (chain)
export function generateArcs(
  regionList: Region[]
): Array<{ from: [number, number]; to: [number, number] }> {
  if (regionList.length < 2) return [];
  const arcs: Array<{ from: [number, number]; to: [number, number] }> = [];
  const sorted = [...regionList].sort(
    (a, b) => a.coordinates[1] - b.coordinates[1]
  );

  for (let i = 0; i < sorted.length; i++) {
    const next = sorted[(i + 1) % sorted.length];
    arcs.push({
      from: sorted[i].coordinates,
      to: next.coordinates,
    });
  }

  return arcs;
}
