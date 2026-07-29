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
import { Place } from "@/types";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import { useSeasonalHauntings } from "@/hooks/useSeasonalHauntings";
import { useVisitedPlaces } from "@/hooks/useVisitedPlaces";

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
  const { count: visitedCount } = useVisitedPlaces();

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
          case "b":
  if (e.shiftKey) {
    e.preventDefault();
    router.push("/echoes");
  }
  break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [places, findNearest, router, selectedPlace, showPlanner, showLog, nearest, showHelp]);

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
          <RandomDestination places={places} onSelect={setSelectedPlace} />
          <button
            onClick={() => setShowLog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#252018]/80 backdrop-blur-sm border border-[rgba(122,107,82,0.25)] rounded-lg text-[#9a8a72] hover:text-[#ddd0bc] hover:border-[#9a8a72] transition-all duration-300 text-sm"
            title="Your Expedition Log (L)"
          >
            <BookOpen size={16} />
            <span className="hidden sm:inline font-mono text-xs uppercase tracking-wider">
              Log{visitedCount > 0 ? ` (${visitedCount})` : ""}
            </span>
          </button>
          <button
            onClick={() => setShowPlanner(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#252018]/80 backdrop-blur-sm border border-[rgba(122,107,82,0.25)] rounded-lg text-[#9a8a72] hover:text-[#ddd0bc] hover:border-[#9a8a72] transition-all duration-300 text-sm"
            title="Expedition Planner (E)"
          >
            <Route size={16} />
            <span className="hidden sm:inline font-mono text-xs uppercase tracking-wider">
              Plan
            </span>
          </button>
          <Link
            href="/list"
            className="flex items-center gap-2 px-4 py-2 bg-[#252018]/80 backdrop-blur-sm border border-[rgba(122,107,82,0.25)] rounded-lg text-[#9a8a72] hover:text-[#ddd0bc] hover:border-[#9a8a72] transition-all duration-300 text-sm"
            title="Archives (A)"
          >
            <List size={16} />
            <span className="hidden sm:inline font-mono text-xs uppercase tracking-wider">
              Archives
            </span>
          </Link>
          <Link
            href="/submit"
            className="flex items-center gap-2 px-4 py-2 bg-[rgba(122,107,82,0.15)] backdrop-blur-sm border border-[rgba(122,107,82,0.3)] rounded-lg text-[#ddd0bc] hover:bg-[rgba(122,107,82,0.25)] transition-all duration-300 text-sm"
            title="Submit Discovery (S)"
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
  className="absolute bottom-6 left-6 z-40 pointer-events-none space-y-2"
>
  <div className="flex items-center gap-4 text-[#9a8a72] font-mono text-xs">
    <span className="flex items-center gap-1.5">
      <Eye size={12} />
      {places.length} documented
    </span>
    <span className="w-px h-3 bg-[rgba(122,107,82,0.3)]" />
    <span>
      {places.filter((p) => p.category === "haunted").length} spectral
    </span>
    <span className="w-px h-3 bg-[rgba(122,107,82,0.3)]" />
    <span>
      {places.filter((p) => p.category === "abandoned").length} forsaken
    </span>
  </div>

  <Link
    href="/echoes"
    className="inline-block text-[9px] font-mono text-[#5a4e42] hover:text-[#33ff00] transition-colors duration-500 tracking-[0.2em] uppercase opacity-30 hover:opacity-100 pointer-events-auto"
  >
    [ Anomalous Signal ]
  </Link>
</motion.div>

      {/* NEAR ME */}
      <div className="absolute top-24 right-6 z-40">
        <button
          onClick={findNearest}
          className="flex items-center gap-2 px-4 py-2 bg-[#252018]/90 backdrop-blur-sm border border-[rgba(122,107,82,0.3)] rounded-lg text-[#9a8a72] hover:text-[#ddd0bc] hover:border-[#9a8a72] transition-all text-sm shadow-lg"
          title="Find nearest ruin (N)"
        >
          <Navigation size={14} />
          <span className="font-mono text-xs uppercase tracking-wider">
            Near Me
          </span>
        </button>
      </div>

      {/* NEAREST BANNER */}
      <AnimatePresence>
        {nearest && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-[#252018] border border-[rgba(122,107,82,0.3)] rounded-lg px-5 py-3 shadow-xl flex items-center gap-4"
          >
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#9a8a72]">
                Nearest documented ruin
              </p>
              <p className="font-cinzel text-sm text-[#ddd0bc]">
                {nearest.place.name}
              </p>
              <p className="text-[10px] font-mono text-[#7a6e5e]">
                {Math.round(nearest.distance)} km away
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedPlace(nearest.place);
                setNearest(null);
              }}
              className="px-3 py-1.5 bg-[rgba(122,107,82,0.15)] border border-[rgba(122,107,82,0.25)] rounded text-[10px] font-mono uppercase text-[#c4b8a4] hover:bg-[rgba(122,107,82,0.25)] transition-colors"
            >
              Open
            </button>
            <button
              onClick={() => setNearest(null)}
              className="text-[#9a8a72] hover:text-[#ddd0bc] text-lg leading-none"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <MapSearch
        places={places}
        onSelect={setSelectedPlace}
        onFlyTo={(coords) => setMapCenter(coords)}
      />

      <MapContainer
        places={places}
        onSelectPlace={setSelectedPlace}
        loading={loading}
        center={mapCenter}
        anniversarySlugs={places
          .filter((p) => isAnniversary(p.slug))
          .map((p) => p.slug)}
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

      <TransmissionFeed places={places} />
      <HelpOverlay open={showHelp} onClose={() => setShowHelp(false)} />
      <ShortcutHint onClick={() => setShowHelp(true)} />
    </main>
  );
}