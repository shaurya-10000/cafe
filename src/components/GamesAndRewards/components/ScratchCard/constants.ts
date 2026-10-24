/** Brush radius in CSS pixels. */
export const BRUSH_RADIUS = 36;

/** Fraction of the foil that must be cleared before the prize is revealed. */
export const REVEAL_THRESHOLD = 0.5;

/** Minimum gap between (relatively expensive) pixel measurements while scratching. */
export const MEASURE_INTERVAL_MS = 120;

/** Sample every Nth pixel when measuring. A prime avoids aliasing with row width. */
export const SAMPLE_STRIDE = 7;

/** If a reveal never turns into a claim, re-cover the card after this long. */
export const CLAIM_START_GRACE_MS = 2000;

export const COVER_LABEL = "SCRATCH TO REVEAL";