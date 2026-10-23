export const EARTH_RADIUS_KM = 6371;

export function isValidLatitude(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= -90 &&
    value <= 90
  );
}

export function isValidLongitude(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= -180 &&
    value <= 180
  );
}

/**
 * Great-circle (Haversine) distance in kilometers. Throws for out-of-range or
 * non-finite coordinates rather than returning a nonsensical number.
 */
export function calculateDistanceKm(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
): number {
  if (
    !isValidLatitude(latitude1) ||
    !isValidLatitude(latitude2) ||
    !isValidLongitude(longitude1) ||
    !isValidLongitude(longitude2)
  ) {
    throw new RangeError(
      "calculateDistanceKm received an out-of-range or non-finite coordinate.",
    );
  }

  const dLat = ((latitude2 - latitude1) * Math.PI) / 180;
  const dLon = ((longitude2 - longitude1) * Math.PI) / 180;
  const lat1Rad = (latitude1 * Math.PI) / 180;
  const lat2Rad = (latitude2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Closest location to the given point, or null for an empty/all-invalid list.
 */
export function findNearestLocation<
  T extends { latitude: number; longitude: number },
>(locations: readonly T[], latitude: number, longitude: number): T | null {
  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) return null;

  let closest: T | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const location of locations) {
    if (
      !isValidLatitude(location.latitude) ||
      !isValidLongitude(location.longitude)
    ) {
      continue;
    }

    const distance = calculateDistanceKm(
      latitude,
      longitude,
      location.latitude,
      location.longitude,
    );
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = location;
    }
  }

  return closest;
}
