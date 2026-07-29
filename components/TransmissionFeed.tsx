"use client";

import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import { useVisitedPlaces } from "@/hooks/useVisitedPlaces";
import { useDustLevel } from "@/hooks/useDustLevel";
import { Place } from "@/types";

const STATIC_ATLAS = [
  "Signal detected from coordinates unknown...",
  "Archivist approved new spectral accounts",
  "Field agent reports structural shift in Zone 4",
  "A visitor left marginalia in the margins",
];

const BUNKER_TRANSMISSIONS = [
  "BUNKER_7: The dust is thicker today.",
  "BUNKER_7: Door 3 opened at 03:14. I did not open it.",
  "BUNKER_7: The atlas is keeping them contained. I think.",
  "BUNKER_7: If you're reading this, you're already inside.",
  "BUNKER_7: Don't trust the coordinates near the reactor.",
  "BUNKER_7: The silence has weight now.",
  "SIGNAL: Echoes detected in your sector.",
  "SIGNAL: Check your reflection. Check it again.",
];

export default function TransmissionFeed({ places }: { places: Place[] }) {
  const { visited, count } = useVisitedPlaces();
  const { level, echoesVisited, isCorrupted } = useDustLevel();
  const [line, setLine] = useState("");
  const [isBunker, setIsBunker] = useState(false);

  useEffect(() => {
    const real = count > 0
      ? [`You have logged ${count} expedition${count !== 1 ? "s" : ""}`]
      : [];

    const placeBased = places.length
      ? [`${places.length} ruins documented`]
      : [];

    const pool = echoesVisited
      ? [...real, ...placeBased, ...STATIC_ATLAS, ...BUNKER_TRANSMISSIONS]
      : [...real, ...placeBased, ...STATIC_ATLAS];

    let i = 0;
    setLine(pool[0]);
    setIsBunker(echoesVisited && BUNKER_TRANSMISSIONS.includes(pool[0]));

    const interval = setInterval(() => {
      i = (i + 1) % pool.length;
      const next = pool[i];
      setLine(next);
      const bunker = echoesVisited && BUNKER_TRANSMISSIONS.includes(next);
      setIsBunker(bunker);

      if (bunker) {
        // Dispatch audio/visual corruption event
        window.dispatchEvent(new CustomEvent("bunker-transmission", {
          detail: { message: next },
        }));
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [visited, count, places, echoesVisited]);

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40">
      <div
        className={`flex items-center gap-3 px-4 py-2 bg-[#0f0c09]/80 backdrop-blur-sm border rounded-full text-[10px] font-mono uppercase tracking-wider shadow-lg whitespace-nowrap transition-all duration-500 ${
          isBunker
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