import { ALL_TIMEZONES, type TimezoneEntry } from "@/data/timezone-data";
import { getPlaceOverride, resolveTimezone } from "@/data/places";
import { getFlagForTimezone } from "@/lib/timezone-flags";
import { getRegionHour, getRegionMinute, getUtcOffsetMinutes } from "@/lib/timezone-utils";
import { getGradientForHour } from "@/lib/sky-gradients";

// Pre-index for O(1) lookups instead of O(n) .find() per timezone
const TIMEZONE_INDEX = new Map<string, TimezoneEntry>(
  ALL_TIMEZONES.map((tz) => [tz.timezone, tz])
);

export interface Region {
  /** Slugified id, safe for DOM ids and React keys. */
  id: string;
  /**
   * The original place id this region was built from — an IANA zone or an
   * aliased 'tz#place' string. Persist *this*, never the resolved timezone, or
   * aliased places (e.g. Redmond) collapse into their base zone.
   */
  placeId: string;
  name: string;
  city: string;
  /** Resolved IANA timezone for time/date math. */
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

/** True if a place id maps to a timezone we actually have data for. */
export function isKnownPlaceId(placeId: string): boolean {
  return TIMEZONE_INDEX.has(resolveTimezone(placeId));
}

export function regionsFromTimezones(placeIds: string[], now?: Date, customOrder?: boolean): Region[] {
  const currentTime = now ?? new Date();
  const regions = placeIds
    .map((placeId) => {
      const tz = resolveTimezone(placeId);
      const override = getPlaceOverride(placeId);
      const entry = TIMEZONE_INDEX.get(tz);
      if (!entry) return null;

      const label = override?.label ?? entry.label;
      const continent = override?.continent ?? entry.continent;
      const coordinates = (override?.coordinates ?? entry.coordinates) as [number, number];
      const flag = override?.flag ?? getFlagForTimezone(tz);

      return {
        id: placeId.replace(/[\/#]/g, "-").toLowerCase(),
        placeId,
        name: continent,
        city: label,
        timezone: tz,
        coordinates,
        color: skyColorForTimezone(tz, currentTime),
        flag,
      };
    })
    .filter((r): r is Region => r !== null);

  // When customOrder is true, preserve the input array order (user-defined).
  // Otherwise sort by UTC offset (west → east).
  if (!customOrder) {
    regions.sort((a, b) => {
      const aOff = getUtcOffsetMinutes(a.timezone, currentTime);
      const bOff = getUtcOffsetMinutes(b.timezone, currentTime);
      return aOff - bOff;
    });
  }

  return regions;
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
