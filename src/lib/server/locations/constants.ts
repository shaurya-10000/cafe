/** The only bucket this schema provisions. */
export const IMAGE_BUCKET = "catalog-media";
export const IMAGE_PATH_PREFIX = "locations";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export const ALLOWED_IMAGE_TYPES: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const ALLOWED_IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Applied when the form omits a field. */
export const FORM_DEFAULTS = {
  timezone: "UTC",
  hoursWeekday: "Mon-Fri: 9am - 6pm",
  hoursWeekend: "Sat-Sun: 10am - 4pm",
  maxCapacity: "20",
  defaultBookingDurationMinutes: "60",
} as const;
