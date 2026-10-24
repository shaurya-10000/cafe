interface CupMarkProps {
  readonly size: number;
  readonly background?: string;
}

const ACCENT = "#C8A785";

/**
 * Full-bleed cup mark for generated icons. iOS and Android apply their own
 * corner masks, so the background is square and the glyph sits inside the
 * maskable safe zone.
 */
export function CupMark({ size, background = "#111111" }: CupMarkProps) {
  const glyph = Math.round(size * 0.72);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        background,
      }}
    >
      <svg width={glyph} height={glyph} viewBox="8 8 48 48" fill="none">
        <path
          d="M26 22c-3-3 3-5 0-9"
          stroke={ACCENT}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M36 22c-3-3 3-5 0-9"
          stroke={ACCENT}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M17 28h27v10a10 10 0 0 1-10 10h-7a10 10 0 0 1-10-10z"
          fill={ACCENT}
        />
        <path
          d="M44 31h2.5a5 5 0 0 1 0 10H43"
          stroke={ACCENT}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <rect x="13" y="50" width="38" height="3.5" rx="1.75" fill={ACCENT} />
      </svg>
    </div>
  );
}