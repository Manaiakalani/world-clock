export interface Region {
  id: string;
  name: string;
  city: string;
  timezone: string;
  coordinates: [number, number]; // [lat, lon]
  color: [number, number, number]; // RGB 0-1 for COBE marker
  emoji: string;
}

export const regions: Region[] = [
  {
    id: "americas-west",
    name: "Americas · West",
    city: "San Francisco",
    timezone: "America/Los_Angeles",
    coordinates: [37.78, -122.44],
    color: [0.35, 0.6, 1],
    emoji: "🇺🇸",
  },
  {
    id: "americas-east",
    name: "Americas · East",
    city: "New York",
    timezone: "America/New_York",
    coordinates: [40.71, -74.01],
    color: [0.4, 0.55, 0.95],
    emoji: "🇺🇸",
  },
  {
    id: "south-america",
    name: "South America",
    city: "São Paulo",
    timezone: "America/Sao_Paulo",
    coordinates: [-23.55, -46.63],
    color: [0.3, 0.75, 0.5],
    emoji: "🇧🇷",
  },
  {
    id: "europe-west",
    name: "Europe · West",
    city: "London",
    timezone: "Europe/London",
    coordinates: [51.51, -0.13],
    color: [0.9, 0.5, 0.3],
    emoji: "🇬🇧",
  },
  {
    id: "europe-central",
    name: "Europe · Central",
    city: "Paris",
    timezone: "Europe/Paris",
    coordinates: [48.86, 2.35],
    color: [0.85, 0.45, 0.55],
    emoji: "🇫🇷",
  },
  {
    id: "middle-east",
    name: "Middle East",
    city: "Dubai",
    timezone: "Asia/Dubai",
    coordinates: [25.2, 55.27],
    color: [1, 0.7, 0.3],
    emoji: "🇦🇪",
  },
  {
    id: "asia-east",
    name: "Asia · East",
    city: "Tokyo",
    timezone: "Asia/Tokyo",
    coordinates: [35.68, 139.65],
    color: [1, 0.4, 0.5],
    emoji: "🇯🇵",
  },
  {
    id: "oceania",
    name: "Oceania",
    city: "Sydney",
    timezone: "Australia/Sydney",
    coordinates: [-33.87, 151.21],
    color: [0.5, 0.85, 0.6],
    emoji: "🇦🇺",
  },
];

// Generate arc pairs — connect every region to its 2 nearest neighbors by longitude
export function generateArcs(
  regionList: Region[]
): Array<{ from: [number, number]; to: [number, number] }> {
  const arcs: Array<{ from: [number, number]; to: [number, number] }> = [];
  const sorted = [...regionList].sort(
    (a, b) => a.coordinates[1] - b.coordinates[1]
  );

  for (let i = 0; i < sorted.length; i++) {
    const next = sorted[(i + 1) % sorted.length];
    arcs.push({
      from: sorted[i].coordinates,
      to: next.coordinates,
    });
  }

  return arcs;
}
