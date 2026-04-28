---
name: Atmospheric World Clock
description: >
  A privacy-first global timezone tracker that turns time into atmosphere.
  A live WebGL atmospheric-scattering background sets the mood of the user's
  local sky, while neutral monochrome chrome floats above. Each region card
  carries its own miniature sky — a soft gradient that drifts from dawn to
  dusk to deep night as the hour rolls forward. The result feels less like a
  utility and more like looking out of a window onto every timezone at once.

colors:
  brand:
    aurora-pink: "#db2777"
    aurora-violet: "#7e22ce"
    aurora-blue: "#1e3a8a"
    sky-day: "#3c90d8"
    sky-dawn: "#e8a862"
    sky-dusk: "#9070a0"
    sky-night: "#0a0a1e"
  light:
    background: "#ffffff"
    foreground: "#252525"
    card: "#ffffff"
    card-foreground: "#252525"
    popover: "#ffffff"
    popover-foreground: "#252525"
    primary: "#343434"
    on-primary: "#fbfbfb"
    secondary: "#f5f5f5"
    on-secondary: "#343434"
    muted: "#f5f5f5"
    muted-foreground: "#757575"
    accent: "#f5f5f5"
    on-accent: "#343434"
    destructive: "#dc2626"
    border: "#e5e5e5"
    input: "#e5e5e5"
    ring: "#a3a3a3"
    surface-glass: "rgba(255, 255, 255, 0.10)"
    surface-glass-strong: "rgba(255, 255, 255, 0.15)"
  dark:
    background: "#0a0a0a"
    foreground: "#fbfbfb"
    card: "#252525"
    card-foreground: "#fbfbfb"
    popover: "#252525"
    popover-foreground: "#fbfbfb"
    primary: "#ededed"
    on-primary: "#343434"
    secondary: "#404040"
    on-secondary: "#fbfbfb"
    muted: "#404040"
    muted-foreground: "#a3a3a3"
    accent: "#404040"
    on-accent: "#fbfbfb"
    destructive: "#f87171"
    border: "rgba(255, 255, 255, 0.10)"
    input: "rgba(255, 255, 255, 0.15)"
    ring: "#737373"
    surface-glass: "rgba(10, 10, 10, 0.20)"
    surface-glass-strong: "rgba(10, 10, 10, 0.40)"
  on-sky:
    text-primary: "rgba(255, 255, 255, 1)"
    text-secondary: "rgba(255, 255, 255, 0.80)"
    text-tertiary: "rgba(255, 255, 255, 0.70)"
    text-quiet: "rgba(255, 255, 255, 0.50)"
    border-soft: "rgba(255, 255, 255, 0.10)"
    border-emphasized: "rgba(255, 255, 255, 0.25)"
    ring-active: "rgba(255, 255, 255, 0.30)"
    scrim: "rgba(0, 0, 0, 0.25)"
  semantic:
    working-hours: "#4ade80"
    day-difference: "rgba(252, 211, 77, 0.90)"
    success: "#22c55e"
    warning: "#f59e0b"
    error: "#ef4444"
  sky-gradient:
    deep-night:   { from: "#050510", via: "#0a0a1e", to: "#0e0e2a" }
    dawn:         { from: "#1a2151", via: "#a07558", to: "#e8a862" }
    morning:      { from: "#5ca0d0", via: "#8ec4e8", to: "#c8e0f4" }
    midday:       { from: "#2070b8", via: "#3c90d8", to: "#60ade8" }
    afternoon:    { from: "#4088cc", via: "#70a8dc", to: "#a0c8ec" }
    dusk:         { from: "#3a4070", via: "#9070a0", to: "#d4a070" }
    evening:      { from: "#1e2a4a", via: "#2d3d6a", to: "#3c4d7a" }
    night:        { from: "#0d1117", via: "#111622", to: "#161b28" }
  meta:
    theme-color-light: "#ffffff"
    theme-color-dark:  "#0a0a0a"
    color-space: oklch

