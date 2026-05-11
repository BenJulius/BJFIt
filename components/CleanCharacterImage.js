"use client";
import { useEffect, useRef, useState } from "react";

function shouldClearPixel(r, g, b, a) {
  if (a < 250) return false;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const range = max - min;
  if (range > 16) return false;
  // Typical checkerboard backgrounds are neutral grays in this brightness range.
  const brightness = (r + g + b) / 3;
  return brightness >= 90 && brightness <= 235;
}

export default function CleanCharacterImage({ src, alt, className = "", onError }) {
  const canvasRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    if (!src || !canvasRef.current) return undefined;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!active || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = frame.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (shouldClearPixel(r, g, b, a)) data[i + 3] = 0;
      }
      ctx.putImageData(frame, 0, 0);
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
