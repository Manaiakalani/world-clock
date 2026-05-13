import { ALL_TIMEZONES } from "@/data/timezone-data";

/**
 * Maps common abbreviations, informal names, and city nicknames to IANA timezone IDs.
 * Values are arrays because some abbreviations are ambiguous (e.g. IST → India, Israel, Ireland).
 */
const TIMEZONE_ALIAS_MAP: Record<string, string[]> = {
  // US Standard
  est: ["America/New_York"],
  cst: ["America/Chicago"],
  mst: ["America/Denver"],
  pst: ["America/Los_Angeles"],
  // US Daylight
  edt: ["America/New_York"],
  cdt: ["America/Chicago"],
  mdt: ["America/Denver"],
  pdt: ["America/Los_Angeles"],
  // US informal
  eastern: ["America/New_York"],
  "eastern time": ["America/New_York"],
  central: ["America/Chicago"],
  "central time": ["America/Chicago"],
  mountain: ["America/Denver"],
  "mountain time": ["America/Denver"],
  pacific: ["America/Los_Angeles"],
  "pacific time": ["America/Los_Angeles"],
  // Alaska & Hawaii
  akst: ["America/Anchorage"],
  akdt: ["America/Anchorage"],
  hst: ["Pacific/Honolulu"],
  hast: ["Pacific/Honolulu"],
  hadt: ["America/Adak"],
  // Europe
  gmt: ["Etc/GMT", "Europe/London"],
  utc: ["Etc/UTC"],
  wet: ["Europe/Lisbon"],
  west: ["Europe/Lisbon"],
  bst: ["Europe/London"],
  cet: ["Europe/Berlin", "Europe/Paris", "Europe/Rome"],
  cest: ["Europe/Berlin", "Europe/Paris", "Europe/Rome"],
  eet: ["Europe/Bucharest", "Europe/Helsinki", "Europe/Athens"],
  eest: ["Europe/Bucharest", "Europe/Helsinki", "Europe/Athens"],
  msk: ["Europe/Moscow"],
  // Asia
  ist: ["Asia/Kolkata", "Asia/Jerusalem", "Europe/Dublin"],
  "india standard time": ["Asia/Kolkata"],
  "indian time": ["Asia/Kolkata"],
  jst: ["Asia/Tokyo"],
  kst: ["Asia/Seoul"],
  cst_asia: ["Asia/Shanghai"],
  ckt: ["Asia/Shanghai"],
  hkt: ["Asia/Hong_Kong"],
  sgt: ["Asia/Singapore"],
  pht: ["Asia/Manila"],
  ict: ["Asia/Bangkok"],
  wib: ["Asia/Jakarta"],
  wita: ["Asia/Makassar"],
  wit: ["Asia/Jayapura"],
  mmt: ["Asia/Yangon"],
  npt: ["Asia/Kathmandu"],
  pkt: ["Asia/Karachi"],
  aft: ["Asia/Kabul"],
  irst: ["Asia/Tehran"],
  gst: ["Asia/Dubai"],
  // Australia & NZ
  aest: ["Australia/Sydney"],
  aedt: ["Australia/Sydney"],
  acst: ["Australia/Adelaide"],
  acdt: ["Australia/Adelaide"],
  awst: ["Australia/Perth"],
  nzst: ["Pacific/Auckland"],
  nzdt: ["Pacific/Auckland"],
  // South America
  brt: ["America/Sao_Paulo"],
  art: ["America/Argentina/Buenos_Aires"],
  clt: ["America/Santiago"],
  cot: ["America/Bogota"],
  pet: ["America/Lima"],
  vet: ["America/Caracas"],
  // Africa
  cat: ["Africa/Johannesburg"],
  eat: ["Africa/Nairobi"],
  wat: ["Africa/Lagos"],
  sast: ["Africa/Johannesburg"],

  // Popular city nicknames
  nyc: ["America/New_York"],
  "new york": ["America/New_York"],
  la: ["America/Los_Angeles"],
  "los angeles": ["America/Los_Angeles"],
  sf: ["America/Los_Angeles"],
  "san francisco": ["America/Los_Angeles"],
  dc: ["America/New_York"],
  washington: ["America/New_York"],
  "washington dc": ["America/New_York"],
  chicago: ["America/Chicago"],
  denver: ["America/Denver"],
  seattle: ["America/Los_Angeles"],
  miami: ["America/New_York"],
  boston: ["America/New_York"],
  dallas: ["America/Chicago"],
  houston: ["America/Chicago"],
  phoenix: ["America/Phoenix"],
  atlanta: ["America/New_York"],
  detroit: ["America/Detroit"],
  milwaukee: ["America/Chicago"],
  minneapolis: ["America/Chicago"],
  "las vegas": ["America/Los_Angeles"],
  mumbai: ["Asia/Kolkata"],
  bangalore: ["Asia/Kolkata"],
  bengaluru: ["Asia/Kolkata"],
  delhi: ["Asia/Kolkata"],
  "new delhi": ["Asia/Kolkata"],
  chennai: ["Asia/Kolkata"],
  hyderabad: ["Asia/Kolkata"],
  kolkata: ["Asia/Kolkata"],
  pune: ["Asia/Kolkata"],
  beijing: ["Asia/Shanghai"],
  shanghai: ["Asia/Shanghai"],
  shenzhen: ["Asia/Shanghai"],
  guangzhou: ["Asia/Shanghai"],
  seoul: ["Asia/Seoul"],
  busan: ["Asia/Seoul"],
  osaka: ["Asia/Tokyo"],
  melbourne: ["Australia/Melbourne"],
  brisbane: ["Australia/Brisbane"],
  perth: ["Australia/Perth"],
  auckland: ["Pacific/Auckland"],
  wellington: ["Pacific/Auckland"],
  "tel aviv": ["Asia/Jerusalem"],
  jerusalem: ["Asia/Jerusalem"],
  amsterdam: ["Europe/Amsterdam"],
  zurich: ["Europe/Zurich"],
  geneva: ["Europe/Zurich"],
  munich: ["Europe/Berlin"],
  frankfurt: ["Europe/Berlin"],
  barcelona: ["Europe/Madrid"],
  milan: ["Europe/Rome"],
  vienna: ["Europe/Vienna"],
  prague: ["Europe/Prague"],
  warsaw: ["Europe/Warsaw"],
  stockholm: ["Europe/Stockholm"],
  copenhagen: ["Europe/Copenhagen"],
  oslo: ["Europe/Oslo"],
  dublin: ["Europe/Dublin"],
  edinburgh: ["Europe/London"],
  manchester: ["Europe/London"],
  lisbon: ["Europe/Lisbon"],
  porto: ["Europe/Lisbon"],
  "kuala lumpur": ["Asia/Kuala_Lumpur"],
  jakarta: ["Asia/Jakarta"],
  hanoi: ["Asia/Ho_Chi_Minh"],
  "ho chi minh": ["Asia/Ho_Chi_Minh"],
  saigon: ["Asia/Ho_Chi_Minh"],
  taipei: ["Asia/Taipei"],
  dhaka: ["Asia/Dhaka"],
  karachi: ["Asia/Karachi"],
  riyadh: ["Asia/Riyadh"],
  doha: ["Asia/Qatar"],
  nairobi: ["Africa/Nairobi"],
  "cape town": ["Africa/Johannesburg"],
  "sao paulo": ["America/Sao_Paulo"],
  "buenos aires": ["America/Argentina/Buenos_Aires"],
  santiago: ["America/Santiago"],
  bogota: ["America/Bogota"],
  lima: ["America/Lima"],
  "mexico city": ["America/Mexico_City"],
  toronto: ["America/Toronto"],
  vancouver: ["America/Vancouver"],
  montreal: ["America/Toronto"],
  calgary: ["America/Edmonton"],
  honolulu: ["Pacific/Honolulu"],
  anchorage: ["America/Anchorage"],
};