typography:
  fonts:
    sans: '"Inter", "ui-sans-serif", system-ui, -apple-system, "Segoe UI", sans-serif'
    mono: '"JetBrains Mono", "ui-monospace", "SFMono-Regular", Menlo, monospace'
    heading: '"Inter", "ui-sans-serif", system-ui, sans-serif'
    feature-settings: '"cv11", "ss01", "tabular-nums" for time displays'
  scale:
    h1-app:
      fontFamily: Inter
      fontSize: 16px
      fontWeight: "700"
      lineHeight: 20px
      letterSpacing: -0.01em
    h2-panel:
      fontFamily: Inter
      fontSize: 18px
      fontWeight: "600"
      lineHeight: 24px
      letterSpacing: -0.01em
    eyebrow:
      fontFamily: Inter
      fontSize: 10px
      fontWeight: "500"
      lineHeight: 14px
      letterSpacing: 0.06em
      textTransform: uppercase
    body:
      fontFamily: Inter
      fontSize: 14px
      fontWeight: "400"
      lineHeight: 20px
    body-sm:
      fontFamily: Inter
      fontSize: 13px
      fontWeight: "400"
      lineHeight: 18px
    label:
      fontFamily: Inter
      fontSize: 11px
      fontWeight: "500"
      lineHeight: 14px
    label-strong:
      fontFamily: Inter
      fontSize: 13px
      fontWeight: "600"
      lineHeight: 16px
      letterSpacing: -0.005em
    micro:
      fontFamily: Inter
      fontSize: 10px
      fontWeight: "500"
      lineHeight: 12px
    time-mono-sm:
      fontFamily: JetBrains Mono
      fontSize: 13px
      fontWeight: "700"
      lineHeight: 16px
      fontVariantNumeric: tabular-nums
    time-mono-lg:
      fontFamily: JetBrains Mono
      fontSize: 16px
      fontWeight: "700"
      lineHeight: 20px
      letterSpacing: 0.08em
      fontVariantNumeric: tabular-nums

spacing:
  unit: 4px
  scale:
    xs: 4px
    sm: 6px
    md: 8px
    lg: 12px
    xl: 16px
    "2xl": 24px
    "3xl": 32px
  layout:
    page-padding-x-mobile: 16px
    page-padding-x-tablet: 24px
    page-padding-x-desktop: 32px
    header-padding-y: 12px
    panel-gap: 12px
    panel-gap-desktop: 24px
    card-padding-x: 12px
    card-padding-y: 10px
    card-gap: 8px
    right-panel-width-md: 340px
    right-panel-width-lg: 420px
    right-panel-width-xl: 460px
    globe-max-width-lg: 680px
    globe-max-width-xl: 720px
    globe-max-width-2xl: 800px
    icon-button-size-sm: 28px
    icon-button-size-md: 32px
  safe-area:
    respects: "env(safe-area-inset-*)"

radii:
  base: 10px
  sm: 6px
  md: 8px
  lg: 10px
  xl: 14px
  "2xl": 18px
  "3xl": 22px
  "4xl": 26px
  pill: 9999px
  notes: >
    All sizes derive from a 10px base. Cards use lg, icon buttons use lg,
    the header globe badge uses xl, modal dialogs use xl–2xl.

elevation:
  layers:
    z-aurora: 0          # WebGL background (always behind)
    z-glass-overlay: 1   # frosted scrim above aurora
    z-content: 10        # main UI grid
    z-skip-link: 100     # accessibility skip-to-content
    z-modal: 50          # quick-search, about, manager
  shadows:
    none: "none"
    soft:    "0 1px 2px rgba(0, 0, 0, 0.04)"
    card:    "0 4px 12px rgba(0, 0, 0, 0.08)"
    floating: "0 8px 24px rgba(0, 0, 0, 0.12)"
    modal:   "0 24px 64px rgba(0, 0, 0, 0.24)"
    glow-active: "0 0 0 2px rgba(255, 255, 255, 0.30)"
  glass:
    blur-sm: "blur(8px)"
    blur-md: "blur(20px)"
    blur-lg: "blur(40px)"
    saturate: "saturate(140%)"

