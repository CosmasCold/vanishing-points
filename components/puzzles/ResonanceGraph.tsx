// components/puzzles/ResonanceGraph.tsx
'use client';

import React from 'react';
import { type Place } from '@/logic/gameState';

interface ResonanceGraphProps {
  place: Place;
  connections: Place[];
  onClose: () => void;
}

export default function ResonanceGraph({ place, connections, onClose }: ResonanceGraphProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#0c0a08] border border-[#9a8a72]/30 p-6 rounded-lg max-w-2xl w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#9a8a72] mb-4">
          Resonance: {place.name}
        </h3>
        <div className="h-64 w-full bg-[#1a1612] rounded border border-[#9a8a72]/10 flex items-center justify-center text-[11px] text-[#9a8a72]">
          <svg className="w-full h-full">
            <circle cx="50%" cy="50%" r="20" fill="#c4785a" opacity="0.8" />
            <text x="50%" y="50%" textAnchor="middle" dy=".3em" fill="#ddd0bc" fontSize="10">
              {place.name}
            </text>
            {connections.map((p, i) => {
              const angle = (i / connections.length) * 2 * Math.PI;
              const x = 50 + 30 * Math.cos(angle);
              const y = 50 + 30 * Math.sin(angle);
              return (
                <g key={p.slug}>
                  <line
                    x1="50%"
                    y1="50%"
                    x2={`${x}%`}
                    y2={`${y}%`}
                    stroke="#9a8a72"
                    strokeWidth="0.5"
                    strokeDasharray="3,3"
                    opacity="0.4"
                  />
                  <circle cx={`${x}%`} cy={`${y}%`} r="8" fill="#9a8a72" opacity="0.6" />
                  <text
                    x={`${x}%`}
                    y={`${y}%`}
                    textAnchor="middle"
                    dy=".3em"
                    fill="#ddd0bc"
                    fontSize="6"
                  >
                    {p.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full border border-[#9a8a72]/30 py-1.5 text-[9px] uppercase tracking-widest text-[#ddd0bc] hover:bg-[#9a8a72]/10 transition rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}