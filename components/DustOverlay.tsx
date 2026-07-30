"use client";

import { useEffect, useRef } from "react";
import { useDustLevel } from "@/hooks/useDustLevel";

export default function DustOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { level } = useDustLevel();
  const particles = useRef<
    { x: number; y: number; size: number; speedY: number; opacity: number; drift: number }[]
  >([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Particle count scales with dust level (0-100)
    const targetCount = Math.floor((level / 100) * 150);
    while (particles.current.length < targetCount) {
      particles.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedY: Math.random() * 0.3 + 0.1,
        opacity: Math.random() * 0.4 + 0.1,
        drift: (Math.random() - 0.5) * 0.2,
      });
    }

    let anim: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Vignette intensifies with dust
      const vignette = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.height * 0.3,
        canvas.width / 2, canvas.height / 2, canvas.height * 0.8
      );
      const vOpacity = Math.min(0.6, level / 100);
      vignette.addColorStop(0, `rgba(10,8,5,0)`);
      vignette.addColorStop(1, `rgba(10,8,5,${vOpacity})`);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw particles
      particles.current.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(154, 138, 114, ${p.opacity * (level / 100)})`;
        ctx.fill();

        p.y += p.speedY;
        p.x += p.drift + Math.sin(p.y * 0.01) * 0.2;

        if (p.y > canvas.height) {
          p.y = -5;
          p.x = Math.random() * canvas.width;
        }
      });

      anim = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(anim);
      window.removeEventListener("resize", resize);
    };
  }, [level]);

  if (level < 10) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[45] pointer-events-none"
      style={{ mixBlendMode: "screen" }}
    />
  );
}