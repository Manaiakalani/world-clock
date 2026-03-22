// Combined time parts — single Intl.DateTimeFormat call instead of 3 separate ones
export function getRegionTimeParts(timezone: string, now: Date = new Date()): { hour: number; minute: number; second: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
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
  const str = now.toLocaleString("en-US", { timeZone: timezone });
  return new Date(str);
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
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: !is24h,
  }).format(now);
}

export function formatTimeFull(timezone: string, now: Date = new Date(), is24h: boolean = false): string {
  return new Intl.DateTimeFormat("en-US", {
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
  const localStr = now.toLocaleString("en-US", {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const remoteStr = now.toLocaleString("en-US", { timeZone: timezone });
  const localDate = new Date(localStr);
  const remoteDate = new Date(remoteStr);
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
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);
}

export function getDayDifference(timezone: string, localTimezone: string, now: Date = new Date()): string | null {
  const localDate = new Intl.DateTimeFormat("en-US", {
    timeZone: localTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const remoteDate = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  if (localDate === remoteDate) return null;

  // Parse dates to compare
  const [lm, ld, ly] = localDate.split("/").map(Number);
  const [rm, rd, ry] = remoteDate.split("/").map(Number);
  const localD = new Date(ly, lm - 1, ld);
  const remoteD = new Date(ry, rm - 1, rd);

  const diffMs = remoteD.getTime() - localD.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1) return `+${diffDays} days`;
  if (diffDays < -1) return `${diffDays} days`;
  return null;
}

export function getTimezoneAbbr(timezone: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "short",
  }).formatToParts(now);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
}
