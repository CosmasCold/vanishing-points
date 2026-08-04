// components/effects/StaticWaveform.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import type { TerminalTheme } from '@/lib/terminalThemes';

interface StaticWaveformProps {
  theme: TerminalTheme;
  active: boolean;
}

export default function StaticWaveform({ theme, active }: StaticWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = 16;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    let time = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const spike = Math.random() * 0.25 + 0.15;
      const step = (2 * Math.PI) / canvas.width;
      ctx.beginPath();
      for (let i = 0; i < canvas.width; i++) {
        const x = i / canvas.width;
        const y = 8 + Math.sin(x * 18 + time) * (3 + spike * 4) + Math.sin(x * 28 + time * 0.6) * 1.5;
        ctx.fillStyle = theme.primary;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(i, y, 1, 1);
      }
      time += 0.04;
      requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [theme.primary, active]);

  return <canvas ref={canvasRef} className="w-full h-4 opacity-50 pointer-events-none" />;
}