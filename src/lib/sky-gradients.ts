export interface SkyGradient {
  from: string;
  via: string;
  to: string;
  label: string;
}

// Gradient colors inspired by the sky reference image (clear sky column)
// Colors are vivid and saturated to show through the glass overlay
const SKY_PERIODS: Array<{
  startHour: number;
  gradient: SkyGradient;
}> = [
  {
    startHour: 0,
    gradient: {
      from: "#050510",
      via: "#0a0a1e",
      to: "#0e0e2a",
      label: "deep night",
    },
  },
  {
    startHour: 4,
    gradient: {
      from: "#1a2151",
      via: "#a07558",
      to: "#e8a862",
      label: "dawn",
    },
  },
  {
    startHour: 6,
    gradient: {
      from: "#5ca0d0",
      via: "#8ec4e8",
      to: "#c8e0f4",
      label: "morning",
    },
  },
  {
    startHour: 9,
    gradient: {
      from: "#2070b8",
      via: "#3c90d8",
      to: "#60ade8",
      label: "midday",
    },
  },
  {
    startHour: 14,
    gradient: {
      from: "#4088cc",
      via: "#70a8dc",
      to: "#a0c8ec",
      label: "afternoon",
    },
  },
  {
    startHour: 17,
    gradient: {
      from: "#3a4070",
      via: "#9070a0",
      to: "#d4a070",
      label: "dusk",
    },
  },
  {
    startHour: 19,
    gradient: {
      from: "#1e2a4a",
      via: "#2d3d6a",
      to: "#3c4d7a",
      label: "evening",
    },
  },
  {
    startHour: 21,
    gradient: {
      from: "#0d1117",
      via: "#111622",
      to: "#161b28",
      label: "night",
    },
  },
];

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
}

function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(
    ar + (br - ar) * t,
    ag + (bg - ag) * t,
    ab + (bb - ab) * t
  );
}

function lerpGradient(
  a: SkyGradient,
  b: SkyGradient,
  t: number
): SkyGradient {
  return {
    from: lerpColor(a.from, b.from, t),
    via: lerpColor(a.via, b.via, t),
    to: lerpColor(a.to, b.to, t),
    label: t < 0.5 ? a.label : b.label,
  };
}

const gradientCache = new Map<number, SkyGradient>();

export function getGradientForHour(hour: number): SkyGradient {
  const quantized = Math.round(hour * 4) / 4;
  const cached = gradientCache.get(quantized);
  if (cached) return cached;

  const h = ((hour % 24) + 24) % 24;

  let currentIdx = 0;
  for (let i = SKY_PERIODS.length - 1; i >= 0; i--) {
    if (h >= SKY_PERIODS[i].startHour) {
      currentIdx = i;
      break;
    }
  }

  const current = SKY_PERIODS[currentIdx];
  const next = SKY_PERIODS[(currentIdx + 1) % SKY_PERIODS.length];

  const nextStart =
    next.startHour > current.startHour
      ? next.startHour
      : next.startHour + 24;
  const span = nextStart - current.startHour;
  const elapsed = h - current.startHour;
  const t = Math.max(0, Math.min(1, elapsed / span));

  const result = lerpGradient(current.gradient, next.gradient, t);

  // Keep cache bounded (96 entries = 24 hours * 4 per hour)
  if (gradientCache.size > 96) gradientCache.clear();
  gradientCache.set(quantized, result);

  return result;
}

export function gradientToCSS(gradient: SkyGradient): string {
  return `linear-gradient(to bottom, ${gradient.from}, ${gradient.via}, ${gradient.to})`;
}


