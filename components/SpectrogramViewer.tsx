"use client";

import { useEffect, useRef } from "react";

interface Props {
  active: boolean;
  color?: string;
}

export default function SpectrogramViewer({ active, color = "#c4a882" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

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
      ctx.fillStyle = "rgba(5, 5, 5, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bars = 64;
      const barW = canvas.width / bars;
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);

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
  }, [active, color]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-32 rounded border"
      style={{ borderColor: `${color}20`, backgroundColor: "#050505" }}
    />
  );
}