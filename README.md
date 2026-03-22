# World Clock

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js 22+](https://img.shields.io/badge/Node.js-22%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](Dockerfile)

**World Clock** is a beautiful global timezone tracker for distributed teams. It combines an interactive 3D COBE globe, real-time weather data, sky-gradient backgrounds that match each timezone's time of day, an analog clock with flag avatars, and a meeting planner for finding overlapping work hours — all in a single, fast, privacy-first web app.

---

## Highlights

### Core Features

| Feature | Details |
| --- | --- |
| 🌍 **3D Globe** | Interactive COBE globe with sky-colored markers and arc connections |
| 🕐 **Analog Clock** | SVG clock with country flag avatars positioned at each timezone's hour |
| 🌅 **Sky Gradients** | Region cards use dynamic gradients matching time of day (dawn → day → dusk → night) |
| 🌤️ **Live Weather** | Temperature, conditions, and emoji from Open-Meteo (free, no API key) |
| 📅 **Meeting Planner** | Visual grid showing overlapping working hours across all timezones (⌘M) |
| 🔍 **Quick Search** | Cmd+K palette to instantly add/remove timezones with keyboard navigation |
| 🔗 **Shareable URLs** | Share your timezone selection via URL parameters |
| 🏷️ **Timezone Presets** | One-click Americas, Europe, APAC, Africa preset groups |

### UX & Design

- 🌓 **Dark / Light mode** — smooth CSS transition, respects OS preference
- 🎨 **Aurora background** — WebGL atmospheric scattering shader (pauses when tab hidden)
- 🏳️ **Country flags** — emoji flags on cards, clock, and globe
- 📱 **Responsive** — mobile, tablet (with globe), and desktop layouts
- ⌨️ **Keyboard shortcuts** — ⌘K search, ⌘, settings, ⌘M meeting planner, Esc close
- ♿ **Accessible** — focus rings, skip-to-content, aria-live clock, screen reader labels
- 📲 **PWA** — installable as a native app on mobile and desktop
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

Available at [http://localhost:3100](http://localhost:3100).

### Production Build

```bash
npm run build
npm run start
```

---

## Docker

### Build & Run

```bash
docker build -t world-clock .
docker run -d -p 3100:3000 --name world-clock world-clock
```

### Docker Compose

```bash
docker compose up -d            # start
docker compose logs -f          # view logs
docker compose down             # stop
```

---

## Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `⌘K` | Quick search — add/remove timezones |
| `⌘,` | Manage timezones |
| `⌘M` | Meeting planner |
| `Esc` | Close panel |

---

## Project Structure

```
world-clock/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, fonts, PWA, viewport
│   │   ├── page.tsx                # Main orchestrator — all hooks + UI
│   │   └── globals.css             # Tailwind + animations + themes
│   ├── components/
│   │   ├── globe-viewer.tsx        # COBE 3D globe with dynamic markers
│   │   ├── analog-clock.tsx        # SVG clock with flag avatars
│   │   ├── aurora-background.tsx   # WebGL atmospheric scattering
│   │   ├── region-card.tsx         # Sky-gradient timezone card
│   │   ├── region-list.tsx         # Sorted card list
│   │   ├── meeting-planner.tsx     # Working hours overlap grid
│   │   ├── quick-search.tsx        # ⌘K search palette
│   │   ├── timezone-manager.tsx    # Full timezone manager with presets
│   │   ├── header.tsx              # Animated globe icon + date
│   │   ├── about-dialog.tsx        # About, privacy, shortcuts
│   │   └── ui/                     # shadcn/ui primitives
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # Utilities, sky gradients, weather
│   └── data/                       # Timezone database, regions
├── tests/                          # Playwright responsive tests
├── public/                         # PWA manifest, robots.txt, security.txt
├── Dockerfile                      # Multi-stage production build
├── docker-compose.yml              # One-command deployment
└── playwright.config.ts            # Test configuration
```

---

## Privacy

World Clock runs entirely in your browser. **No tracking, no telemetry, no cookies, no analytics, no accounts.** Timezone preferences and weather cache are stored in localStorage. Weather data is fetched from [Open-Meteo](https://open-meteo.com) (free, open-source API — no API key required).

## License

Released under the [MIT License](./LICENSE).

---

<p align="center">
  Built with Next.js, COBE, shadcn/ui, and Open-Meteo
</p>
