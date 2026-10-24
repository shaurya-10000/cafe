import { ImageResponse } from "next/og";

import { CupMark } from "./_brand/CupMark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<CupMark size={size.width} />, { ...size });
}