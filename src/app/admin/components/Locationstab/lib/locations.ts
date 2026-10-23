import type { AdminLocation } from "../types";

/** Active locations first (in their display order), then inactive ones. */
export function splitLocations(locations: readonly AdminLocation[]): {
  active: AdminLocation[];
  inactive: AdminLocation[];
} {
  const active: AdminLocation[] = [];
  const inactive: AdminLocation[] = [];

  for (const location of locations) {
    (location.isActive ? active : inactive).push(location);
  }

  return { active, inactive };
}
