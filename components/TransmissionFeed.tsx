"use client";

import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import { useVisitedPlaces } from "@/hooks/useVisitedPlaces";
import { Place } from "@/types";

const STATIC_TRANSMISSIONS = [
  "Signal detected from coordinates unknown...",
  "Archivist approved new spectral accounts",
  "Field agent reports structural shift in Zone 4",
  "Static increasing on eastern frequencies",
  "The bunker door remains sealed",
  "Echoes recorded at 03:14 local time",
  "A visitor left marginalia in the margins",
  "Dust patterns do not match wind direction",
];

export default function TransmissionFeed({ places }: { places: Place[] }) {
  const { visited, count } = useVisitedPlaces();
  const [line, setLine] = useState("");

  useEffect(() => {
    const real =
      count > 0
        ? [
            `You have logged ${count} expedition${count !== 1 ? "s" : ""}`,
            `Last visit: ${visited[visited.length - 1]?.name}`,
          ]
        : [];

    const placeBased = places.length
      ? [
          `${places.length} ruins documented`,
          `${places.filter((p) => p.dangerLevel >= 4).length} extreme-hazard zones active`,
        ]
      : [];

    const all = [...real, ...placeBased, ...STATIC_TRANSMISSIONS];
    let i = 0;
    setLine(all[0]);

    const interval = setInterval(() => {
      i = (i + 1) % all.length;
      setLine(all[i]);
    }, 5000);

    return () => clearInterval(interval);
  }, [visited, count, places]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="flex items-center gap-3 px-4 py-2 bg-[#0f0c09]/80 backdrop-blur-sm border border-[rgba(122,107,82,0.2)] rounded-full text-[10px] font-mono uppercase tracking-wider text-[#9a8a72] shadow-lg whitespace-nowrap">
        <Radio size={10} className="text-[#7a3a2a] animate-pulse" />
        <span className="overflow-hidden max-w-[280px] sm:max-w-md truncate">
          {line}
        </span>
      </div>
    </div>
  );
}