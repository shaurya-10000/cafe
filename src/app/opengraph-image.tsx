import { ImageResponse } from "next/og";

import { CupMark } from "./_brand/CupMark";

export const alt = "Cafe - a sensory experience architected around the purity of the bean";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 56,
          width: "100%",
          height: "100%",
          background: "#111111",
          color: "#ffffff",
          padding: 80,
        }}
      >
        <CupMark size={260} background="transparent" />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              fontSize: 200,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: -8,
            }}
          >
            CAFE
            <span style={{ color: "#C8A785" }}>.</span>
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: 620,
              fontSize: 34,
              lineHeight: 1.35,
              color: "#bdb3a6",
            }}
          >
            A sensory experience architected around the purity of the bean.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}