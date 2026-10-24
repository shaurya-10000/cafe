"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";

import {
  BRUSH_RADIUS,
  MEASURE_INTERVAL_MS,
  REVEAL_THRESHOLD,
} from "../constants";
import { measureCleared } from "../lib/measureCleared";
import { paintCover } from "../lib/paintCover";
import type { Point, ScratchMode } from "../types";

interface UseScratchCanvasOptions {
  readonly mode: ScratchMode;
  readonly onReveal: () => void;
  readonly onLockedPress: () => void;
}

function toPoint(event: PointerEvent<HTMLCanvasElement>): Point {
  const rect = event.currentTarget.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

export function useScratchCanvas({
  mode,
  onReveal,
  onLockedPress,
}: UseScratchCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);

  const revealedRef = useRef(false);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const lastMeasureRef = useRef(0);
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });

  const modeRef = useRef(mode);
  const onRevealRef = useRef(onReveal);
  const onLockedPressRef = useRef(onLockedPress);

  useEffect(() => {
    modeRef.current = mode;
    onRevealRef.current = onReveal;
    onLockedPressRef.current = onLockedPress;
  }, [mode, onReveal, onLockedPress]);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const { width, height, dpr } = sizeRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    paintCover(ctx, width, height);
  }, []);

  /* Keep the backing store crisp and in sync with the element's CSS size. */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sync = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      if (width === 0 || height === 0) return;

      const prev = sizeRef.current;
      if (prev.width === width && prev.height === height && prev.dpr === dpr) {
        return;
      }

      sizeRef.current = { width, height, dpr };
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      if (!revealedRef.current) paint();
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [paint]);

  const reveal = useCallback(() => {
    if (revealedRef.current) return;

    if (modeRef.current === "locked") {
      onLockedPressRef.current();
      return;
    }
    if (modeRef.current !== "ready") return;

    revealedRef.current = true;
    drawingRef.current = false;
    lastPointRef.current = null;
    setRevealed(true);
    onRevealRef.current();
  }, []);

  const reset = useCallback(() => {
    revealedRef.current = false;
    drawingRef.current = false;
    lastPointRef.current = null;
    setRevealed(false);
    paint();
  }, [paint]);

  const scratchTo = useCallback((point: Point) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const { dpr } = sizeRef.current;
    const from = lastPointRef.current ?? point;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "#000";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = BRUSH_RADIUS * 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.arc(point.x, point.y, BRUSH_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    lastPointRef.current = point;
  }, []);

  const checkProgress = useCallback(
    (force: boolean) => {
      const now = performance.now();
      if (!force && now - lastMeasureRef.current < MEASURE_INTERVAL_MS) return;
      lastMeasureRef.current = now;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      if (measureCleared(ctx, canvas.width, canvas.height) >= REVEAL_THRESHOLD) {
        reveal();
      }
    },
    [reveal],
  );

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (revealedRef.current) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;

      if (modeRef.current !== "ready") {
        if (modeRef.current === "locked") onLockedPressRef.current();
        return;
      }

      event.currentTarget.setPointerCapture(event.pointerId);
      drawingRef.current = true;
      lastPointRef.current = null;
      scratchTo(toPoint(event));
    },
    [scratchTo],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current || revealedRef.current) return;
      scratchTo(toPoint(event));
      checkProgress(false);
    },
    [scratchTo, checkProgress],
  );

  const finishStroke = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    checkProgress(true);
  }, [checkProgress]);

  return {
    canvasRef,
    revealed,
    reveal,
    reset,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finishStroke,
      onPointerCancel: finishStroke,
    },
  } as const;
}