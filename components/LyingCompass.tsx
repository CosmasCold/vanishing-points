"use client";

import { useEffect, useState } from "react";
import { useDustLevel } from "@/hooks/useDustLevel";

interface Props {
  places: { coordinates: [number, number] }[];
  // NOTE: Currently unwired in page.tsx. Pass a [lng, lat] tuple
  // from a wandering ghost marker to activate the ghost-pointing branch.
  wandererPos?: [number, number] | null;
}

export default function LyingCompass({ places, wandererPos }: Props) {
  const [rotation, setRotation] = useState(0);
  
  // Safe destructuring — fallback if hook shape changes
  const dust = useDustLevel();
  const level = dust?.level ?? 0;
  const isCorrupted = dust?.isCorrupted ?? (level > 50);

  // echoesVisited is a page visit flag, not dust state.
  // Read directly to avoid hook coupling.
  const [echoesVisited, setEchoesVisited] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setEchoesVisited(localStorage.getItem("vp-echoes-visited") === "true");
  }, []);

  useEffect(() => {
    const update = () => {
      let target = 0;

      if (!echoesVisited) {
        // Before visiting echoes: points north, still
        target = 0;
      } else if (wandererPos && isCorrupted) {
        // Corrupted + ghost known: needle follows the wanderer
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
        // Moderate dust: pulls toward nearest ruin from center
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
        // Low dust: gentle drift, almost honest
        target = Math.sin(Date.now() / 3000) * 5;
      }

      const jitter = isCorrupted ? (Math.random() - 0.5) * 8 : 0;
      setRotation(target + jitter);
    };

    const interval = setInterval(update, 2000);
    update();
    return () => clearInterval(interval);
  }, [places, wandererPos, echoesVisited, isCorrupted, level]);

  return (
    <div 
      className="fixed bottom-32 md:bottom-48 right-4 md:right-6 z-40 w-14 h-14 md:w-16 md:h-16 pointer-events-none" 
      aria-hidden="true"
    >
      <div 
        className="relative w-full h-full rounded-full border-2 backdrop-blur-sm flex items-center justify-center transition-all duration-1000"
        style={{
          borderColor: isCorrupted ? "rgba(196,120,90,0.25)" : "rgba(122,107,82,0.3)",
          background: "rgba(20,16,10,0.6)",
          boxShadow: isCorrupted 
            ? "0 0 20px rgba(196,120,90,0.06), inset 0 0 8px rgba(196,120,90,0.03)" 
            : "0 4px 12px rgba(0,0,0,0.4)",
        }}
      >
        {/* Cardinal marks */}
        <span className="absolute top-1 text-[10px] font-mono" style={{ color: "rgba(154,138,114,0.4)" }}>N</span>
        <span className="absolute bottom-1 text-[10px] font-mono" style={{ color: "rgba(154,138,114,0.4)" }}>S</span>
        <span className="absolute left-1 text-[10px] font-mono" style={{ color: "rgba(154,138,114,0.4)" }}>W</span>
        <span className="absolute right-1 text-[10px] font-mono" style={{ color: "rgba(154,138,114,0.4)" }}>E</span>

        {/* Needle */}
        <div
          className="w-0.5 h-7 md:h-8 relative transition-transform duration-[2000ms] ease-out"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-r-[3px] border-b-[12px] md:border-b-[14px] border-l-transparent border-r-transparent" 
            style={{ borderBottomColor: isCorrupted ? "#c4785a" : "#7a3a2a" }} 
          />
          <div 
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-r-[3px] border-t-[12px] md:border-t-[14px] border-l-transparent border-r-transparent" 
            style={{ borderTopColor: "rgba(154,138,114,0.35)" }} 
          />
        </div>

        {/* Center pin */}
        <div 
          className="absolute w-1.5 h-1.5 rounded-full border" 
          style={{ background: "#5a4e42", borderColor: "rgba(154,138,114,0.3)" }} 
        />
      </div>
    </div>
  );
}