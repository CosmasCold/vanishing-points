"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, X } from "lucide-react";
import { Place } from "@/types";

interface Props {
  places: Place[];
  onCenter: (coords: [number, number]) => void;
  onSelect: (place: Place) => void;
}

export default function NearMeButton({ places, onCenter, onSelect }: Props) {
  const [nearest, setNearest] = useState<Place | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const haversine = (
    [lon1, lat1]: [number, number],
    [lon2, lat2]: [number, number]
  ) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleClick = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const user: [number, number] = [
          pos.coords.longitude,
          pos.coords.latitude,
        ];
        let best: Place | null = null;
        let bestDist = Infinity;

        places.forEach((p) => {
          const d = haversine(user, p.coordinates);
          if (d < bestDist) {
            bestDist = d;
            best = p;
          }
        });

        setNearest(best);
        setDistance(bestDist);
        onCenter(user);
        setLoading(false);
      },
      () => setLoading(false),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  return (
    <div className="absolute bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {nearest && distance !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-[#252018] border border-[rgba(122,107,82,0.25)] rounded-lg p-4 shadow-xl max-w-[260px]"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9a8a72]">
                Nearest Ruin
              </span>
              <button onClick={() => setNearest(null)} className="text-[#9a8a72] hover:text-[#ddd0bc]">
                <X size={12} />
              </button>
            </div>
            <p className="font-cinzel text-sm text-[#ddd0bc] mb-1">{nearest.name}</p>
            <p className="text-[10px] font-mono text-[#9a8a72] mb-3">
              {Math.round(distance)} km from your position
            </p>
            <button
              onClick={() => onSelect(nearest)}
              className="w-full py-1.5 bg-[rgba(122,107,82,0.15)] border border-[rgba(122,107,82,0.25)] rounded text-[10px] font-mono uppercase tracking-wider text-[#c4b8a4] hover:bg-[rgba(122,107,82,0.25)] transition-colors"
            >
              Navigate to site
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={handleClick}
        disabled={loading}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-[#252018] border border-[rgba(122,107,82,0.3)] text-[#9a8a72] hover:text-[#c4b8a4] hover:border-[#9a8a72] transition-all shadow-lg"
        title="Find nearest ruin"
      >
        <Navigation size={16} className={loading ? "animate-pulse" : ""} />
      </button>
    </div>
  );
}