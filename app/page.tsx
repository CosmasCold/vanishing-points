"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map as MapIcon, List, Plus, Eye } from "lucide-react";
import PlacePanel from "@/components/PlacePanel";
import { Place } from "@/types";

const MapContainer = dynamic(() => import("@/components/Map/MapContainer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-void flex items-center justify-center">
      <div className="text-ash font-mono text-sm animate-pulse">
        Initializing cartography...
      </div>
    </div>
  ),
});

export default function Home() {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/places")   // Removed ?limit=30
      .then((r) => r.json())
      .then((data) => {
        setPlaces(data.places || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-void">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-40 px-6 py-5 flex items-center justify-between pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-cinzel text-xl md:text-2xl font-medium tracking-wide text-bone pointer-events-auto cursor-none">
            Vanishing Points
          </h1>
          <p className="font-mono text-[11px] text-ash mt-1 tracking-wider uppercase">
            An atlas of the forgotten
          </p>
        </motion.div>

        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 pointer-events-auto"
        >
          <Link
            href="/list"
            className="flex items-center gap-2 px-4 py-2 bg-shadow/80 backdrop-blur-sm border border-fog/50 rounded-lg text-ash hover:text-bone hover:border-ash transition-all duration-300 text-sm"
          >
            <List size={16} />
            <span className="hidden sm:inline font-mono text-xs uppercase tracking-wider">
              Archives
            </span>
          </Link>
          <Link
            href="/submit"
            className="flex items-center gap-2 px-4 py-2 bg-ember/20 backdrop-blur-sm border border-ember/40 rounded-lg text-bone hover:bg-ember/30 transition-all duration-300 text-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline font-mono text-xs uppercase tracking-wider">
              Log discovery
            </span>
          </Link>
        </motion.nav>
      </header>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-6 left-6 z-40 pointer-events-none"
      >
        <div className="flex items-center gap-4 text-ash font-mono text-xs">
          <span className="flex items-center gap-1.5">
            <Eye size={12} />
            {places.length} documented
          </span>
          <span className="w-px h-3 bg-fog" />
          <span>{places.filter((p) => p.category === "haunted").length} spectral</span>
          <span className="w-px h-3 bg-fog" />
          <span>{places.filter((p) => p.category === "abandoned").length} forsaken</span>
        </div>
      </motion.div>

      {/* Map */}
      <MapContainer
        places={places}
        onSelectPlace={setSelectedPlace}
        loading={loading}
      />

      {/* Place Panel */}
      <AnimatePresence mode="wait">
        {selectedPlace && (
          <PlacePanel
            key={selectedPlace._id}
            place={selectedPlace}
            onClose={() => setSelectedPlace(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}