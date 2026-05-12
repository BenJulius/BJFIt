"use client";
import { useEffect, useRef, useState } from "react";

function isLikelyCheckerPixel(r, g, b, a) {
  if (a < 245) return false;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturationRange = max - min;
  if (saturationRange > 24) return false;
  const brightness = (r + g + b) / 3;
  if (brightness < 100 || brightness > 248) return false;
  return true;
}

function colorDistance(c1, c2) {
  return Math.abs(c1[0] - c2[0]) + Math.abs(c1[1] - c2[1]) + Math.abs(c1[2] - c2[2]);
}

function buildCheckerPalette(ctx, width, height) {
  const frame = ctx.getImageData(0, 0, width, height);
  const data = frame.data;
  const sample = [];
  const collect = (x, y) => {
    const i = (y * width + x) * 4;
    if (isLikelyCheckerPixel(data[i], data[i + 1], data[i + 2], data[i + 3])) {
      sample.push([data[i], data[i + 1], data[i + 2]]);
    }
  };

  for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 16))) {
    collect(x, 0);
    collect(x, height - 1);
  }
  for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 16))) {
    collect(0, y);
    collect(width - 1, y);
  }
  collect(0, 0);
  collect(width - 1, 0);
  collect(0, height - 1);
  collect(width - 1, height - 1);

  const palette = [];
  sample.forEach((color) => {
    const existing = palette.find((candidate) => colorDistance(candidate, color) <= 18);
    if (!existing) palette.push(color);
  });
  return palette.slice(0, 4);
}

function clearEdgeConnectedCheckerboard(ctx, width, height) {
  const palette = buildCheckerPalette(ctx, width, height);
  if (!palette.length) return;
  const frame = ctx.getImageData(0, 0, width, height);
  const pixels = frame.data;
  const visited = new Uint8Array(width * height);
  const queue = new Uint32Array(width * height);
  let head = 0;
  let tail = 0;

  const tryQueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    const p = idx * 4;
    const pixel = [pixels[p], pixels[p + 1], pixels[p + 2]];
    const isPaletteMatch = palette.some((candidate) => colorDistance(candidate, pixel) <= 24);
    if (isPaletteMatch && isLikelyCheckerPixel(pixels[p], pixels[p + 1], pixels[p + 2], pixels[p + 3])) {
      queue[tail++] = idx;
    }
  };

  for (let x = 0; x < width; x += 1) {
    tryQueue(x, 0);
    tryQueue(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    tryQueue(0, y);
    tryQueue(width - 1, y);
  }

  while (head < tail) {
    const idx = queue[head++];
    const p = idx * 4;
    pixels[p + 3] = 0;
    const x = idx % width;
    const y = Math.floor(idx / width);
    tryQueue(x + 1, y);
    tryQueue(x - 1, y);
    tryQueue(x, y + 1);
    tryQueue(x, y - 1);
  }

  ctx.putImageData(frame, 0, 0);
}

function removeResidualCheckerPixels(ctx, width, height) {
  const palette = buildCheckerPalette(ctx, width, height);
  if (!palette.length) return;
  const frame = ctx.getImageData(0, 0, width, height);
  const data = frame.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (!isLikelyCheckerPixel(r, g, b, a)) continue;
    const pixel = [r, g, b];
    if (!palette.some((candidate) => colorDistance(candidate, pixel) <= 20)) continue;
    const brightness = (r + g + b) / 3;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturationRange = max - min;
    if (brightness > 155 && saturationRange < 16) {
      data[i + 3] = 0;
    } else if (brightness > 125 && saturationRange < 12) {
      data[i + 3] = Math.min(a, 24);
    }
  }
  ctx.putImageData(frame, 0, 0);
}

export default function CleanCharacterImage({ src, alt, className = "", onError }) {
  const canvasRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    if (!src || !canvasRef.current) return undefined;

    const img = new Image();
    img.onload = () => {
      if (!active || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      clearEdgeConnectedCheckerboard(ctx, canvas.width, canvas.height);
      removeResidualCheckerPixels(ctx, canvas.width, canvas.height);
    };
    img.onerror = () => {
      setFailed(true);
      onError?.();
    };
    img.src = src;

    return () => {
      active = false;
    };
  }, [src, onError]);

  if (failed) return <img src={src} alt={alt} className={className} />;
  return <canvas ref={canvasRef} aria-label={alt} className={className} />;
}
