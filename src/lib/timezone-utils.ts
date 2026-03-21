export function getRegionTime(timezone: string, now: Date = new Date()): Date {
  const str = now.toLocaleString("en-US", { timeZone: timezone });
  return new Date(str);
}

export function getRegionHour(timezone: string, now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);

  const hourPart = parts.find((p) => p.type === "hour");
  return hourPart ? parseInt(hourPart.value, 10) : 0;
}

export function getRegionMinute(timezone: string, now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    minute: "numeric",
  }).formatToParts(now);

  const minutePart = parts.find((p) => p.type === "minute");
  return minutePart ? parseInt(minutePart.value, 10) : 0;
}

export function getRegionSecond(timezone: string, now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    second: "numeric",
  }).formatToParts(now);

  const secondPart = parts.find((p) => p.type === "second");
  return secondPart ? parseInt(secondPart.value, 10) : 0;
}

export function formatTime(timezone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);
}

export function formatTimeFull(timezone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
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
