"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { List, Plus, Eye, Route, Navigation, BookOpen } from "lucide-react";
import PlacePanel from "@/components/PlacePanel";
import ExpeditionPlanner from "@/components/ExpeditionPlanner";
import ExpeditionLog from "@/components/ExpeditionLog";
import RandomDestination from "@/components/RandomDestination";
import HelpOverlay from "@/components/HelpOverlay";
import ShortcutHint from "@/components/ShortcutHint";
import MapSearch from "@/components/MapSearch";
import TransmissionFeed from "@/components/TransmissionFeed";
import NumbersStation from "@/components/NumbersStation";
import AtlasBootSequence from "@/components/AtlasBootSequence";
import DustOverlay from "@/components/DustOverlay";
import CollaborativeCursors from "@/components/CollaborativeCursors";
import { Place } from "@/types";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import { useSeasonalHauntings } from "@/hooks/useSeasonalHauntings";
import { useVisitedPlaces } from "@/hooks/useVisitedPlaces";
import { accumulateDust } from "@/hooks/useDustLevel";
import LyingCompass from "@/components/LyingCompass";
import AbsenceGreeting from "@/components/AbsenceGreeting";
import AtlasInversion from "@/components/AtlasInversion";
import PlaceWhispers from "@/components/PlaceWhispers";
import { showToast } from "@/lib/toast";
import LiveSignalOverlay from "@/components/LiveSignalOverlay";


// CRITICAL: Zero hooks here. next/dynamic swaps this rapidly.
function MapLoadingFallback() {
  return (
    <div className="w-full h-full bg-[#1a1612] flex items-center justify-center">
      <div className="text-[#9a8a72] font-mono text-sm animate-pulse">
        Establishing cartographic link...
      </div>
    </div>
  );
}

const MapContainer = dynamic(() => import("@/components/Map/MapContainer"), {
  ssr: false,
  loading: MapLoadingFallback,
});