motion:
  easing:
    out:    "cubic-bezier(0.23, 1, 0.32, 1)"   # the signature curve
    in-out: "cubic-bezier(0.77, 0, 0.175, 1)"
    linear: "linear"
  duration:
    instant: 0ms
    micro:   120ms
    fast:    160ms
    base:    200ms
    medium:  300ms
    slow:    600ms
  presets:
    button-press: { transform: "scale(0.95→0.97)", duration: 160ms, easing: out }
    card-hover-lift: { transform: "scale(1→1.01)", duration: 200ms, easing: out }
    card-enter:    { from: "opacity 0, translateY(6px)", duration: 300ms, easing: out, stagger: 30ms }
    theme-swap:    { properties: "background-color, color, border-color", duration: 300ms, easing: ease }
    sky-tween:     { description: "linear interpolation between sky-period gradients quantized at 15-min steps" }
    globe-pulse:   { duration: 4000ms, easing: ease-in-out, loop: infinite, paused-until: hover }
    globe-spin:    { duration: 8000ms, easing: linear, loop: infinite, paused-until: hover }
    globe-orbit:   { duration: 3000ms, easing: "cubic-bezier(0.37, 0, 0.63, 1)", loop: infinite }
  reduced-motion:
    strategy: "Honor prefers-reduced-motion: reduce — disable card-enter, freeze globe icon, keep state changes instant."

iconography:
  library: "lucide-react"
  stroke-width: 1.5
  cap: round
  join: round
  default-size-px: 14
  emphasized-size-px: 16
  emoji:
    flags: "Country flags rendered as native Unicode emoji on cards, clock face, and globe markers."
    weather: "Single emoji glyph alongside numeric temperature (e.g. ☀️ 22°/72°)."

components:
  app-shell:
    background: "{colors.dark.background} | {colors.light.background}"
    overflow: hidden
    minHeight: 100vh
  background-aurora:
    type: "WebGL fragment shader (atmospheric Rayleigh + Mie scattering)"
    samplesIn: 20
    samplesOut: 5
    sun-direction: "driven by user's local hour + minute fraction"
    intensity-light: 1.0
    intensity-dark: 0.85
    pause-on-tab-hidden: true
  glass-overlay:
    light: "rgba(255, 255, 255, 0.10)"
    dark:  "rgba(10, 10, 10, 0.20)"
    purpose: "soften the WebGL canvas so chrome retains contrast"
  header:
    height: 56px
    paddingX: "{spacing.layout.page-padding-x-mobile}"
    title:
      typography: "{typography.scale.h1-app}"
    subtitle:
      typography: "{typography.scale.eyebrow}"
      color: "{colors.dark.muted-foreground}"
    globe-badge:
      size: 36px
      rounded: "{radii.xl}"
      background: "rgba(255, 255, 255, 0.15)"
      border: "1px solid rgba(255, 255, 255, 0.10)"
      backdrop-filter: "{elevation.glass.blur-sm}"
      hover: { transform: "scale(1.10)", duration: 300ms }
  icon-button:
    size: "{spacing.layout.icon-button-size-sm} → {spacing.layout.icon-button-size-md}"
    rounded: "{radii.lg}"
    background: "rgba(var(--background), 0.5)"
    border: "1px solid {colors.dark.border}"
    transition: "transform 160ms {motion.easing.out}, background-color 160ms {motion.easing.out}"
    hover-background: "{colors.dark.accent}"
    active-transform: "scale(0.95)"
  region-card:
    rounded: "{radii.lg}"
    paddingX: "{spacing.layout.card-padding-x}"
    paddingY: "{spacing.layout.card-padding-y}"
    background: "linear-gradient(to bottom, sky.from, sky.via, sky.to)"
    scrim: "{colors.on-sky.scrim}"
    border: "1px solid {colors.on-sky.border-soft}"
    border-local: "1px solid {colors.on-sky.border-emphasized}"
    ring-local: "1px solid {colors.on-sky.border-emphasized}"
    ring-active: "2px {colors.on-sky.ring-active}"
    text-shadow: "0 1px 3px rgba(0, 0, 0, 0.4)"
    typography:
      city: "{typography.scale.label-strong}"
      meta: "{typography.scale.micro}"
      time: "{typography.scale.time-mono-sm}"
    hover: { transform: "scale(1.01)", devices: "hover-capable only" }
    active: { opacity: 0.85, devices: "touch only" }
    indicators:
      working-dot: { size: 6px, color: "{colors.semantic.working-hours}", shape: pill }
      day-diff:    { color: "{colors.semantic.day-difference}", typography: "{typography.scale.micro}" }
  analog-clock:
    aspect: 1
    radius-percent: 28
    hand-stroke: 1.5
    avatar-size-px: 18
    label-typography: "{typography.scale.time-mono-sm}"
  panel-card:
    background: "rgba(255, 255, 255, 0.05) | rgba(10, 10, 10, 0.40)"
    backdrop-filter: "{elevation.glass.blur-md}"
    border: "1px solid {colors.dark.border}"
    rounded: "{radii.xl}"
    padding: 16px
    shadow: "{elevation.shadows.card}"
  modal-dialog:
    background: "{colors.dark.popover}"
    rounded: "{radii.xl}"
    padding: 24px
    shadow: "{elevation.shadows.modal}"
    backdrop: "rgba(0, 0, 0, 0.50)"
  command-palette:
    width: 560px
    rounded: "{radii.xl}"
    padding: 8px
    item-rounded: "{radii.md}"
    item-padding: "8px 12px"
    item-hover: "{colors.dark.accent}"
    typography: "{typography.scale.body}"
    kbd:
      typography: "{typography.scale.label}"
      background: "{colors.dark.muted}"
      rounded: "{radii.sm}"
      padding: "2px 6px"
  meeting-planner-grid:
    column-count: 24
    cell-min-width: 22px
    cell-height: 28px
    cell-rounded: 2px
    states:
      idle:    "rgba(255, 255, 255, 0.04)"
      working: "{colors.semantic.working-hours}"
      overlap: "rgba(74, 222, 128, 0.35) + 1px outline {colors.semantic.working-hours}"
      now-marker: "1px vertical line, {colors.on-sky.text-primary}, opacity 0.6"
  switch:
    track-rounded: "{radii.pill}"
    thumb-rounded: "{radii.pill}"
    transition: "transform 200ms {motion.easing.out}"
  badge-kbd:
    typography: "{typography.scale.label}"
    background: "{colors.dark.muted}"
    foreground: "{colors.dark.muted-foreground}"
    rounded: "{radii.sm}"
    padding: "2px 6px"
  focus-ring:
    style: "2px solid {colors.dark.ring}"
    offset: 2px
    appliesTo: "button, [role=button], input, a (focus-visible only)"

