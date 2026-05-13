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

export function getTimezoneAbbr(timezone: string, now: Date = new Date()): string {
  const parts = getCachedFormatter("en-US", {
    timeZone: timezone,
    timeZoneName: "short",
  }).formatToParts(now);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
}
