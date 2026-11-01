import type { CSSProperties } from "react";

import { CupMark } from "../_brand/CupMark";
import { OG_BRAND_NAME, OG_TAGLINE } from "./config";
import { OG_COLORS, OG_LAYOUT, OG_TYPE } from "./tokens";

// Satori (next/og) requires every multi-child element to be an explicit flex container.
const styles = {
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: OG_LAYOUT.columnGap,
    width: "100%",
    height: "100%",
    background: OG_COLORS.background,
    color: OG_COLORS.foreground,
    padding: OG_LAYOUT.padding,
  },
  textColumn: {
    display: "flex",
    flexDirection: "column",
    gap: OG_LAYOUT.textGap,
  },
  brand: {
    display: "flex",
    fontSize: OG_TYPE.brandSize,
    fontWeight: OG_TYPE.brandWeight,
    lineHeight: 1,
    letterSpacing: OG_TYPE.brandTracking,
  },
  brandDot: {
    color: OG_COLORS.accent,
  },
  tagline: {
    display: "flex",
    maxWidth: OG_LAYOUT.taglineMaxWidth,
    fontSize: OG_TYPE.taglineSize,
    lineHeight: OG_TYPE.taglineLeading,
    color: OG_COLORS.muted,
  },
} satisfies Record<string, CSSProperties>;

export function OgCard() {
  return (
    <div style={styles.root}>
      <CupMark size={OG_LAYOUT.markSize} background="transparent" />
      <div style={styles.textColumn}>
        <div style={styles.brand}>
          {OG_BRAND_NAME}
          <span style={styles.brandDot}>.</span>
        </div>
        <div style={styles.tagline}>{OG_TAGLINE}</div>
      </div>
    </div>
  );
}