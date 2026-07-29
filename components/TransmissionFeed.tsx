"use client";

import { useEffect, useState, useRef } from "react";
import { Radio } from "lucide-react";
import { useVisitedPlaces } from "@/hooks/useVisitedPlaces";
import { useDustLevel } from "@/hooks/useDustLevel";
import { Place } from "@/types";
import { BUNKER_TRANSMISSIONS } from "@/lib/echoesContent";

const STATIC_ATLAS = [
  "Signal detected from coordinates unknown...",
  "Archivist approved new spectral accounts",
  "Field agent reports structural shift in Zone 4",
  "A visitor left marginalia in the margins",
  "New ruin documented in sector 7",
  "Atmospheric interference increasing",
  "Expedition briefing downloaded",
  "Coordinates verified by satellite",
];

// Minimum quiet time between any transmissions
const MIN_QUIET_MS = 18000; // 18 seconds
// Maximum time before a forced update
const MAX_INTERVAL_MS = 45000; // 45 seconds
// Chance a bunker transmission appears (only if echoes visited)
const BUNKER_CHANCE = 0.15; // 15%

export default function TransmissionFeed({ places }: { places: Place[] }) {
  const { count } = useVisitedPlaces();
  const { echoesVisited } = useDustLevel();
  const [line, setLine] = useState("");
  const [isBunker, setIsBunker] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const lastBunkerRef = useRef(0);
  const poolRef = useRef<string[]>([]);

  useEffect(() => {
    const real = count > 0
      ? [`You have logged ${count} expedition${count !== 1 ? "s" : ""}`]
      : [];

    const placeBased = places.length
      ? [`${places.length} ruins documented`]
      : [];

    poolRef.current = [...real, ...placeBased, ...STATIC_ATLAS];
  }, [count, places]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const scheduleNext = () => {
      const delay = MIN_QUIET_MS + Math.random() * (MAX_INTERVAL_MS - MIN_QUIET_MS);

      timeout = setTimeout(() => {
        const basePool = poolRef.current;
        if (basePool.length === 0) {
          scheduleNext();
          return;
        }

        // Decide if this should be a bunker transmission
        const now = Date.now();
        const timeSinceLastBunker = now - lastBunkerRef.current;
        const canBunker = echoesVisited && timeSinceLastBunker > 120000; // Min 2 min between bunker msgs

        let next: string;
        let bunker = false;

        if (canBunker && Math.random() < BUNKER_CHANCE) {
          next = BUNKER_TRANSMISSIONS[Math.floor(Math.random() * BUNKER_TRANSMISSIONS.length)];
          bunker = true;
          lastBunkerRef.current = now;
        } else {
          next = basePool[Math.floor(Math.random() * basePool.length)];
        }

        setLine(next);
        setIsBunker(bunker);

        if (bunker) {
          setGlitch(true);
          setTimeout(() => setGlitch(false), 400);
          window.dispatchEvent(new CustomEvent("bunker-transmission", {
            detail: { message: next },
          }));
        }

        scheduleNext();
      }, delay);
    };

    // Initial line
    if (poolRef.current.length > 0) {
      setLine(poolRef.current[0]);
    }
    scheduleNext();

    return () => clearTimeout(timeout);
  }, [echoesVisited]);

  if (!line) return null;

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40">
      <div
        className={`flex items-center gap-3 px-4 py-2 bg-[#0f0c09]/80 backdrop-blur-sm border rounded-full text-[10px] font-mono uppercase tracking-wider shadow-lg whitespace-nowrap transition-all duration-300 ${
          glitch
            ? "border-[#33ff00]/60 text-[#33ff00] shadow-[0_0_20px_rgba(51,255,0,0.3)] scale-105"
            : isBunker
            ? "border-[#33ff00]/40 text-[#33ff00] shadow-[0_0_15px_rgba(51,255,0,0.15)]"
            : "border-[rgba(122,107,82,0.2)] text-[#9a8a72]"
        }`}
      >
        <Radio size={10} className={`${isBunker ? "animate-pulse" : ""}`} />
        <span className="overflow-hidden max-w-[280px] sm:max-w-md truncate">
          {line}
        </span>
      </div>
    </div>
  );
}