breakpoints:
  sm: 640px    # large phones — analog clock visible, no globe
  md: 768px    # tablets — globe appears, side-by-side layout
  lg: 1024px   # laptops — wider right panel, larger globe
  xl: 1280px   # desktops — comfortable density
  "2xl": 1536px # large desktops — maximum globe size, generous spacing

accessibility:
  contrast-target: "WCAG AA across both themes"
  text-on-sky-strategy: "All region-card text is solid white over a 25% black scrim with a subtle 0/1/3 text-shadow to remain legible across every sky gradient."
  focus: "2px solid focus ring at 2px offset, focus-visible only."
  skip-link: "First element on page; visually hidden until focus."
  aria-live: "Local clock readout uses aria-live=polite, aria-atomic=true."
  reduced-motion: "Respected for card entry, globe icon, and any decorative motion."
  hit-target-min: 28px
  ios-zoom-prevention: "Form inputs locked to 16px font-size below 768px."
---

## Brand & Style

World Clock is built around one feeling: looking up. The app's identity is
**atmospheric, calm, and a little cinematic** — a quiet utility that takes
time seriously enough to render the sky behind it. Two layers do the work:
a live WebGL atmospheric-scattering simulation that paints the user's local
sky as the background, and a deliberately neutral, near-monochrome chrome
that floats on top so nothing competes with the sky.

The personality is **technical-poetic**. It is dense with information —
hours, offsets, weather, working windows — but every density choice is
softened by tactile motion, generous radii, and translucency. It should
feel like a privacy-respecting console for a small, distributed team, not a
dashboard. There is exactly one playful moment (an animated globe icon that
only spins on hover) and otherwise the app stays out of the user's way.

## Colors

The palette is a deliberate two-layer split:

- **Chrome** — the header, buttons, panels, and modals — uses a strict
  neutral grayscale defined in OKLCH. Light mode is true white through
  charcoal; dark mode is near-black through bone. There is no brand hue in
  the chrome. This keeps the UI honest against the constantly shifting
  background.
- **Atmosphere** — the WebGL aurora and the sky gradients on each region
  card — is where saturation lives. Eight keyed sky periods (deep night,
  dawn, morning, midday, afternoon, dusk, evening, night) are linearly
  interpolated over the 24-hour cycle and quantized to 15-minute steps.
  Each region card is a tiny window onto the sky at *its* local hour, so
  the same screen will simultaneously show midnight indigo, dawn peach, and
  midday cobalt.

