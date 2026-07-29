"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map as MapIcon, List, Plus, Eye, Route } from "lucide-react";
import PlacePanel from "@/components/PlacePanel";
import NearMeButton from "@/components/NearMeButton";
import ExpeditionPlanner from "@/components/ExpeditionPlanner";
import { Place } from "@/types";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import { useSeasonalHauntings } from "@/hooks/useSeasonalHauntings";

const MapContainer = dynamic(() => import("@/components/Map/MapContainer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-[#1a1612] flex items-center justify-center">
      <div className="text-[#9a8a72] font-mono text-sm animate-pulse">
        Initializing cartography...
      </div>
    </div>
  ),
});

export default function Home() {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlanner, setShowPlanner] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>();
  const tod = useTimeOfDay();
  const { isAnniversary } = useSeasonalHauntings();

  useEffect(() => {
    fetch("/api/places")
      .then((r) => r.json())
      .then((data) => {
        setPlaces(data.places || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main
      className={`relative w-full h-screen overflow-hidden transition-colors duration-[2000ms] ${
        tod === "night"
          ? "bg-[#0f0c09]"
          : tod === "dusk"
          ? "bg-[#1a1410]"
          : tod === "dawn"
          ? "bg-[#1e1812]"
          : "bg-[#1a1612]"
      }`}
    >
      <header className="absolute top-0 left-0 right-0 z-40 px-6 py-5 flex items-center justify-between pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-cinzel text-xl md:text-2xl font-medium tracking-wide text-[#ddd0bc] pointer-events-auto cursor-none">
            Vanishing Points
          </h1>
          <p className="font-mono text-[11px] text-[#9a8a72] mt-1 tracking-wider uppercase">
            An atlas of the forgotten
          </p>
        </motion.div>

        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 pointer-events-auto"
        >
          <button
            onClick={() => setShowPlanner(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#252018]/80 backdrop-blur-sm border border-[rgba(122,107,82,0.25)] rounded-lg text-[#9a8a72] hover:text-[#ddd0bc] hover:border-[#9a8a72] transition-all duration-300 text-sm"
          >
            <Route size={16} />
            <span className="hidden sm:inline font-mono text-xs uppercase tracking-wider">
              Plan
            </span>
          </button>
          <Link
            href="/list"
            className="flex items-center gap-2 px-4 py-2 bg-[#252018]/80 backdrop-blur-sm border border-[rgba(122,107,82,0.25)] rounded-lg text-[#9a8a72] hover:text-[#ddd0bc] hover:border-[#9a8a72] transition-all duration-300 text-sm"
          >
            <List size={16} />
            <span className="hidden sm:inline font-mono text-xs uppercase tracking-wider">
              Archives
            </span>
          </Link>
          <Link
            href="/submit"
            className="flex items-center gap-2 px-4 py-2 bg-[rgba(122,107,82,0.15)] backdrop-blur-sm border border-[rgba(122,107,82,0.3)] rounded-lg text-[#ddd0bc] hover:bg-[rgba(122,107,82,0.25)] transition-all duration-300 text-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline font-mono text-xs uppercase tracking-wider">
              Log discovery
            </span>
          </Link>
        </motion.nav>
      </header>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-6 left-6 z-40 pointer-events-none"
      >
        <div className="flex items-center gap-4 text-[#9a8a72] font-mono text-xs">
          <span className="flex items-center gap-1.5">
            <Eye size={12} />
            {places.length} documented
          </span>
          <span className="w-px h-3 bg-[rgba(122,107,82,0.3)]" />
          <span>{places.filter((p) => p.category === "haunted").length} spectral</span>
          <span className="w-px h-3 bg-[rgba(122,107,82,0.3)]" />
          <span>{places.filter((p) => p.category === "abandoned").length} forsaken</span>
        </div>
      </motion.div>

      <MapContainer
        places={places}
        onSelectPlace={setSelectedPlace}
        loading={loading}
        center={mapCenter}
        anniversarySlugs={places.filter((p) => isAnniversary(p.slug)).map((p) => p.slug)}
      />

      <NearMeButton
        places={places}
        onCenter={(coords) => setMapCenter(coords)}
        onSelect={setSelectedPlace}
      />

      <AnimatePresence mode="wait">
        {selectedPlace && (
          <PlacePanel
            key={selectedPlace._id}
            place={selectedPlace}
            onClose={() => setSelectedPlace(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPlanner && (
          <ExpeditionPlanner places={places} onClose={() => setShowPlanner(false)} />
        )}
      </AnimatePresence>
    </main>
  );
}