function haversine(
  [lon1, lat1]: [number, number],
  [lon2, lat2]: [number, number]
) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Home() {
  const router = useRouter();
  const [booted, setBooted] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlanner, setShowPlanner] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>();
  const [nearest, setNearest] = useState<{
    place: Place;
    distance: number;
  } | null>(null);
  const tod = useTimeOfDay();
  const { isAnniversary } = useSeasonalHauntings();
  const { count: visitedCount, visitGhost } = useVisitedPlaces();

  useEffect(() => {
    fetch("/api/places")
      .then((r) => r.json())
      .then((data) => {
        setPlaces(data.places || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const findNearest = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const user: [number, number] = [
          pos.coords.longitude,
          pos.coords.latitude,
        ];
        const result = places.reduce<{
          place: Place | null;
          distance: number;
        }>(
          (best, place) => {
            const d = haversine(user, place.coordinates);
            if (d < best.distance) {
              return { place, distance: d };
            }
            return best;
          },
          { place: null, distance: Infinity }
        );

        if (result.place) {
          setNearest({ place: result.place, distance: result.distance });
          setMapCenter(result.place.coordinates);
        }
      },
      () => alert("Location access denied or unavailable"),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, [places]);

  const openPlace = useCallback((place: Place) => {
    accumulateDust(3);
    setSelectedPlace(place);
  }, []);

  const handleGhostCapture = useCallback((ghost: { name: string; slug: string; coords: string }) => {
    visitGhost(ghost);
  }, [visitGhost]);

  const handleTowerFound = useCallback(() => {
    showToast("Triangulation complete. Check the bunker terminal.", "warning");
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "e":
          e.preventDefault();
          setShowPlanner(true);
          break;
        case "n":
          e.preventDefault();
          findNearest();
          break;
        case "r":
          e.preventDefault();
          if (places.length > 0) {
            const random = places[Math.floor(Math.random() * places.length)];
            setSelectedPlace(random);
          }
          break;
        case "a":
          e.preventDefault();
          router.push("/list");
          break;
        case "s":
          e.preventDefault();
          router.push("/submit");
          break;
        case "l":
          e.preventDefault();
          setShowLog(true);
          break;
        case "?":
          e.preventDefault();
          setShowHelp((h) => !h);
          break;
        case "escape":
          if (showHelp) {
            setShowHelp(false);
          } else if (selectedPlace) {
            setSelectedPlace(null);
          } else if (showPlanner) {
            setShowPlanner(false);
          } else if (showLog) {
            setShowLog(false);
          } else if (nearest) {
            setNearest(null);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [places, findNearest, router, selectedPlace, showPlanner, showLog, nearest, showHelp]);

  return (
    <>
      {!booted && <AtlasBootSequence onComplete={() => setBooted(true)} />}
      
      <main
        className={`relative w-full h-[100dvh] overflow-hidden transition-colors duration-[2000ms] select-none ${
          tod === "night"
            ? "bg-[#0f0c09]"
            : tod === "dusk"
            ? "bg-[#1a1410]"
            : tod === "dawn"
            ? "bg-[#1e1812]"
            : "bg-[#1a1612]"
        }`}
      >
        <DustOverlay />
        <AtlasInversion />
        <PlaceWhispers />
        <CollaborativeCursors />

        {/* ─── HEADER ─── */}
        <header className="absolute top-0 left-0 right-0 z-40 safe-top px-3 md:px-6 py-3 md:py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: booted ? 1 : 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-cinzel text-lg md:text-2xl font-medium tracking-wide text-[#ddd0bc] pointer-events-auto">
              Vanishing Points
            </h1>
            <p className="font-mono text-[10px] md:text-[11px] text-[#9a8a72] mt-0.5 tracking-wider uppercase">
              An atlas of the forgotten
            </p>
          </motion.div>

          <motion.nav
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: booted ? 1 : 0 }}
  transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
  className="flex items-center gap-2 md:gap-3 pointer-events-auto overflow-x-auto max-w-full pb-1 md:pb-0 no-scrollbar"
>
  <RandomDestination places={places} onSelect={openPlace} />
  
  <button
    onClick={() => setShowLog(true)}
    className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-[#252018]/80 backdrop-blur-sm border border-[rgba(122,107,82,0.25)] rounded-lg text-[#9a8a72] hover:text-[#ddd0bc] hover:border-[#9a8a72] transition-all duration-300 text-xs md:text-sm flex-shrink-0 active:scale-95"
    title="Your Expedition Log (L)"
  >
    <BookOpen size={14} className="md:w-4 md:h-4" />
    <span className="hidden sm:inline font-mono text-xs uppercase tracking-wider">
      Log{visitedCount > 0 ? ` (${visitedCount})` : ""}
    </span>
  </button>
  
  <button
    onClick={() => setShowPlanner(true)}
    className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-[#252018]/80 backdrop-blur-sm border border-[rgba(122,107,82,0.25)] rounded-lg text-[#9a8a72] hover:text-[#ddd0bc] hover:border-[#9a8a72] transition-all duration-300 text-xs md:text-sm flex-shrink-0 active:scale-95"
    title="Expedition Planner (E)"
  >
    <Route size={14} className="md:w-4 md:h-4" />
    <span className="hidden sm:inline font-mono text-xs uppercase tracking-wider">
      Plan
    </span>
  </button>
  
  <Link
    href="/list"
    className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-[#252018]/80 backdrop-blur-sm border border-[rgba(122,107,82,0.25)] rounded-lg text-[#9a8a72] hover:text-[#ddd0bc] hover:border-[#9a8a72] transition-all duration-300 text-xs md:text-sm flex-shrink-0 active:scale-95"
    title="Archives (A)"
  >
    <List size={14} className="md:w-4 md:h-4" />
    <span className="hidden sm:inline font-mono text-xs uppercase tracking-wider">
      Archives
    </span>
  </Link>
  
  <Link
    href="/submit"
    className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-[rgba(122,107,82,0.15)] backdrop-blur-sm border border-[rgba(122,107,82,0.3)] rounded-lg text-[#ddd0bc] hover:bg-[rgba(122,107,82,0.25)] transition-all duration-300 text-xs md:text-sm flex-shrink-0 active:scale-95"
    title="Submit Discovery (S)"
  >
    <Plus size={14} className="md:w-4 md:h-4" />
    <span className="hidden sm:inline font-mono text-xs uppercase tracking-wider">
      Log discovery
    </span>
  </Link>

  {/* Numbers Station — compact dropdown */}
  <NumbersStation compact />
</motion.nav>
        </header>

        {/* ─── BOTTOM LEFT STATS ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: booted ? 1 : 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-2 md:bottom-6 left-3 md:left-6 z-40 pointer-events-none safe-bottom space-y-1 md:space-y-2"
        >
          <div className="flex items-center gap-2 md:gap-4 text-[#9a8a72] font-mono text-[10px] md:text-xs">
            <span className="flex items-center gap-1">
              <Eye size={10} className="md:w-3 md:h-3" />
              {places.length} doc
            </span>
            <span className="w-px h-2.5 md:h-3 bg-[rgba(122,107,82,0.3)]" />
            <span className="hidden sm:inline">
              {places.filter((p) => p.category === "haunted").length} spectral
            </span>
            <span className="w-px h-2.5 md:h-3 bg-[rgba(122,107,82,0.3)] hidden sm:inline" />
            <span className="hidden sm:inline">
              {places.filter((p) => p.category === "abandoned").length} forsaken
            </span>
          </div>

          <Link
            href="/echoes"
            className="inline-block text-[8px] md:text-[9px] font-mono text-[#5a4e42] hover:text-[#33ff00] transition-colors duration-500 tracking-[0.2em] uppercase opacity-30 hover:opacity-100 pointer-events-auto"
          >
            [ Anomalous Signal ]
          </Link>
        </motion.div>

        {/* ─── NEAR ME ─── */}
        <div className="absolute top-16 md:top-24 right-3 md:right-6 z-40">
          <button
            onClick={findNearest}
            className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-[#252018]/90 backdrop-blur-sm border border-[rgba(122,107,82,0.3)] rounded-lg text-[#9a8a72] hover:text-[#ddd0bc] hover:border-[#9a8a72] transition-all text-xs md:text-sm shadow-lg flex-shrink-0 active:scale-95"
            title="Find nearest ruin (N)"
          >
            <Navigation size={12} className="md:w-3.5 md:h-3.5" />
            <span className="hidden sm:inline font-mono text-xs uppercase tracking-wider">
              Near Me
            </span>
          </button>
        </div>

        {/* ─── NEAREST BANNER ─── */}
        <AnimatePresence>
          {nearest && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-16 md:top-24 left-3 right-3 md:left-1/2 md:right-auto md:-translate-x-1/2 z-40 bg-[#252018] border border-[rgba(122,107,82,0.3)] rounded-lg px-3 md:px-5 py-2 md:py-3 shadow-xl flex items-center justify-between md:justify-start gap-3"
            >
              <div className="min-w-0">
                <p className="text-[9px] md:text-[10px] font-mono uppercase tracking-wider text-[#9a8a72]">
                  Nearest documented ruin
                </p>
                <p className="font-cinzel text-xs md:text-sm text-[#ddd0bc] truncate">
                  {nearest.place.name}
                </p>
                <p className="text-[9px] md:text-[10px] font-mono text-[#7a6e5e]">
                  {Math.round(nearest.distance)} km away
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    openPlace(nearest.place);
                    setNearest(null);
                  }}
                  className="px-2.5 md:px-3 py-1 md:py-1.5 bg-[rgba(122,107,82,0.15)] border border-[rgba(122,107,82,0.25)] rounded text-[9px] md:text-[10px] font-mono uppercase text-[#c4b8a4] hover:bg-[rgba(122,107,82,0.25)] transition-colors active:scale-95"
                >
                  Open
                </button>
                <button
                  onClick={() => setNearest(null)}
                  className="text-[#9a8a72] hover:text-[#ddd0bc] text-lg leading-none px-1"
                >
                  ×
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── SEARCH ─── */}
        <MapSearch
          places={places}
          onSelect={openPlace}
          onFlyTo={(coords) => setMapCenter(coords)}
        />

        {/* ─── MAP ─── */}
        <div className="absolute inset-0 z-0">
          <MapContainer
            places={places}
            onSelectPlace={openPlace}
            loading={loading}
            center={mapCenter}
            anniversarySlugs={places
              .filter((p) => isAnniversary(p.slug))
              .map((p) => p.slug)}
            onGhostCapture={handleGhostCapture}
            onTowerFound={handleTowerFound}
          />
        </div>

        {/* ─── OVERLAYS ─── */}
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
            <ExpeditionPlanner
              places={places}
              onClose={() => setShowPlanner(false)}
              onFlyTo={(coords) => setMapCenter(coords)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showLog && <ExpeditionLog onClose={() => setShowLog(false)} />}
        </AnimatePresence>

        <NumbersStation />
        <TransmissionFeed />
        <HelpOverlay open={showHelp} onClose={() => setShowHelp(false)} />
        <ShortcutHint onClick={() => setShowHelp(true)} />
        <LyingCompass places={places} />
        <AbsenceGreeting />
        <LiveSignalOverlay twitchChannel="atlas_bunker_7" />
      </main>
    </>
  );
}