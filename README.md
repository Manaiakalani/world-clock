# World Clock

[![Version](https://img.shields.io/badge/version-1.0.0-0ea5e9.svg)](https://github.com/Manaiakalani/world-clock/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/Manaiakalani/world-clock/actions/workflows/ci.yml/badge.svg)](https://github.com/Manaiakalani/world-clock/actions/workflows/ci.yml)
[![Node.js 22+](https://img.shields.io/badge/Node.js-22%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](Dockerfile)

Knowing what time it is for your teammates shouldn't take mental arithmetic.

**World Clock** puts every region on one screen, each card lit by its own local
sky, so you can tell at a glance who's mid-morning and who's long asleep. Spin
the 3D globe to find a city, check the live weather before you suggest a
walk-and-talk, scrub the time slider to look ahead, and let the meeting planner
surface the hours that actually work for everyone.

No account. No tracking. No cookies. Self-hostable in one command.

---

## Highlights

### Core Features

| Feature | Details |
| --- | --- |
| 🌍 **3D Globe** | Interactive COBE globe with sky-colored markers and arc connections |
| 🕐 **Analog Clock** | SVG clock with country flag avatars positioned at each timezone's hour |
| 🌅 **Sky Gradients** | Region cards use dynamic gradients matching time of day (dawn → day → dusk → night) |
| 🌓 **Day / Night Dial** | Active cards reveal a 24h SVG dial with a sun/moon pip on the sunrise→sunset arc |
| 🌤️ **Live Weather** | Temperature, conditions, and emoji from Open-Meteo (free, no API key) |
| 📅 **Meeting Planner** | Visual grid showing overlapping working hours across all timezones |
| 🔍 **Quick Search** | Command palette to instantly add/remove timezones with keyboard navigation |
| ⏳ **Time Travel** | Scrub a time slider to see every region at a future or past moment |
| 🔗 **Shareable URLs** | Share your timezone selection via URL parameters |
| 🏷️ **Timezone Presets** | One-click Americas, Europe, APAC, Africa preset groups |

### Motion & Interaction

Motion here is tuned to be calm rather than busy — this is an app people leave
open all day.

- **Deadbeat second hand** — the second hand ticks once per second like a quartz
  movement instead of sweeping at 60fps. Calmer to sit beside, and dramatically
  cheaper to render.
- **Time-based globe rotation** — one revolution every 90 seconds, driven by
  elapsed time rather than frame count, so the speed is identical on a 60Hz
  laptop and a 144Hz monitor.
- **Momentum on drag** — flick the globe and it glides on, decaying naturally;
  drag it slowly and it stops where you let go. Velocity is smoothed over the
  last few pointer samples, so a flick-then-pause correctly means "stop".
  Grabbing a spinning globe stops it dead.
- **Reduced motion respected** — `prefers-reduced-motion` drops the animated
  backgrounds and transitions throughout.

### UX & Design

- 🌓 **Dark / Light mode** — smooth CSS transition, respects OS preference
- 🎨 **Aurora background** — WebGL atmospheric scattering shader (pauses when tab hidden)
- 🏳️ **Country flags** — emoji flags on cards, clock, and globe
- 📱 **Responsive** — mobile, tablet (with globe), and desktop layouts
- ⌨️ **Keyboard shortcuts** — platform-aware, showing ⌘ on macOS and Ctrl elsewhere
- ♿ **Accessible** — visible focus rings on every control, skip-to-content, aria-live clock, screen reader labels
- 📲 **Installable** — web app manifest with icons, theme colour and standalone display (no offline service worker)
- 🔒 **Privacy-first** — all data in localStorage, no cookies, no tracking, no accounts

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router + React 19 |
| Language | TypeScript (strict) |
| UI | shadcn/ui + Tailwind CSS v4 |
| Globe | COBE v2 (WebGL) |
| Background | Custom WebGL atmospheric scattering shader |
| Weather | Open-Meteo (free, no API key required) |
| Theme | next-themes (dark/light/system) |
| Testing | Playwright (responsive screenshots) |
| Container | Docker (multi-stage, Node 22 Alpine) |

---

## Getting Started

### Prerequisites

- **Node.js 22+** and **npm**
- Or **Docker** (no Node.js required)

### Quick Start (local)

```bash
git clone https://github.com/Manaiakalani/world-clock.git
cd world-clock
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Quick Start (Docker)

```bash
git clone https://github.com/Manaiakalani/world-clock.git
cd world-clock
docker compose up -d
```

Available at [http://localhost:3009](http://localhost:3009).

### Production Build

```bash
npm run build
npm run start
```

---

## Configuration

The app needs no configuration to run. One optional variable controls the
public origin advertised to crawlers and social previews:

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3009` | Origin used for `metadataBase`, the canonical link, Open Graph URLs, `robots.txt`, `sitemap.xml`, and `.well-known/security.txt` |
| `PORT` | `3009` | Host port published by `docker-compose.yml` |

`NEXT_PUBLIC_*` values are inlined into the client bundle at build time, so
`NEXT_PUBLIC_SITE_URL` must be set **when you build**, not when the container
starts. With Compose, put it in a `.env` file beside `docker-compose.yml`:

```bash
echo "NEXT_PUBLIC_SITE_URL=https://clock.example.com" > .env
docker compose up -d --build
```

Leaving it unset is harmless for private or LAN deployments — you simply get
localhost URLs in metadata that nothing is crawling anyway.

---

## Docker

### Build & Run

```bash
docker build -t world-clock .
docker run -d -p 3009:3009 --name world-clock world-clock
```

The image listens on port 3009 (`ENV PORT=3009`). `docker-compose.yml` publishes
`${PORT:-3009}:3009`, so set `PORT` in the environment to publish a different
host port.

### Docker Compose

```bash
docker compose up -d            # start
docker compose logs -f          # view logs
docker compose down             # stop
```

---

## Keyboard Shortcuts

Shown as ⌘ on macOS; use `Ctrl` on Windows and Linux. Both modifiers work
everywhere, and the About dialog labels them for your platform automatically.

| Key | Action |
| --- | --- |
| `⌘K` / `Ctrl K` | Quick search — add/remove timezones |
| `⌘,` / `Ctrl ,` | Manage timezones |
| `⌘M` / `Ctrl M` | Meeting planner |
| `⌘T` / `Ctrl T` | Time travel — toggle the time slider |
| `Esc` | Close panel |

---

## Project Structure

```
world-clock/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, fonts, metadata, JSON-LD, viewport
│   │   ├── page.tsx                # Main orchestrator — all hooks + UI
│   │   ├── globals.css             # Tailwind + animations + themes
│   │   ├── icon.tsx                # Generated favicon
│   │   ├── apple-icon.tsx          # Generated Apple touch icon
│   │   ├── opengraph-image.tsx     # Generated 1200×630 social card
│   │   ├── robots.ts               # Generated robots.txt
│   │   ├── sitemap.ts              # Generated sitemap.xml
│   │   └── .well-known/
│   │       └── security.txt/       # Generated RFC 9116 security.txt
│   ├── components/
│   │   ├── globe-viewer.tsx        # COBE 3D globe, drag + momentum
│   │   ├── analog-clock.tsx        # SVG clock with flag avatars
│   │   ├── aurora-background.tsx   # WebGL atmospheric scattering
│   │   ├── region-card.tsx         # Sky-gradient timezone card
│   │   ├── region-card-dial.tsx    # 24h day/night dial (shown when card expands)
│   │   ├── region-list.tsx         # Sorted card list
│   │   ├── meeting-planner.tsx     # Working hours overlap grid
│   │   ├── quick-search.tsx        # ⌘K search palette
│   │   ├── timezone-manager.tsx    # Full timezone manager with presets
│   │   ├── time-slider.tsx         # Time-travel scrubber
│   │   ├── header.tsx              # Animated globe icon + date
│   │   ├── about-dialog.tsx        # About, privacy, shortcuts
│   │   ├── error-boundary.tsx      # Client-side render error fallback
│   │   ├── providers.tsx           # Theme + app-level providers
│   │   └── ui/                     # shadcn/ui primitives
│   ├── hooks/                      # Clock, weather, storage, modal + motion hooks
│   ├── lib/                        # Time math, sky gradients, flags, weather, site config
│   └── data/                       # Timezone database, aliases, regions (multi-city-per-tz)
├── tests/                          # Playwright responsive + audit tests
├── public/                         # Web app manifest and static assets
├── .github/
│   ├── workflows/ci.yml            # Lint, typecheck, build, Playwright
│   ├── dependabot.yml              # npm, Actions and Docker updates
│   └── CODEOWNERS                  # Review routing
├── Dockerfile                      # Multi-stage production build
├── docker-compose.yml              # One-command deployment
├── SECURITY.md                     # Vulnerability disclosure policy
└── playwright.config.ts            # Test configuration
```

---

## Testing

```bash
npx playwright install chromium   # first run only
npm run test                      # full Playwright suite
npm run test -- --ui              # interactive runner
```

The suite covers responsive layouts across mobile, tablet, and desktop
viewports, plus an audit pass that captures screenshots into `screenshots/`.
CI runs lint, `tsc --noEmit`, the production build, and the full suite on every
pull request, and uploads the Playwright report as an artifact.

---

## Security

Security headers (CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`,
`Referrer-Policy`, `Permissions-Policy`) are set in `next.config.ts`. CI actions
are pinned to full commit SHAs and dependencies are hash-locked via
`package-lock.json`.

To report a vulnerability, see [SECURITY.md](./SECURITY.md). Please do not open
a public issue for security problems.

---

## Contributing

Issues and pull requests are welcome. Before opening a PR:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test
```

CI runs the same checks, so a green local run should mean a green PR.

---

## Privacy

World Clock runs entirely in your browser. **No tracking, no telemetry, no cookies, no analytics, no accounts.** Timezone preferences and weather cache are stored in localStorage. Weather data is fetched from [Open-Meteo](https://open-meteo.com) (free, open-source API — no API key required).

## License

Released under the [MIT License](./LICENSE).

---

<p align="center">
  Built with Next.js, COBE, shadcn/ui, and Open-Meteo
</p>
