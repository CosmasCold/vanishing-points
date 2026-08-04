// components/effects/MapAgingOverlay.tsx
'use client';

import { useEffect, useState } from 'react';

interface MapAgingOverlayProps {
  dust: number;
  sessionTime: number;
}

export function MapAgingOverlay({ dust, sessionTime }: MapAgingOverlayProps) {
  const [timeOffset, setTimeOffset] = useState({ x: 30, y: 40 });

  useEffect(() => {
    const interval = setInterval(() => {
      const t = Date.now();
      setTimeOffset({
        x: 30 + Math.sin(t / 10000) * 10,
        y: 40 + Math.cos(t / 15000) * 10,
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const burnIntensity = Math.min(1, dust / 50 + (sessionTime / 3600000) * 0.2);

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at ${timeOffset.x}% ${timeOffset.y}%, 
                       rgba(80,60,40,${burnIntensity * 0.15}) 0%, 
                       transparent 70%)`,
          mixBlendMode: 'multiply',
        }}
      />
      {burnIntensity > 0.5 && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='200' cy='200' r='${
              80 + burnIntensity * 60
            }' fill='none' stroke='%239a8a72' stroke-width='${
              0.5 + burnIntensity
            }' opacity='${0.1 * burnIntensity}'/%3E%3Ccircle cx='180' cy='190' r='${
              120 + burnIntensity * 40
            }' fill='none' stroke='%239a8a72' stroke-width='${
              0.3 + burnIntensity * 0.5
            }' opacity='${0.06 * burnIntensity}'/%3E%3C/svg%3E")`,
            backgroundSize: '100% 100%',
            opacity: 0.3 * burnIntensity,
          }}
        />
      )}
    </div>
  );
}