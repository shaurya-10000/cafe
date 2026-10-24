import { SAMPLE_STRIDE } from "../constants";

/**
 * Returns the fraction (0..1) of sampled pixels that are mostly transparent,
 * i.e. scratched away. Works in device pixels; the context transform is ignored
 * by getImageData, so no scaling is needed here.
 */
export function measureCleared(
  ctx: CanvasRenderingContext2D,
  deviceWidth: number,
  deviceHeight: number,
): number {
  if (deviceWidth === 0 || deviceHeight === 0) return 0;

  const { data } = ctx.getImageData(0, 0, deviceWidth, deviceHeight);
  const pixelCount = data.length / 4;

  let sampled = 0;
  let cleared = 0;
  for (let pixel = 0; pixel < pixelCount; pixel += SAMPLE_STRIDE) {
    sampled += 1;
    if (data[pixel * 4 + 3] < 128) cleared += 1;
  }

  return sampled === 0 ? 0 : cleared / sampled;
}