// Pre-build a Set of all IANA IDs in ALL_TIMEZONES for fast membership checks
const KNOWN_TIMEZONES = new Set(ALL_TIMEZONES.map((tz) => tz.timezone));

/**
 * Parse a UTC/GMT offset string like "UTC+8", "GMT-5", "UTC+5:30", "GMT+0" into
 * total offset minutes. Returns null if not a valid offset pattern.
 */
function parseOffsetQuery(query: string): number | null {
  const match = query.match(
    /^(?:utc|gmt)\s*([+-])\s*(\d{1,2})(?::(\d{2}))?$/
  );
  if (!match) return null;
  const sign = match[1] === "+" ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3] || "0", 10);
  if (hours > 14 || minutes > 59) return null;
  return sign * (hours * 60 + minutes);
}

/**
 * Get the current UTC offset in minutes for a given IANA timezone.
 */
function getCurrentOffsetMinutes(timezone: string): number {
  const now = new Date();
  // Intl gives us the offset implicitly — format a date in the tz and in UTC, then diff
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value || "0", 10);
  const tzDate = new Date(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second")
  );

  const utcFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const utcParts = utcFmt.formatToParts(now);
  const getUtc = (type: string) =>
    parseInt(utcParts.find((p) => p.type === type)?.value || "0", 10);
  const utcDate = new Date(
    getUtc("year"),
    getUtc("month") - 1,
    getUtc("day"),
    getUtc("hour"),
    getUtc("minute"),
    getUtc("second")
  );

  return Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
}

