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

function MapLoadingFallback() {
  return (
    <div className="w-full h-full bg-[#0c0a08] flex items-center justify-center">
      <div className="text-[#9a8a72] font-mono text-sm animate-pulse tracking-widest uppercase">
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
    window.dispatchEvent(new CustomEvent("placeaudiochange", {
      detail: { category: place.category, dangerLevel: place.dangerLevel }
    }));
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
            ? "bg-[#0a0806]"
            : tod === "dusk"
            ? "bg-[#14100c]"
            : tod === "dawn"
            ? "bg-[#181410]"
            : "bg-[#0c0a08]"
        }`}
      >
        {/* ─── ATMOSPHERIC LAYER ─── */}
        <DustOverlay />
        <AtlasInversion />
        <PlaceWhispers />
        <CollaborativeCursors />

        {/* Subtle edge vignette — pointer-events-none so map works */}
        <div
          className="pointer-events-none fixed inset-0 z-[30]"
          style={{
            background: "radial-gradient(circle at 50% 50%, transparent 60%, rgba(8,6,4,0.45) 100%)",
            mixBlendMode: "multiply",
          }}
        />

        {/* ─── HEADER / HUD ─── */}
        <header className="absolute top-0 left-0 right-0 z-40 safe-top pointer-events-none">
          {/* Bronze trim */}
          <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, #9a8a7260, transparent)" }} />

          <div className="px-4 md:px-8 py-4 md:py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: booted ? 1 : 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto"
            >
              <h1
                className="font-cinzel text-xl md:text-2xl font-medium tracking-wide"
                style={{ color: "#ddd0bc", textShadow: "0 0 18px rgba(221,208,188,0.12)" }}
              >
                Vanishing Points
              </h1>
              <p className="font-mono text-[11px] text-[#9a8a72] mt-1 tracking-[0.2em] uppercase opacity-70">
                An atlas of the forgotten
              </p>
            </motion.div>

            <motion.nav
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: booted ? 1 : 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2 md:gap-3 pointer-events-auto overflow-x-auto max-w-full pb-1 md:pb-0 no-scrollbar"
            >
              <RandomDestination places={places} onSelect={openPlace} />

              <NavBtn
                onClick={() => setShowLog(true)}
                icon={<BookOpen size={14} />}
                label={`Log${visitedCount > 0 ? ` (${visitedCount})` : ""}`}
                title="Your Expedition Log (L)"
              />
              <NavBtn
                onClick={() => setShowPlanner(true)}
                icon={<Route size={14} />}
                label="Plan"
                title="Expedition Planner (E)"
              />
              <NavLink
                href="/list"
                icon={<List size={14} />}
                label="Archives"
                title="Archives (A)"
              />
              <NavLink
                href="/submit"
                icon={<Plus size={14} />}
                label="Log discovery"
                title="Submit Discovery (S)"
                highlight
              />
            </motion.nav>
          </div>

          {/* Bottom header trim */}
          <div className="h-px w-full opacity-30" style={{ background: "linear-gradient(90deg, transparent, #9a8a7240, transparent)" }} />
        </header>

        {/* ─── BOTTOM LEFT STATUS ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: booted ? 1 : 0 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="absolute bottom-3 md:bottom-8 left-4 md:left-8 z-40 pointer-events-none safe-bottom space-y-2 md:space-y-3"
        >
          <div
            className="inline-flex items-center gap-3 md:gap-4 font-mono text-[11px] md:text-xs tracking-wider uppercase px-3 py-2 rounded border"
            style={{
              color: "#9a8a72",
              borderColor: "rgba(122,107,82,0.15)",
              background: "rgba(12,10,8,0.6)",
              backdropFilter: "blur(6px)",
              boxShadow: "inset 0 1px 0 rgba(122,107,82,0.08)",
            }}
          >
            <StatItem icon={<Eye size={11} />} value={`${places.length} doc`} />
            <span className="w-px h-3 bg-[#9a8a72]/20" />
            <span className="hidden sm:inline">{places.filter((p) => p.category === "haunted").length} spectral</span>
            <span className="w-px h-3 bg-[#9a8a72]/20 hidden sm:inline" />
            <span className="hidden sm:inline">{places.filter((p) => p.category === "abandoned").length} forsaken</span>
          </div>

          <div className="pointer-events-auto">
            <Link
              href="/echoes"
              className="group inline-flex items-center gap-2 font-mono text-[10px] md:text-[11px] tracking-[0.25em] uppercase transition-all duration-500"
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "#c4785a", boxShadow: "0 0 6px #c4785a80" }}
              />
              <span className="text-[#5a4e42] group-hover:text-[#c4785a] transition-colors duration-500">
                Anomalous Signal
              </span>
            </Link>
          </div>
        </motion.div>

        {/* ─── NEAR ME ─── */}
        <div className="absolute top-20 md:top-28 right-4 md:right-8 z-40">
          <motion.button
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: booted ? 1 : 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            onClick={findNearest}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm transition-all duration-300 active:scale-95"
            style={{
              color: "#ddd0bc",
              background: "rgba(12,10,8,0.7)",
              border: "1px solid rgba(122,107,82,0.25)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(122,107,82,0.1)",
            }}
            title="Find nearest ruin (N)"
          >
            <Navigation size={13} />
            <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-wider">Near Me</span>
          </motion.button>
        </div>

        {/* ─── NEAREST BANNER ─── */}
        <AnimatePresence>
          {nearest && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-20 md:top-28 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-40 rounded-lg px-4 md:px-6 py-3 md:py-4 max-w-md"
              style={{
                background: "linear-gradient(180deg, rgba(18,14,10,0.95), rgba(12,10,8,0.95))",
                border: "1px solid rgba(122,107,82,0.2)",
                borderLeft: "3px solid #9a8a72",
                boxShadow: "0 12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(122,107,82,0.08)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[9px] md:text-[10px] font-mono uppercase tracking-[0.2em] text-[#9a8a72] mb-1">
                    Nearest documented ruin
                  </p>
                  <p className="font-cinzel text-sm md:text-base text-[#ddd0bc] truncate leading-tight">
                    {nearest.place.name}
                  </p>
                  <p className="text-[10px] md:text-[11px] font-mono text-[#7a6e5e] mt-1 tracking-wider">
                    {Math.round(nearest.distance)} km away
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                  <button
                    onClick={() => {
                      openPlace(nearest.place);
                      setNearest(null);
                    }}
                    className="px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider transition-all active:scale-95"
                    style={{
                      color: "#c4b8a4",
                      background: "rgba(122,107,82,0.12)",
                      border: "1px solid rgba(122,107,82,0.2)",
                    }}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => setNearest(null)}
                    className="text-[#9a8a72] hover:text-[#ddd0bc] text-lg leading-none px-1 transition-colors"
                  >
                    ×
                  </button>
                </div>
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

/* ─── SUB-COMPONENTS ─── */

function NavBtn({
  onClick,
  icon,
  label,
  title,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[11px] md:text-xs transition-all duration-300 active:scale-95 flex-shrink-0"
      style={{
        color: "#9a8a72",
        background: "rgba(18,14,10,0.65)",
        border: "1px solid rgba(122,107,82,0.18)",
        backdropFilter: "blur(6px)",
        boxShadow: "inset 0 1px 0 rgba(122,107,82,0.06), 0 2px 8px rgba(0,0,0,0.3)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "#ddd0bc";
        e.currentTarget.style.borderColor = "rgba(154,138,114,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "#9a8a72";
        e.currentTarget.style.borderColor = "rgba(122,107,82,0.18)";
      }}
    >
      <span className="opacity-70">{icon}</span>
      <span className="hidden sm:inline font-mono uppercase tracking-wider">{label}</span>
    </button>
  );
}

function NavLink({
  href,
  icon,
  label,
  title,
  highlight,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  title: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      title={title}
      className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[11px] md:text-xs transition-all duration-300 active:scale-95 flex-shrink-0"
      style={{
        color: highlight ? "#ddd0bc" : "#9a8a72",
        background: highlight ? "rgba(122,107,82,0.12)" : "rgba(18,14,10,0.65)",
        border: "1px solid rgba(122,107,82,0.18)",
        backdropFilter: "blur(6px)",
        boxShadow: "inset 0 1px 0 rgba(122,107,82,0.06), 0 2px 8px rgba(0,0,0,0.3)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "#ddd0bc";
        e.currentTarget.style.borderColor = "rgba(154,138,114,0.4)";
        if (highlight) e.currentTarget.style.background = "rgba(122,107,82,0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = highlight ? "#ddd0bc" : "#9a8a72";
        e.currentTarget.style.borderColor = "rgba(122,107,82,0.18)";
        if (highlight) e.currentTarget.style.background = "rgba(122,107,82,0.12)";
      }}
    >
      <span className="opacity-70">{icon}</span>
      <span className="hidden sm:inline font-mono uppercase tracking-wider">{label}</span>
    </Link>
  );
}

function StatItem({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="opacity-50">{icon}</span>
      <span>{value}</span>
    </span>
  );
}