// Module-level cache for Intl.DateTimeFormat instances (expensive to construct)
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getCachedFormatter(locale: string | undefined, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale ?? "default"}|${JSON.stringify(options)}`;
  let fmt = formatterCache.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(locale, options);
    formatterCache.set(key, fmt);
  }
  return fmt;
}

// Combined time parts — single Intl.DateTimeFormat call instead of 3 separate ones
export function getRegionTimeParts(timezone: string, now: Date = new Date()): { hour: number; minute: number; second: number } {
  const parts = getCachedFormatter("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  return {
    hour: parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10),
    minute: parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10),
    second: parseInt(parts.find((p) => p.type === "second")?.value || "0", 10),
  };
}

/**
 * Wall-clock field values for a timezone. Use this (with Date.UTC) for any
 * arithmetic. A Date built from these parts via the plain `new Date(y, m, d,
 * ...)` constructor lands in the *browser's* timezone, so browser DST
 * gaps/overlaps would skew an unrelated timezone's math.
 */
export function getRegionDateParts(
  timezone: string,
  now: Date = new Date()
): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const parts = getCachedFormatter("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || "0", 10);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    // Intl can emit hour "24" for midnight under hour12:false in some engines.
    hour: get("hour") % 24,
    minute: get("minute"),
    second: get("second"),
  };
}

export function getRegionHour(timezone: string, now: Date = new Date()): number {
  return getRegionTimeParts(timezone, now).hour;
}

export function getRegionMinute(timezone: string, now: Date = new Date()): number {
  return getRegionTimeParts(timezone, now).minute;
}

export function getRegionSecond(timezone: string, now: Date = new Date()): number {
  return getRegionTimeParts(timezone, now).second;
}

export function formatTime(timezone: string, now: Date = new Date(), is24h: boolean = false): string {
  return getCachedFormatter("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: !is24h,
  }).format(now);
}

export function formatTimeFull(timezone: string, now: Date = new Date(), is24h: boolean = false): string {
  return getCachedFormatter("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: !is24h,
  }).format(now);
}

/**
 * Offset of `timezone` relative to the viewer's timezone, in minutes.
 *
 * Both sides go through UTC-anchored arithmetic so sub-hour zones (+05:45
 * Kathmandu, +08:45 Eucla, +12:45 Chatham, the many :30 zones) are exact and
 * the viewer's own DST rules can't contaminate the result.
 */
export function getOffsetMinutesFromLocal(
  timezone: string,
  now: Date = new Date()
): number {
  const localTz = getCachedFormatter(undefined, {}).resolvedOptions().timeZone;
  return getUtcOffsetMinutes(timezone, now) - getUtcOffsetMinutes(localTz, now);
}

export function formatOffsetMinutes(offsetMinutes: number): string {
  if (offsetMinutes === 0) return "same time";
  const sign = offsetMinutes > 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  if (hours === 0) return `${sign}${minutes}m`;
  if (minutes === 0) return `${sign}${hours}h`;
  return `${sign}${hours}h ${minutes}m`;
}

export function isWorkingHours(timezone: string, now: Date = new Date()): boolean {
  const hour = getRegionHour(timezone, now);
  return hour >= 9 && hour < 17;
}

export function isAwake(timezone: string, now: Date = new Date()): boolean {
  const hour = getRegionHour(timezone, now);
  return hour >= 8 && hour < 22;
}

export function formatDate(now: Date = new Date()): string {
  return getCachedFormatter("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);
}

export function getDayDifference(timezone: string, localTimezone: string, now: Date = new Date()): string | null {
  const opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  // Use formatToParts for locale-safe date extraction. UTC arithmetic keeps the
  // viewer's DST rules from turning a day boundary into a 23h/25h span.
  const getDay = (tz: string) => {
    const parts = getCachedFormatter("en-US", { ...opts, timeZone: tz }).formatToParts(now);
    const year = parseInt(parts.find((p) => p.type === "year")!.value);
    const month = parseInt(parts.find((p) => p.type === "month")!.value);
    const day = parseInt(parts.find((p) => p.type === "day")!.value);
    return Date.UTC(year, month - 1, day);
  };

  const localD = getDay(localTimezone);
  const remoteD = getDay(timezone);
  if (localD === remoteD) return null;

  const diffDays = Math.round((remoteD - localD) / 86400000);

  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1) return `+${diffDays} days`;
  if (diffDays < -1) return `${diffDays} days`;
  return null;
}

export function getUtcOffsetMinutes(timezone: string, date: Date): number {
  const p = getRegionDateParts(timezone, date);
  // Build a UTC timestamp from the timezone's local representation; the delta
  // against the real instant is the zone's offset.
  const tzAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return Math.round((tzAsUtc - Math.floor(date.getTime() / 60000) * 60000) / 60000);
}

export function getNextDstTransition(
  timezone: string,
  now: Date = new Date()
): { type: "spring-forward" | "fall-back"; date: Date; daysUntil: number } | null {
  // Check offsets at noon each day across ±7 days to detect DST transitions
  const offsets: { day: number; offset: number; date: Date }[] = [];

  for (let d = -8; d <= 7; d++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + d);
    checkDate.setHours(12, 0, 0, 0);
    offsets.push({ day: d, offset: getUtcOffsetMinutes(timezone, checkDate), date: checkDate });
  }

  // Find transitions: compare each consecutive pair
  for (let i = 1; i < offsets.length; i++) {
    const prev = offsets[i - 1];
    const curr = offsets[i];
    if (prev.offset !== curr.offset) {
      const type = curr.offset > prev.offset ? "spring-forward" : "fall-back";
      return { type, date: curr.date, daysUntil: curr.day };
    }
  }

  return null;
}

export function formatDateLong(timezone: string, now: Date = new Date()): string {
  return getCachedFormatter("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);
}

/**
 * Format an Open-Meteo sunrise/sunset value.
 *
 * With `timezone=auto` the API returns a bare local wall-clock string for the
 * *queried location* (e.g. "2026-08-05T05:32") with no UTC offset. `new Date()`
 * would parse that as the viewer's local time and shift it, so read the fields
 * straight off the string instead of round-tripping through Date.
 */
export function formatSunTime(isoString: string, is24h?: boolean): string {
  const m = /T(\d{2}):(\d{2})/.exec(isoString);
  if (!m) return "";
  const hour = parseInt(m[1], 10) % 24;
  const minute = parseInt(m[2], 10);
  const mm = String(minute).padStart(2, "0");
  if (is24h) return `${String(hour).padStart(2, "0")}:${mm}`;
  const suffix = hour < 12 ? "AM" : "PM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${mm} ${suffix}`;
}