/**
 * Find all known IANA timezones that currently have the given UTC offset (in minutes).
 * Returns representative timezones (one per major region) to keep results manageable.
 */
function findTimezonesForOffset(offsetMinutes: number): string[] {
  const matches: string[] = [];
  for (const tz of ALL_TIMEZONES) {
    try {
      if (getCurrentOffsetMinutes(tz.timezone) === offsetMinutes) {
        matches.push(tz.timezone);
      }
    } catch {
      // skip invalid
    }
  }
  // Dedupe by picking distinct representative cities (limit to 8 to stay useful)
  return matches.slice(0, 8);
}

/**
 * Resolve a natural-language timezone query to matching IANA timezone IDs.
 *
 * Handles:
 * - Abbreviations: "EST", "CET", "JST", etc.
 * - Informal names: "Eastern", "Pacific Time"
 * - City nicknames: "NYC", "LA", "Mumbai"
 * - UTC offsets: "UTC+8", "GMT-5", "UTC+5:30"
 *
 * Returns an array of IANA timezone IDs (may be empty if nothing matches).
 * The `matchLabel` on the return helps the UI show "via EST" hints.
 */
export interface AliasMatch {
  timezone: string;
  matchedVia: string; // e.g. "EST", "UTC+8", "NYC"
}

export function resolveTimezoneQuery(query: string): AliasMatch[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const seen = new Set<string>();
  const results: AliasMatch[] = [];

  function addResult(tz: string, via: string) {
    if (seen.has(tz)) return;
    if (!KNOWN_TIMEZONES.has(tz)) return;
    seen.add(tz);
    results.push({ timezone: tz, matchedVia: via });
  }

  // 1. Direct alias lookup (exact match)
  const directAlias = TIMEZONE_ALIAS_MAP[q];
  if (directAlias) {
    const label = query.trim().toUpperCase();
    for (const tz of directAlias) {
      addResult(tz, label);
    }
  }

  // 2. Partial alias matching (query is a prefix or substring of an alias key)
  if (q.length >= 2) {
    for (const [key, timezones] of Object.entries(TIMEZONE_ALIAS_MAP)) {
      if (key === q) continue; // already handled above
      if (key.startsWith(q) || key.includes(q)) {
        const label = key.toUpperCase();
        for (const tz of timezones) {
          addResult(tz, label);
        }
      }
    }
  }

  // 3. UTC/GMT offset pattern
  const offset = parseOffsetQuery(q);
  if (offset !== null) {
    const label = query.trim().toUpperCase();
    const offsetMatches = findTimezonesForOffset(offset);
    for (const tz of offsetMatches) {
      addResult(tz, label);
    }
  }

  return results;
}
