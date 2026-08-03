"use client";

import { Shuffle } from "lucide-react";
import { Place } from "@/types";

interface Props {
  places: Place[];
  onSelect: (place: Place) => void;
}

export default function RandomDestination({ places, onSelect }: Props) {
  const handleClick = () => {
    if (places.length === 0) return;
    const random = places[Math.floor(Math.random() * places.length)];
    onSelect(random);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all active:scale-95 border"
      style={{
        background: "rgba(20,16,12,0.9)",
        backdropFilter: "blur(8px)",
        borderColor: "rgba(122,107,82,0.2)",
        color: "#9a8a72",
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      }}
      title="Draw a random destination from the archives (R)"
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "#ddd0bc";
        e.currentTarget.style.borderColor = "rgba(154,138,114,0.35)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "#9a8a72";
        e.currentTarget.style.borderColor = "rgba(122,107,82,0.2)";
      }}
    >
      <Shuffle size={14} />
      <span className="font-mono text-xs uppercase tracking-wider">Drift</span>
    </button>
  );
}