export function getTimezoneAbbr(timezone: string, now: Date = new Date()): string {
  const parts = getCachedFormatter("en-US", {
    timeZone: timezone,
    timeZoneName: "short",
  }).formatToParts(now);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
}

export interface DevInfo {
  iso: string;
  unix: number;
  week: number;
  dayOfYear: number;
  isDST: boolean;
  utcOffset: string;
}

export function getDevInfo(timezone: string, now: Date = new Date()): DevInfo {
  // Get the timezone's current offset via formatting
  const shortOffset = getCachedFormatter("en-US", {
    timeZone: timezone,
    timeZoneName: "shortOffset",
  }).formatToParts(now).find((p) => p.type === "timeZoneName")?.value ?? "UTC";

  // Parse offset string like "GMT-7" or "GMT+5:30" into total minutes
  let offsetMinutes = 0;
  const offsetMatch = shortOffset.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (offsetMatch) {
    const sign = offsetMatch[1] === "+" ? 1 : -1;
    const hours = parseInt(offsetMatch[2], 10);
    const mins = parseInt(offsetMatch[3] || "0", 10);
    offsetMinutes = sign * (hours * 60 + mins);
  }

  // Build ISO 8601 string for the timezone
  const p = getRegionDateParts(timezone, now);
  const absH = Math.floor(Math.abs(offsetMinutes) / 60);
  const absM = Math.abs(offsetMinutes) % 60;
  const offsetSign = offsetMinutes >= 0 ? "+" : "-";
  const offsetFormatted = `${offsetSign}${String(absH).padStart(2, "0")}:${String(absM).padStart(2, "0")}`;

  const pad = (n: number) => String(n).padStart(2, "0");
  const iso =
    `${p.year}-${pad(p.month)}-${pad(p.day)}` +
    `T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}` +
    offsetFormatted;

  // Unix timestamp (same for all timezones)
  const unix = Math.floor(now.getTime() / 1000);

  // ISO week number. All day arithmetic runs in UTC so the viewer's own DST
  // transitions can't shift a 24h step into 23h/25h and skew the result.
  const regionDayUtc = Date.UTC(p.year, p.month - 1, p.day);
  const dayOfWeek = new Date(regionDayUtc).getUTCDay() || 7; // Mon=1 .. Sun=7
  const thursday = regionDayUtc + (4 - dayOfWeek) * 86400000;
  const thursdayYear = new Date(thursday).getUTCFullYear();
  const yearStart = Date.UTC(thursdayYear, 0, 1);
  const week = Math.ceil(((thursday - yearStart) / 86400000 + 1) / 7);

  // Day of year
  const startOfYear = Date.UTC(p.year, 0, 0);
  const dayOfYear = Math.round((regionDayUtc - startOfYear) / 86400000);

  // DST detection: compare current offset to January offset (standard time for northern hemisphere)
  // and July offset (standard time for southern hemisphere) — if current differs from both extremes' min, it's DST
  const jan = new Date(now.getFullYear(), 0, 1);
  const jul = new Date(now.getFullYear(), 6, 1);

  const getOffset = (d: Date) => {
    const s = getCachedFormatter("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    }).formatToParts(d).find((p) => p.type === "timeZoneName")?.value ?? "UTC";
    const m = s.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!m) return 0;
    return (m[1] === "+" ? 1 : -1) * (parseInt(m[2], 10) * 60 + parseInt(m[3] || "0", 10));
  };

  const janOffset = getOffset(jan);
  const julOffset = getOffset(jul);
  const standardOffset = Math.min(janOffset, julOffset);
  const isDST = offsetMinutes !== standardOffset && janOffset !== julOffset;

  const utcOffset = `UTC${offsetFormatted}`;

  return { iso, unix, week, dayOfYear, isDST, utcOffset };
}