Three color rules:

1. **Text on sky is always white**, sitting on a 25% black scrim with a
   subtle text-shadow. This is the only way to keep type legible across all
   eight sky periods without breaking the illusion of a translucent card.
2. **Semantic colors are reserved for state**, never decoration. A 6px
   green dot signals "currently in working hours"; an amber inline pill
   marks a day-of-week shift; destructive red appears only in confirm
   flows.
3. **Borders are translucent white** on sky surfaces (10% normal, 25% for
   the local timezone), and neutral border tokens on chrome surfaces.

## Typography

Two faces, one system: **Inter** for everything human-readable, **JetBrains
Mono** for every number that ticks. Time displays always set
`font-variant-numeric: tabular-nums` so the seconds digit doesn't reflow.

Hierarchy stays intentionally compact — this is a **dense-info, minimal
hierarchy** product:

- A single 16px bold app title in the header.
- An 18px panel header for "Regions / Manage / Plan".
- 13px label-strong for region names; 10–11px for meta and offsets.
- Mono 13px for region times, mono 16px tracked-out for the headline local
  time below the analog clock.

Eyebrow labels (date stamp, group titles) use uppercase Inter at 10px /
0.06em tracking — the only place letterspacing is opened up.

## Layout & Spacing

A **two-column atmospheric layout**:

- On `md+` viewports, the globe occupies the left half and the region
  panel takes a fixed-width column on the right (340 → 420 → 460px).
- Below `md`, the globe disappears entirely and the right panel becomes
  the full screen — the analog clock takes the role of the globe at small
  sizes.
- The viewport is intentionally non-scrolling at the page level (`html,
  body { overflow: hidden }`); only the region list inside the right panel
  scrolls when cards overflow.

Everything is on a **4px sub-grid with 8px primary rhythm**. Cards stack
with a 6–8px gap, the panel header sits 12px above the clock, and the page
padding scales 16 → 24 → 32px across breakpoints. Negative space matters:
the chrome is never wider than it needs to be, so the aurora behind it
remains the focal element.

## Elevation & Depth

Depth is built from **light, not shadow**. The full stack from back to
front is:

1. **Aurora** — a full-screen WebGL canvas running an atmospheric
   scattering shader. The sun direction tracks the user's local hour with
   minute-level precision. This layer is paused when the tab is hidden to
   conserve power.
2. **Glass scrim** — a single low-opacity wash (10% white in light mode,
   20% black in dark) that prevents the aurora from clipping the chrome's
   contrast.
3. **Chrome** — buttons, panels, and the header sit at z=10. They use
   subtle borders and a `bg-background/50` translucency rather than solid
   fills, which lets the aurora bleed through ~50% on hover.
4. **Modals & command palette** — quick-search (⌘K), settings (⌘,),
   meeting planner (⌘M), about — these float at z=50 with a 50% black
   backdrop and the heaviest shadow in the system.

Shadows are used sparingly and **only to separate floating elements from
their parent**, never to fake hierarchy on flat content.

## Motion

Motion is the second voice of the brand, and it follows three rules:

- **One easing curve** — `cubic-bezier(0.23, 1, 0.32, 1)` (a soft out-expo)
  is the signature. It's used everywhere except the rare in-out moments
  (modal presents) where `cubic-bezier(0.77, 0, 0.175, 1)` takes over.
- **Tactile, not decorative** — every interactive surface has a 95–97%
  scale on press and a 200ms hover lift. Cards stagger in at 300ms with a
  6px upward translation. Theme swaps are a 300ms cross-fade on
  `background-color` and `color` only — never on layout.
- **The sky is the longest animation in the system.** Each region card's
  gradient interpolates between the eight sky periods continuously, but
  quantized to 15-minute updates so it never visibly *animates* — it just
  *is* a different sky every quarter hour.

The animated globe icon in the header is the one piece of pure character
in the app. It pulses, spins, and orbits — but only on hover, only on
hover-capable pointers, and never if the user has requested reduced
motion.

## Shapes

The shape language is **soft-rectangular**. Everything derives from a
10px base radius:

- Region cards, icon buttons, and switches: 10px (`lg`).
- Header globe badge and the panel container: 14px (`xl`).
- Modals and the command palette: 14–18px.
- Pills (working-hours dot, kbd badges) are fully rounded.

