import { ImageResponse } from "next/og";

import { CupMark } from "../../_brand/CupMark";

const SIZES: readonly number[] = [48, 192, 512];

export function generateStaticParams() {
  return SIZES.map((size) => ({ size: String(size) }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params;
  const px = Number(size);

  if (!SIZES.includes(px)) {
    return new Response("Not found", { status: 404 });
  }

  return new ImageResponse(<CupMark size={px} />, {
    width: px,
    height: px,
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  });
}