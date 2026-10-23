import {
  GOOGLE_MAPS_DIRECTIONS_BASE,
  GOOGLE_MAPS_EMBED_BASE,
  MAP_ZOOM,
} from "../constants";
import type { BusinessLocation } from "../types";

export function buildDirectionsUrl(
  location: Pick<BusinessLocation, "address">,
): string {
  return `${GOOGLE_MAPS_DIRECTIONS_BASE}${encodeURIComponent(location.address)}`;
}

export function buildMapEmbedUrl(
  location: Pick<BusinessLocation, "latitude" | "longitude">,
): string {
  return `${GOOGLE_MAPS_EMBED_BASE}${location.latitude},${location.longitude}&z=${MAP_ZOOM}&output=embed`;
}
