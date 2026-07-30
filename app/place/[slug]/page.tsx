"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Ghost, Skull } from "lucide-react";
import { useState, useEffect } from "react";

interface Place {
  _id: string;
  name: string;
  slug: string;
  category: "abandoned" | "haunted" | "both";
  coordinates: [number, number];
  description?: string;
  location?: string;
}

export default function ArchivesPage() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [filter, setFilter] = useState<"all" | "abandoned" | "haunted" | "both">("all");

  useEffect(() => {
    fetch("/api/places")
      .then((r) => r.json())
      .then((d) => setPlaces(d.places || []))
      .catch(() => setPlaces([]));
  }, []);

  const filtered = filter === "all" ? places : places.filter((p) => p.category === filter);

  return (
    <main className="min-h-screen bg-[#0f0c09] text-[#ddd0bc] font-mono p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-[rgba(122,107,82,0.2)] pb-4">
          <div>
            <h1 className="font-cinzel text-2xl md:text-3xl tracking-wide text-[#ddd0bc]">The Archives</h1>
            <p className="text-[11px] text-[#9a8a72] mt-1 uppercase tracking-widest">All documented points of decay</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-[#252018]/80 border border-[rgba(122,107,82,0.25)] rounded-lg text-[#9a8a72] hover:text-[#ddd0bc] hover:border-[#9a8a72] transition-all text-sm"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline text-xs uppercase tracking-wider">Back to Atlas</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(["all", "abandoned", "haunted", "both"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded border text-[10px] uppercase tracking-wider transition-all whitespace-nowrap ${
                filter === f
                  ? "border-[#9a8a72] text-[#ddd0bc] bg-[#9a8a72]/10"
                  : "border-[rgba(122,107,82,0.2)] text-[#9a8a72] hover:border-[#9a8a72]/50"
              }`}
            >
              {f === "all" && <span className="flex items-center gap-1.5"><MapPin size={10} /> All ({places.length})</span>}
              {f === "abandoned" && <span className="flex items-center gap-1.5"><Skull size={10} /> Forsaken ({places.filter(p => p.category === "abandoned").length})</span>}
              {f === "haunted" && <span className="flex items-center gap-1.5"><Ghost size={10} /> Spectral ({places.filter(p => p.category === "haunted").length})</span>}
              {f === "both" && <span className="flex items-center gap-1.5">Both ({places.filter(p => p.category === "both").length})</span>}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-2">
          {filtered.map((place, idx) => (
            <motion.div
              key={place._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => router.push(`/?place=${place.slug}`)}
              className="group flex items-center justify-between p-3 md:p-4 bg-[#1a1612]/60 border border-[rgba(122,107,82,0.1)] rounded-lg hover:border-[#9a8a72]/40 hover:bg-[#1e1a14] transition-all cursor-pointer"
            >
              <div className="min-w-0">
                <h3 className="font-cinzel text-sm md:text-base text-[#ddd0bc] group-hover:text-[#f0e6d8] transition-colors truncate">{place.name}</h3>
                <p className="text-[10px] text-[#9a8a72] mt-0.5 uppercase tracking-wider">{place.location || "Unknown coordinates"}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <span className={`text-[9px] uppercase tracking-wider px-2 py-1 rounded border ${
                  place.category === "haunted" ? "border-[#7a3a2a]/40 text-[#a67c52]" :
                  place.category === "both" ? "border-[#a67c52]/40 text-[#c4a882]" :
                  "border-[#5a6a5a]/40 text-[#8a9a8a]"
                }`}>
                  {place.category}
                </span>
                <ArrowLeft size={12} className="rotate-180 text-[#9a8a72] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}