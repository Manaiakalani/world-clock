/**
 * Single source of truth for anything that needs to know where this app lives.
 *
 * The URL is read from the environment so a self-hosted deploy can set its own
 * origin. It previously lived as a hardcoded `worldclock.example.com` in both
 * robots.txt and security.txt, which meant every deployment advertised a
 * placeholder domain to crawlers and security researchers.
 */
const FALLBACK_URL = "http://localhost:3009";

function readSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return FALLBACK_URL;
  // A trailing slash here turns every derived URL into a double-slashed one.
  const withProtocol = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, "");
}

export const siteUrl = readSiteUrl();

export const siteConfig = {
  name: "World Clock",
  title: "World Clock — Global Timezone Tracker for Distributed Teams",
  shortDescription:
    "Track teammates across timezones with a 3D globe, live weather, and a meeting planner.",
  description:
    "A free, privacy-first world clock for distributed teams. Compare time zones on an interactive 3D globe, see live local weather and sky-coloured day/night cards, and find meeting times that work for everyone — no account, no tracking, no cookies.",
  url: siteUrl,
  repository: "https://github.com/Manaiakalani/world-clock",
  author: "Manaiakalani",
  locale: "en_US",
  keywords: [
    "world clock",
    "time zone converter",
    "timezone tracker",
    "meeting planner",
    "distributed teams",
    "remote work",
    "time zone comparison",
    "global team clock",
    "3d globe",
    "utc offset",
    "daylight saving time",
    "working hours overlap",
    "team time zones",
    "international time",
  ],
} as const;
