// components/effects/CRTOverlay.tsx
'use client';

import React, { useEffect, useRef } from 'react';

interface CRTOverlayProps {
  corruptionStage: number;
}

export function CRTOverlay({ corruptionStage }: CRTOverlayProps) {
  const flickerRef = useRef<HTMLDivElement>(null);

  // Irregular flicker — imperceptible opacity oscillation
  useEffect(() => {
    const el = flickerRef.current;
    if (!el) return;

    let raf: number;
    let lastFlicker = 0;

    const flicker = (time: number) => {
      // Base interval 4s, corruption adds variance
      const baseInterval = 4000 - corruptionStage * 500;
      const jitter = Math.random() * 3000;
      if (time - lastFlicker > baseInterval + jitter) {
        el.style.opacity = String(0.98 + Math.random() * 0.04);
        lastFlicker = time;
        setTimeout(() => {
          if (el) el.style.opacity = '1';
        }, 40 + Math.random() * 80);
      }
      raf = requestAnimationFrame(flicker);
    };

    raf = requestAnimationFrame(flicker);
    return () => cancelAnimationFrame(raf);
  }, [corruptionStage]);

  const scanlineOpacity = 0.04 + corruptionStage * 0.02;

  return (
    <div className="pointer-events-none fixed inset-0 z-45">
      {/* Scanlines */}
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, ${scanlineOpacity}),
            rgba(0, 0, 0, ${scanlineOpacity}) 1px,
            transparent 1px,
            transparent 4px
          )`,
        }}
      />
      {/* Flicker layer */}
      <div
        ref={flickerRef}
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(0,0,0,0.01)',
          transition: 'opacity 0.05s',
        }}
      />
      {/* Phosphor afterglow tint */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(196, 120, 90, 0.005)',
          mixBlendMode: 'screen',
        }}
      />
    </div>
  );
}