import { COVER_LABEL } from "../constants";

/**
 * Paints the scratch-off foil. Expects the context to already be scaled for
 * the device pixel ratio, so all measurements here are in CSS pixels.
 */
export function paintCover(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.globalCompositeOperation = "source-over";

  const foil = ctx.createLinearGradient(0, 0, width, height);
  foil.addColorStop(0, "#d6bfa5");
  foil.addColorStop(0.5, "#f2e6d6");
  foil.addColorStop(1, "#b8997a");
  ctx.fillStyle = foil;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  for (let x = -height; x < width; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x, height);
    ctx.lineTo(x + height, 0);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = "rgba(62, 44, 28, 0.72)";
  const fontSize = Math.min(24, Math.max(14, Math.round(width * 0.04)));
  ctx.font = `800 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(COVER_LABEL, width / 2, height / 2);
}