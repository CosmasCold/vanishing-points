// components/effects/EchoRipples.tsx
'use client';

import { useEffect, useState } from 'react';
import { gameState, type Place } from '@/logic/gameState';

interface EchoRipplesProps {
  selectedPlace: Place | null;
}

export function EchoRipples({ selectedPlace }: EchoRipplesProps) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!selectedPlace) return;
    const interval = setInterval(() => {
      setOffset((o) => (o + 0.5) % 12);
    }, 80);
    return () => clearInterval(interval);
  }, [selectedPlace]);

  if (!selectedPlace) return null;

  const connections = gameState.getPlaceConnections(selectedPlace.slug);
  if (connections.length === 0) return null;

  // Simplified: render a decorative indicator instead of actual map-projected lines
  // To implement full projection, pass a map ref and use map.project()
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <svg className="absolute inset-0 w-full h-full opacity-15">
        <defs>
          <pattern
            id="rippleDash"
            width="12"
            height="12"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="6"
              x2="12"
              y2="6"
              stroke="#9a8a72"
              strokeWidth="1"
              strokeDasharray="6 6"
              strokeDashoffset={-offset}
            />
          </pattern>
        </defs>
        {/* Draw lines from center to edge sectors representing connections */}
        {connections.map((conn, i) => {
          const angle = (i / connections.length) * Math.PI * 2 - Math.PI / 2;
          const cx = 50;
          const cy = 50;
          const r = 45;
          return (
            <line
              key={conn.slug}
              x1={`${cx}%`}
              y1={`${cy}%`}
              x2={`${cx + Math.cos(angle) * r}%`}
              y2={`${cy + Math.sin(angle) * r}%`}
              stroke="url(#rippleDash)"
              strokeWidth="0.5"
              opacity={0.3 + Math.sin(offset + i) * 0.1}
            />
          );
        })}
      </svg>
      <div className="absolute top-4 left-4 text-[8px] text-[#c4785a]/40 font-mono tracking-widest uppercase">
        {connections.length} resonance{connections.length > 1 ? 's' : ''} active
      </div>
    </div>
  );
}