"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, X } from "lucide-react";
import { Place } from "@/types";

interface Props {
  places: Place[];
  onSelect: (place: Place) => void;
  onFlyTo: (coords: [number, number]) => void;
}

export default function MapSearch({ places, onSelect, onFlyTo }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = query.trim()
    ? places.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.address.city.toLowerCase().includes(query.toLowerCase()) ||
          p.address.country.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (place: Place) => {
    onFlyTo(place.coordinates);
    onSelect(place);
    setQuery("");
    setOpen(false);
  };

  return (
    <div 
      ref={containerRef} 
      className="absolute top-16 md:top-24 left-3 md:left-6 z-40 w-[calc(100%-1.5rem)] max-w-xs sm:w-72"
    >
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8a72]"
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search... (⌘K)"
          className="w-full bg-[#252018]/90 backdrop-blur-sm border border-[rgba(122,107,82,0.3)] rounded-lg py-2 md:py-2.5 pl-9 pr-8 text-sm text-[#ddd0bc] placeholder:text-[#5a4e42] focus:border-[#9a8a72] focus:outline-none shadow-lg"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8a72] hover:text-[#ddd0bc]"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-2 bg-[#252018] border border-[rgba(122,107,82,0.3)] rounded-lg shadow-xl overflow-hidden max-h-64 md:max-h-80 overflow-y-auto"
          >
            {results.map((place) => (
              <button
                key={place._id}
                onClick={() => handleSelect(place)}
                className="w-full flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 text-left hover:bg-[rgba(122,107,82,0.1)] transition-colors border-b border-[rgba(122,107,82,0.1)] last:border-0 active:bg-[rgba(122,107,82,0.15)]"
              >
                <MapPin size={12} className="text-[#9a8a72] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-[#ddd0bc] font-cinzel truncate">
                    {place.name}
                  </p>
                  <p className="text-[9px] md:text-[10px] font-mono text-[#7a6e5e]">
                    {place.address.city}, {place.address.country} · Danger{" "}
                    {place.dangerLevel}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>
        )}

        {open && query.trim() && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 bg-[#252018] border border-[rgba(122,107,82,0.3)] rounded-lg shadow-xl p-3 md:p-4 text-center"
          >
            <p className="text-xs md:text-sm text-[#5a4e42] font-mono">
              No records match your query.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}