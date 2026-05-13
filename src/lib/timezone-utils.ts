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

export function getRegionTime(timezone: string, now: Date = new Date()): Date {
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
  return new Date(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
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

export function getOffsetFromLocal(
  timezone: string,
  now: Date = new Date()
): number {
  const localTz = getCachedFormatter(undefined, {}).resolvedOptions().timeZone;
  const localDate = getRegionTime(localTz, now);
  const remoteDate = getRegionTime(timezone, now);
  return Math.round((remoteDate.getTime() - localDate.getTime()) / (1000 * 60 * 60));
}

export function formatOffset(offsetHours: number): string {
  if (offsetHours === 0) return "same time";
  const sign = offsetHours > 0 ? "+" : "";
  const abs = Math.abs(offsetHours);
  return `${sign}${offsetHours}${abs === 1 ? " hour" : " hours"}`;
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

  // Use formatToParts for locale-safe date extraction
  const getDay = (tz: string) => {
    const parts = getCachedFormatter("en-US", { ...opts, timeZone: tz }).formatToParts(now);
    const year = parseInt(parts.find((p) => p.type === "year")!.value);
    const month = parseInt(parts.find((p) => p.type === "month")!.value);
    const day = parseInt(parts.find((p) => p.type === "day")!.value);
    return new Date(year, month - 1, day).getTime();
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

function getUtcOffsetMinutes(timezone: string, date: Date): number {
  const parts = getCachedFormatter("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || "0", 10);
  const tzYear = get("year");
  const tzMonth = get("month");
  const tzDay = get("day");
  const tzHour = get("hour") % 24;
  const tzMinute = get("minute");

  // Build a UTC timestamp from the timezone's local representation
  const tzAsUtc = Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute);
  // The offset is the difference between the timezone's local time (interpreted as UTC) and the actual UTC instant
  return Math.round((tzAsUtc - date.getTime()) / 60000);
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

export function formatSunTime(timezone: string, isoString: string, is24h?: boolean): string {
  return getCachedFormatter("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: !is24h,
  }).format(new Date(isoString));
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
  const regionTime = getRegionTime(timezone, now);
  const absH = Math.floor(Math.abs(offsetMinutes) / 60);
  const absM = Math.abs(offsetMinutes) % 60;
  const offsetSign = offsetMinutes >= 0 ? "+" : "-";
  const offsetFormatted = `${offsetSign}${String(absH).padStart(2, "0")}:${String(absM).padStart(2, "0")}`;

  const iso =
    `${regionTime.getFullYear()}-${String(regionTime.getMonth() + 1).padStart(2, "0")}-${String(regionTime.getDate()).padStart(2, "0")}` +
    `T${String(regionTime.getHours()).padStart(2, "0")}:${String(regionTime.getMinutes()).padStart(2, "0")}:${String(regionTime.getSeconds()).padStart(2, "0")}` +
    offsetFormatted;

  // Unix timestamp (same for all timezones)
  const unix = Math.floor(now.getTime() / 1000);

  // ISO week number
  const regionDate = new Date(regionTime.getFullYear(), regionTime.getMonth(), regionTime.getDate());
  const dayOfWeek = regionDate.getDay() || 7; // Mon=1 .. Sun=7
  const thursday = new Date(regionDate);
  thursday.setDate(regionDate.getDate() + 4 - dayOfWeek);
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  // Day of year
  const startOfYear = new Date(regionTime.getFullYear(), 0, 0);
  const diff = regionDate.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / 86400000);

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
