"use client";

import { useEffect, useRef } from "react";

interface Props {
  active: boolean;
  color?: string;
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  if (clean.length === 3) {
    const [r, g, b] = clean.split("").map((c) => parseInt(c + c, 16));
    return { r: r ?? 154, g: g ?? 138, b: b ?? 114 };
  }
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return {
    r: Number.isNaN(r) ? 154 : r,
    g: Number.isNaN(g) ? 138 : g,
    b: Number.isNaN(b) ? 114 : b,
  };
}

export default function SpectrogramViewer({ active, color = "#9a8a72" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const { r, g, b } = hexToRgb(color);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
    };
    resize();
    window.addEventListener("resize", resize);

    let offset = 0;
    const draw = () => {
      if (!ctx) return;
      ctx.fillStyle = "rgba(12, 10, 8, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bars = 64;
      const barW = canvas.width / bars;

      for (let i = 0; i < bars; i++) {
        const noise = Math.sin(i * 0.3 + offset) * Math.cos(i * 0.7 - offset * 0.5);
        const height = Math.abs(noise) * canvas.height * 0.6 + Math.random() * canvas.height * 0.2;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.3 + Math.abs(noise) * 0.5})`;
        ctx.fillRect(i * barW, canvas.height - height, barW - 1, height);
      }

      offset += 0.05;
      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [active, r, g, b]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-32 rounded border"
      style={{
        borderColor: `rgba(${r}, ${g}, ${b}, 0.12)`,
        backgroundColor: "#0c0a08",
      }}
    />
  );
}