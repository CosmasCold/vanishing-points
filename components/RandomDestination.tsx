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
      className="flex items-center gap-2 px-4 py-2 bg-[#252018]/90 backdrop-blur-sm border border-[rgba(122,107,82,0.3)] rounded-lg text-[#9a8a72] hover:text-[#ddd0bc] hover:border-[#9a8a72] transition-all text-sm shadow-lg"
      title="Draw a random destination from the archives"
    >
      <Shuffle size={14} />
      <span className="font-mono text-xs uppercase tracking-wider">Surprise Me</span>
    </button>
  );
}