Stroke icons (Lucide, 1.5px) match the visual weight of the borders, so
the system reads as one drawn line throughout.

## Components

### Region Card

The hero component. A full-width button rendering: country-flag emoji ·
city · timezone abbreviation · weather emoji + temperature · big mono
local time · UTC offset relative to the viewer. The background is a
linearly interpolated sky gradient for that timezone's current local hour,
with a 25% black scrim layered above for legibility. Active state adds a
translucent white ring; the local timezone gets a brighter 25% white border
permanently. On hover-capable devices it scales to 1.01; on touch devices
it dims to 85% opacity instead.

### Analog Clock

A pure SVG clock anchored to the viewer's local time. Its second hand
ticks once per second in real time, but its true charm is that each
**other** active region's flag floats at *its* current hour position
around the dial, so the user sees, at a glance, where the team is on a
24-hour ring.

### Globe (3D)

A COBE WebGL globe on the left half of the screen. Markers are colored
with the **same sky gradient** as the region cards, so the globe doubles
as a planet-scale legend for the right panel. Arcs connect the local
timezone to each active region.

### Command Palette (⌘K)

A standard vertically stacked palette: search input, results list, kbd
hints in the footer. Items use 8px vertical padding and a 6px radius hover
state. Keyboard navigation is the primary affordance.

### Meeting Planner (⌘M)

A 24-column grid (one cell per UTC hour) with one row per region. Cells
are filled with the working-hours green at 100% in each region's local
9–17 window, and the columns where **all** regions overlap are highlighted
with an outline plus a brighter fill. A vertical "now" marker rides across
the grid. This is the only component in the system that uses semantic
green as a primary fill rather than as a state dot.

### Header

A 56px flex bar: an animated globe icon badge on the left, the app title
and the current full date stacked next to it. The right side is empty by
design — all controls live next to the region panel header so they appear
*with* their content.

## Voice & Tone

Microcopy is **pragmatic and unembellished**: "Regions", "Manage
timezones", "Meeting planner", "Toggle theme". No exclamation marks, no
emoji in body text, no marketing language. The two places where
personality leaks through are the keyboard hints (⌘K, ⌘M, ⌘,, Esc) and
the about dialog, which is plainspoken about the app's privacy stance ("no
tracking, no cookies, no accounts").

## Accessibility

The design enforces these contracts:

- WCAG AA contrast across both themes; on the sky-gradient cards, white
  text + 25% black scrim + soft text-shadow is the only acceptable
  combination.
- A "Skip to content" link is the first focusable element on the page,
  visually hidden until focused.
- Focus-visible only: a 2px solid neutral ring at 2px offset, never on
  pointer interaction.
- The local clock readout uses `aria-live="polite"` so screen readers
  announce time changes without interrupting flow.
- All decorative motion (card entry, globe icon, hover lifts) honors
  `prefers-reduced-motion: reduce` and collapses to instant state changes.
- Form inputs are locked to 16px font-size below the `md` breakpoint to
  prevent iOS zoom on focus.

## Responsive Behavior

- **`< md` (mobile, single column):** globe hidden; right panel becomes
  full-width; analog clock takes the visual lead; icon buttons shrink from
  32px to 28px; gaps compress to 6px.
- **`md` (tablet, two-column):** globe appears at ~320px max width; right
  panel locks to 340px.
- **`lg`–`xl` (laptop / desktop):** globe scales up to 680–720px; right
  panel grows to 420–460px; card gaps relax back to 8px.
- **`2xl`+ (large desktop):** globe peaks at 800px; cards gain extra
  vertical padding (12px) for a calmer reading rhythm.

## Anti-patterns

- **Don't tint the chrome.** The chrome is monochrome by design so the
  aurora and sky cards can carry all the color. Adding a brand hue to a
  button or border breaks the layered metaphor.
- **Don't replace the sky-gradient cards with solid fills.** The
  per-timezone gradient *is* the data visualization — it tells you, at a
  glance, what kind of sky each teammate is looking at right now.
- **Don't add drop-shadows to flat content.** Shadows belong to floating
  elements (modals, command palette, hover-lifted cards) only.
- **Don't animate layout.** Motion is for state and tactility (scale,
  opacity, gradient interpolation). Width, height, and grid changes should
  be instant.
- **Don't introduce a third typeface.** Inter for chrome, JetBrains Mono
  for digits, full stop.
