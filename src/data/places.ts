/**
 * Place layer — lets multiple labeled cities ride on a single IANA timezone.
 *
 * A "place id" is a string that is either:
 *   - a raw IANA timezone (e.g. "America/Los_Angeles"), or
 *   - a tz with a place suffix separated by '#' (e.g. "America/Los_Angeles#us-redmond").
 *
 * The suffix is stripped before any tz operation, so storage/URLs/searching
 * stay backward compatible with plain tz strings.
 */

export interface PlaceOverride {
  /** The full place id, including the '#suffix' alias. */
  id: string;
  /** Human label shown on cards / search. */
  label: string;
  /** Continent / region grouping. */
  continent: string;
  /** [lat, lon] for the globe + sun calculations. */
  coordinates: [number, number];
  /** Country flag emoji. */
  flag: string;
}

/**
 * Custom place overrides. Keyed by full place id.
 * The base tz (before '#') must be a real IANA zone present in ALL_TIMEZONES.
 */
export const PLACE_OVERRIDES: Record<string, PlaceOverride> = {
  "America/Los_Angeles#us-redmond": {
    id: "America/Los_Angeles#us-redmond",
    label: "Redmond",
    continent: "Americas",
    coordinates: [47.674, -122.121],
    flag: "🇺🇸",
  },
};

/** Strip the '#suffix' from a place id to get a real IANA tz. */
export function resolveTimezone(placeId: string): string {
  const hash = placeId.indexOf("#");
  return hash === -1 ? placeId : placeId.slice(0, hash);
}

/** True if the place id has a custom override (i.e. is an aliased place). */
export function isAliasedPlace(placeId: string): boolean {
  return placeId.includes("#");
}

/** Get the override for a place id, or null. */
export function getPlaceOverride(placeId: string): PlaceOverride | null {
  return PLACE_OVERRIDES[placeId] ?? null;
}

/** All custom places as an array (for search / pickers). */
export const ALL_PLACE_OVERRIDES: PlaceOverride[] = Object.values(PLACE_OVERRIDES);
