"use client";

import { useEffect, useState } from "react";
import { useDustLevel } from "@/hooks/useDustLevel";

interface Props {
  places: { coordinates: [number, number] }[];
  wandererPos?: [number, number] | null;
}

export default function LyingCompass({ places, wandererPos }: Props) {
  const [rotation, setRotation] = useState(0);
  const { level, isCorrupted, echoesVisited } = useDustLevel();

  useEffect(() => {
    const update = () => {
      let target = 0;

      if (!echoesVisited) {
        // Normal: points north (0)
        target = 0;
      } else if (wandererPos && isCorrupted) {
        // Points at the wandering ghost marker
        const centerLng = places.length
          ? places.reduce((s, p) => s + p.coordinates[0], 0) / places.length
          : 0;
        const centerLat = places.length
          ? places.reduce((s, p) => s + p.coordinates[1], 0) / places.length
          : 0;
        target =
          (Math.atan2(
            wandererPos[1] - centerLat,
            wandererPos[0] - centerLng
          ) *
            180) /
          Math.PI;
      } else if (places.length > 0 && level > 20) {
        // Points toward nearest ruin from approximate center
        const centerLng = places.reduce((s, p) => s + p.coordinates[0], 0) / places.length;
        const centerLat = places.reduce((s, p) => s + p.coordinates[1], 0) / places.length;
        const nearest = places.reduce<{ p: typeof places[0]; d: number }>(
          (best, p) => {
            const d = Math.hypot(p.coordinates[0] - centerLng, p.coordinates[1] - centerLat);
            return d < best.d ? { p, d } : best;
          },
          { p: places[0], d: Infinity }
        );
        target =
          (Math.atan2(
            nearest.p.coordinates[1] - centerLat,
            nearest.p.coordinates[0] - centerLng
          ) *
            180) /
          Math.PI;
      } else {
        // Slight drift
        target = Math.sin(Date.now() / 3000) * 5;
      }

      // Add jitter based on dust
      const jitter = isCorrupted ? (Math.random() - 0.5) * 8 : 0;
      setRotation(target + jitter);
    };

    const interval = setInterval(update, 2000);
    update();
    return () => clearInterval(interval);
  }, [places, wandererPos, echoesVisited, isCorrupted, level]);

  return (
    <div className="fixed bottom-48 right-6 z-40 w-16 h-16 pointer-events-none">
      <div className="relative w-full h-full rounded-full border-2 border-[rgba(122,107,82,0.3)] bg-[#252018]/60 backdrop-blur-sm shadow-lg flex items-center justify-center">
        {/* Cardinal marks */}
        <span className="absolute top-1 text-[7px] font-mono text-[#9a8a72]/50">N</span>
        <span className="absolute bottom-1 text-[7px] font-mono text-[#9a8a72]/50">S</span>
        <span className="absolute left-1.5 text-[7px] font-mono text-[#9a8a72]/50">W</span>
        <span className="absolute right-1.5 text-[7px] font-mono text-[#9a8a72]/50">E</span>

        {/* Needle */}
        <div
          className="w-0.5 h-8 relative transition-transform duration-[2000ms] ease-out"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-r-[3px] border-b-[14px] border-l-transparent border-r-transparent border-b-[#7a3a2a]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-r-[3px] border-t-[14px] border-l-transparent border-r-transparent border-t-[#9a8a72]/40" />
        </div>

        {/* Center pin */}
        <div className="absolute w-1.5 h-1.5 rounded-full bg-[#5a4e42] border border-[#9a8a72]/30" />
      </div>
    </div>
  );
}