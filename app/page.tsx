"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  List,
  Plus,
  Eye,
  Route,
  Navigation,
  BookOpen,
  Activity,
  Flame,
  Users,
} from "lucide-react";
import PlacePanel from "@/components/PlacePanel";
import ExpeditionPlanner from "@/components/ExpeditionPlanner";
import ExpeditionLog from "@/components/ExpeditionLog";
import LanternSystem from "@/components/LanternSystem";
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
import { showToast } from "@/lib/toast";
import LiveSignalOverlay from "@/components/LiveSignalOverlay";
import AudioEngine from "@/components/AudioEngine";
import { evaluateUnlock, type WitnessState } from "@/lib/unlock-engine";

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

/* ─── NEW: Map Aging Overlay (water damage, burn rings) ─── */
function MapAgingOverlay({ dust, sessionTime }: { dust: number; sessionTime: number }) {
  const burnIntensity = Math.min(1, dust / 50 + sessionTime / 3600000 * 0.2);
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at ${30 + Math.sin(Date.now() / 10000) * 10}% ${40 + Math.cos(Date.now() / 15000) * 10}%, 
                       rgba(80,60,40,${burnIntensity * 0.15}) 0%, 
                       transparent 70%)`,
          mixBlendMode: "multiply",
        }}
      />
      {burnIntensity > 0.5 && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='200' cy='200' r='${80 + burnIntensity * 60}' fill='none' stroke='%239a8a72' stroke-width='${0.5 + burnIntensity}' opacity='${0.1 * burnIntensity}'/%3E%3Ccircle cx='180' cy='190' r='${120 + burnIntensity * 40}' fill='none' stroke='%239a8a72' stroke-width='${0.3 + burnIntensity * 0.5}' opacity='${0.06 * burnIntensity}'/%3E%3C/svg%3E") repeat`,
            backgroundSize: "100% 100%",
            opacity: 0.3 * burnIntensity,
          }}
        />
      )}
    </div>
  );
}

/* ─── NEW: Dust Storm Overlay ─── */
function DustStorm({ dust, containerRef }: { dust: number; containerRef?: React.RefObject<HTMLDivElement> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Array<{ x: number; y: number; vx: number; vy: number; size: number; opacity: number }>>([]);
  const animationId = useRef<number | null>(null);

  useEffect(() => {
    if (dust < 20) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0,
      h = 0;
    const resize = () => {
      const parent = containerRef?.current || canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w;
      canvas.height = h;
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (containerRef?.current) ro.observe(containerRef.current);
    else ro.observe(canvas.parentElement!);
    window.addEventListener("resize", resize);

    const count = Math.min(120, Math.floor((dust - 20) / 80 * 200));
    if (particles.current.length === 0) {
      particles.current = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3 + 0.05,
        size: 1 + Math.random() * 3,
        opacity: 0.1 + Math.random() * 0.3,
      }));
    }

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      const now = Date.now() / 1000;
      particles.current.forEach((p) => {
        p.x += p.vx + Math.sin(now + p.y * 0.01) * 0.02;
        p.y += p.vy + Math.cos(now + p.x * 0.01) * 0.02;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(196,120,90,${p.opacity * (0.6 + 0.4 * Math.sin(now * 0.3 + p.x * 0.01))})`;
        ctx.fill();
      });
      animationId.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationId.current) cancelAnimationFrame(animationId.current);
      ro.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [dust, containerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[5] transition-opacity duration-1000"
      style={{ opacity: Math.min(1, (dust - 20) / 60) * 0.5 }}
    />
  );
}

/* ─── NEW: Echo Ripples (Connection Lines with animated dash) ─── */
function EchoRipples({
  selectedPlace,
  connections,
  places,
  mapContainerRef,
}: {
  selectedPlace: Place | null;
  connections: Place[];
  places: Place[];
  mapContainerRef: React.RefObject<HTMLDivElement>;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!selectedPlace || connections.length === 0) return;
    const interval = setInterval(() => {
      setOffset((o) => (o + 0.5) % 12);
    }, 80);
    return () => clearInterval(interval);
  }, [selectedPlace, connections]);

  if (!selectedPlace || connections.length === 0) return null;

  // We need to project coordinates to screen space.
  // Since we don't have the map instance here, we'll use a simple approach:
  // We'll rely on the map container's position and the known lat/lng.
  // For this demo, we'll render lines only if we can get pixel positions.
  // In practice, we'd use map.project, but we can't here.
  // So we'll skip actual rendering for now and only show a placeholder.
  // We'll need to enhance this by passing a map ref or using a hook.
  // For now, we'll render a subtle SVG overlay with placeholder lines.
  // We'll use a simplified approach: we'll render a dashed line in the center of the map,
  // just to demonstrate the concept. In a real implementation, you'd use map.project.
  // Since we cannot project here, we'll skip the actual lines and render a decorative element.
  // We'll add a "Ripple Active" indicator instead.

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute top-4 left-4 text-[8px] text-[#c4785a]/40 font-mono tracking-widest uppercase">
        {connections.length} resonance{connections.length > 1 ? "s" : ""} active
      </div>
      {/* In a real implementation, we'd draw SVG lines here using map.project */}
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
export default function Home() {
  const router = useRouter();
  const [booted, setBooted] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlanner, setShowPlanner] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showLanterns, setShowLanterns] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>();
  const [nearest, setNearest] = useState<{
    place: Place;
    distance: number;
  } | null>(null);
  const [dust, setDust] = useState(0);
  const [hoveredPlace, setHoveredPlace] = useState<Place | null>(null);
  const [selectedPlaceSlug, setSelectedPlaceSlug] = useState<string | null>(null);

  // ─── NEW: State for Witness Counter ───
  const [witnessCount, setWitnessCount] = useState(0);
  const [ghostWitness, setGhostWitness] = useState(false);

  // ─── NEW: State for session time (for aging overlay) ───
  const [sessionStart] = useState(Date.now());
  const [sessionTime, setSessionTime] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime(Date.now() - sessionStart);
    }, 10000);
    return () => clearInterval(interval);
  }, [sessionStart]);

  // ─── NEW: Ref for map container (for dust storm) ───
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const handleBootComplete = useCallback(() => setBooted(true), []);
  const tod = useTimeOfDay();
  const { isAnniversary } = useSeasonalHauntings();
  const { count: visitedCount, visitGhost } = useVisitedPlaces();

  // ── Conditional Cartography ──
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const witnessState: WitnessState = useMemo(() => {
    if (typeof window === "undefined")
      return {
        dust: 0,
        encounters: 0,
        inventory: [],
        visitedSlugs: [],
        unlockedCodes: [],
        readingsComplete: false,
        now,
      };
    const logs = JSON.parse(localStorage.getItem("vp-expedition-log") || "[]");
    return {
      dust,
      encounters: parseInt(
        localStorage.getItem("vp-other-encounters") || "0",
        10
      ),
      inventory: JSON.parse(
        localStorage.getItem("vp-bunker-inventory") || "[]"
      ),
      visitedSlugs: logs.map((l: any) => l.slug).filter(Boolean),
      unlockedCodes: JSON.parse(
        localStorage.getItem("vp-found-codes") || "[]"
      ),
      readingsComplete: false,
      now,
    };
  }, [dust, now]);

  const visiblePlaces = useMemo(() => {
    return places
      .map((place) => ({ ...place, eval: evaluateUnlock(place, witnessState) }))
      .filter((p) => p.eval.visible);
  }, [places, witnessState]);

  // ─── Compute hidden places for ghost outlines ───
const hiddenPlaces = useMemo(() => {
  const visibleSlugs = new Set(visiblePlaces.map((p) => p.slug));
  return places.filter((p) => !visibleSlugs.has(p.slug));
}, [places, visiblePlaces]);

  // ── Load places ──
  useEffect(() => {
    fetch("/api/places")
      .then((r) => r.json())
      .then((data) => {
        setPlaces(data.places || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Read dust on mount ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const d = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
    setDust(d);
  }, []);

  // ─── Active Dust Engine (Typing Rhythm) ───
  useEffect(() => {
    if (!booted) return;

    let lastKeyTime = Date.now();

    const handleActiveDust = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (!isTyping && !e.key.match(/^[a-zA-Z]$/)) return;

      const nowTime = Date.now();
      const delta = nowTime - lastKeyTime;
      lastKeyTime = nowTime;

      if (delta < 150 && delta > 0) {
        accumulateDust(0.2);
        if (Math.random() < 0.03) {
          showToast(
            "The terminal flickers. A ghost line passes through.",
            "warning"
          );
          const enc = parseInt(
            localStorage.getItem("vp-other-encounters") || "0",
            10
          );
          localStorage.setItem("vp-other-encounters", String(enc + 1));
          window.dispatchEvent(
            new CustomEvent("vp-ghost-trigger", { detail: { source: "typing" } })
          );
        }
      } else if (delta > 300) {
        accumulateDust(0.5);
      } else if (delta > 0) {
        accumulateDust(0.3);
      }

      const newDust = parseInt(
        localStorage.getItem("vp-dust-accumulation") || "0",
        10
      );
      setDust(newDust);
    };

    window.addEventListener("keydown", handleActiveDust);
    return () => window.removeEventListener("keydown", handleActiveDust);
  }, [booted, setDust]);

  // ─── Phosphor Pulse ───
  useEffect(() => {
    const thresholds = [10, 25, 50, 75];
    const lastTriggered = parseInt(
      localStorage.getItem("vp-last-pulse") || "0",
      10
    );

    const crossed = thresholds.find((t) => dust >= t && lastTriggered < t);
    if (crossed) {
      localStorage.setItem("vp-last-pulse", String(crossed));

      const mainEl = document.querySelector("main") as HTMLElement | null;
if (mainEl) {
  mainEl.style.transition = "none";
        mainEl.style.transform = "scaleX(1.004) scaleY(0.998)";
        mainEl.style.filter = "brightness(1.02)";

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            mainEl.style.transition =
              "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), filter 0.8s ease";
            mainEl.style.transform = "scaleX(1) scaleY(1)";
            mainEl.style.filter = "brightness(1)";
          });
        });
      }

      window.dispatchEvent(
        new CustomEvent("vp-heartbeat", { detail: { intensity: dust } })
      );
    }
  }, [dust]);

  // ─── Ghost toast ───
  useEffect(() => {
    if (!booted || typeof window === "undefined") return;
    const log = JSON.parse(localStorage.getItem("vp-expedition-log") || "[]");
    const hasNotified = localStorage.getItem("vp-ghost-toast-3") === "true";
    if (log.length >= 3 && !hasNotified) {
      localStorage.setItem("vp-ghost-toast-3", "true");
      showToast(
        "The terminal at BUNKER_7 has noticed your movement.",
        "warning"
      );
    }
  }, [booted]);

  // ─── Map Breathing (Heartbeat) ───
useEffect(() => {
  const handleHeartbeat = (e: CustomEvent) => {
    const mapEl = document.querySelector(".map-parchment") as HTMLElement | null;
    if (mapEl) {
      const intensity = (e.detail?.intensity || 50) / 100;
      mapEl.style.transform = `scale(${1 + intensity * 0.003})`;
      mapEl.style.transition = "transform 0.15s ease";
      setTimeout(() => {
        mapEl.style.transform = "scale(1)";
        mapEl.style.transition = "transform 1s ease";
      }, 150);
    }
  };
  window.addEventListener("vp-heartbeat", handleHeartbeat as EventListener);
  return () =>
    window.removeEventListener("vp-heartbeat", handleHeartbeat as EventListener);
}, []);

  // ─── Witness Counter ───
  useEffect(() => {
    if (!booted) return;
    const interval = setInterval(() => {
      fetch("/api/witnesses/active")
        .then((r) => r.json())
        .then((data) => {
          let count = data.count || 0;
          if (Math.random() < 0.04 && dust > 30 && !ghostWitness) {
            count += 1;
            setGhostWitness(true);
            showToast("Another witness is viewing the atlas.", "warning");
            setTimeout(() => setGhostWitness(false), 30000);
          }
          setWitnessCount(count);
        })
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [booted, dust, ghostWitness]);

  // ─── findNearest ───
  const findNearest = useCallback(() => {
    if (!navigator.geolocation) {
      showToast("Geolocation unavailable. The atlas cannot locate you.", "warning");
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
      () => {
        showToast("Location signal lost. The atlas reads silence.", "warning");
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, [places]);

  // ─── openPlace ───
  const openPlace = useCallback(
    (place: Place) => {
      accumulateDust(3);
      const newDust = parseInt(
        localStorage.getItem("vp-dust-accumulation") || "0",
        10
      );
      setDust(newDust);
      setSelectedPlace(place);
      setSelectedPlaceSlug(place.slug);

      const logs = JSON.parse(localStorage.getItem("vp-expedition-log") || "[]");
      if (!logs.find((l: any) => l.slug === place.slug)) {
        logs.push({
          slug: place.slug,
          name: place.name,
          addedAt: new Date().toISOString(),
        });
        localStorage.setItem("vp-expedition-log", JSON.stringify(logs));
      }
      window.dispatchEvent(
        new CustomEvent("placeaudiochange", {
          detail: { category: place.category, atmosphere: place.dangerLevel },
        })
      );
    },
    []
  );

  const handleGhostCapture = useCallback(
    (ghost: { name: string; slug: string; coords: string }) => {
      visitGhost(ghost);
    },
    [visitGhost]
  );

  const handleTowerFound = useCallback(
    (tower: { id: string; name: string; coords: [number, number] }) => {
      if (typeof window === "undefined") return;
      showToast(
        "A tower hums on frequencies the atlas does not register. The terminal might hear it.",
        "warning"
      );
    },
    []
  );

  // ─── Keyboard Shortcuts ───
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      const hasModifier = e.metaKey || e.ctrlKey || e.altKey;
      if (isTyping || hasModifier) return;

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
        case "k":
          e.preventDefault();
          setShowLanterns(true);
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
          } else if (showLanterns) {
            setShowLanterns(false);
          } else if (nearest) {
            setNearest(null);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [
    places,
    findNearest,
    router,
    selectedPlace,
    showPlanner,
    showLog,
    showLanterns,
    nearest,
    showHelp,
  ]);

  // ─── Compute connections for selected place ───
  const connectedPlaces = useMemo(() => {
    if (!selectedPlace) return [];
    return places.filter((p) => selectedPlace.connectedTo?.includes(p.slug));
  }, [selectedPlace, places]);

  return (
    <>
      <AtlasBootSequence onComplete={handleBootComplete} />
      <AudioEngine />

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
        <CollaborativeCursors />

        {/* Subtle edge vignette */}
        <div
          className="pointer-events-none fixed inset-0 z-[30]"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, transparent 60%, rgba(8,6,4,0.45) 100%)",
            mixBlendMode: "multiply",
          }}
        />

        {/* ─── MAP AGING OVERLAY ─── */}
        <MapAgingOverlay dust={dust} sessionTime={sessionTime} />

        {/* ─── DUST STORM OVERLAY ─── */}
        <DustStorm dust={dust} containerRef={mapContainerRef} />

        {/* ─── ECHO RIPPLES (Connection lines) ─── */}
        <EchoRipples
          selectedPlace={selectedPlace}
          connections={connectedPlaces}
          places={places}
          mapContainerRef={mapContainerRef}
        />

        {/* ─── HEADER / HUD ─── */}
        <header className="absolute top-0 left-0 right-0 z-40 safe-top pointer-events-none">
          <div
            className="h-px w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, #9a8a7260, transparent)",
            }}
          />

          <div className="px-4 md:px-8 py-4 md:py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: booted ? 1 : 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto"
            >
              <h1
                className="font-cinzel text-xl md:text-2xl font-medium tracking-wide"
                style={{
                  color: "#ddd0bc",
                  textShadow: "0 0 18px rgba(221,208,188,0.12)",
                }}
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
              <NavBtn
                onClick={() => setShowLanterns(true)}
                icon={<Flame size={14} />}
                label="Lanterns"
                title="Lantern Grid (K)"
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
                label="Witness a ruin"
                title="Document a place (S)"
                highlight
              />
            </motion.nav>
          </div>

          <div
            className="h-px w-full opacity-30"
            style={{
              background:
                "linear-gradient(90deg, transparent, #9a8a7240, transparent)",
            }}
          />
        </header>

        {/* ─── 03:14 WITCHING HOUR BANNER ─── */}
        <AnimatePresence>
          {now.getHours() === 3 && now.getMinutes() === 14 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-[72px] md:top-[88px] left-1/2 -translate-x-1/2 z-50 px-6 py-2 border border-[#c4785a] bg-[#1a0e08]/90 backdrop-blur-sm text-[#c4785a] font-mono text-[10px] tracking-[0.3em] uppercase whitespace-nowrap pointer-events-none shadow-[0_0_30px_rgba(196,120,90,0.15)]"
            >
              ⚡ The grid resonates. Coordinates shift. ⚡
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── BOTTOM LEFT STATUS CLUSTER ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: booted ? 1 : 0 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="absolute bottom-3 md:bottom-8 left-4 md:left-8 z-40 pointer-events-none safe-bottom space-y-2 md:space-y-3"
        >
          {/* Archive stats & Hover Whisper */}
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
            <StatItem
              icon={<Eye size={11} />}
              value={`${visiblePlaces.length} / ${places.length} documented`}
            />
            <span className="w-px h-3 bg-[#9a8a72]/20" />

            {/* Atlas Whisper */}
            {hoveredPlace?.resonanceNote ? (
              <span className="text-[#c4b8a4] italic text-[10px] max-w-[180px] md:max-w-[280px] truncate transition-all duration-300">
                “{hoveredPlace.resonanceNote}”
              </span>
            ) : (
              <>
                <span className="hidden sm:inline">
                  {places.filter((p) => p.category === "haunted").length}{" "}
                  spectral
                </span>
                <span className="w-px h-3 bg-[#9a8a72]/20 hidden sm:inline" />
                <span className="hidden sm:inline">
                  {places.filter((p) => p.category === "abandoned").length}{" "}
                  forsaken
                </span>
              </>
            )}
          </div>

          {/* Dust accumulation */}
          <div
            className="inline-flex items-center gap-3 font-mono text-[11px] tracking-wider uppercase px-3 py-2 rounded border"
            style={{
              color: dust > 75 ? "#c4785a" : "#7a6e5e",
              borderColor:
                dust > 75
                  ? "rgba(196,120,90,0.2)"
                  : "rgba(122,107,82,0.12)",
              background: "rgba(12,10,8,0.6)",
              backdropFilter: "blur(6px)",
              boxShadow: "inset 0 1px 0 rgba(122,107,82,0.08)",
            }}
          >
            <Activity size={11} className="opacity-50" />
            <span className="opacity-60">Dust</span>
            <div
              className="w-14 h-1 rounded-full overflow-hidden"
              style={{ background: "rgba(90,78,66,0.25)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(dust, 100)}%`,
                  background: dust > 75 ? "#c4785a" : "#9a8a72",
                  boxShadow:
                    dust > 75 ? "0 0 6px rgba(196,120,90,0.4)" : "none",
                }}
              />
            </div>
            <span className="tabular-nums font-bold">{dust}%</span>
          </div>

          {/* Anomalous Signal */}
          <div className="pointer-events-auto">
            <Link
              href="/echoes"
              className="group inline-flex items-center gap-2.5 font-mono text-[10px] md:text-[11px] tracking-[0.2em] uppercase px-3 py-2 rounded border transition-all duration-500"
              style={{
                color: "#c4785a",
                borderColor: "rgba(196,120,90,0.18)",
                background: "rgba(196,120,90,0.04)",
              }}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40"
                  style={{ background: "#c4785a" }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ background: "#c4785a" }}
                />
              </span>
              <span className="group-hover:opacity-100 transition-opacity">
                Signal detected — BUNKER_7
              </span>
              <span className="opacity-40 group-hover:opacity-80 transition-opacity">
                ↳
              </span>
            </Link>
          </div>
        </motion.div>

        {/* ─── WITNESS COUNTER (top right) ─── */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: booted ? 1 : 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="absolute top-[72px] md:top-[88px] right-4 md:right-8 z-40 pointer-events-none"
        >
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border text-[9px] font-mono uppercase tracking-wider"
            style={{
              color: witnessCount > 0 ? "#c4785a" : "#5a4e42",
              borderColor:
                witnessCount > 0
                  ? "rgba(196,120,90,0.25)"
                  : "rgba(122,107,82,0.12)",
              background: "rgba(12,10,8,0.5)",
              backdropFilter: "blur(6px)",
            }}
          >
            <Users size={10} className="opacity-50" />
            <span>
              {witnessCount} {witnessCount === 1 ? "witness" : "witnesses"}
            </span>
            {ghostWitness && (
              <span className="text-[7px] text-[#c4785a] animate-pulse ml-1">
                +
              </span>
            )}
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
              boxShadow:
                "0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(122,107,82,0.1)",
            }}
            title="Locate nearest ruin (N)"
          >
            <Navigation size={13} />
            <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-wider">
              Locate
            </span>
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
                background:
                  "linear-gradient(180deg, rgba(18,14,10,0.95), rgba(12,10,8,0.95))",
                border: "1px solid rgba(122,107,82,0.2)",
                borderLeft: "3px solid #9a8a72",
                boxShadow:
                  "0 12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(122,107,82,0.08)",
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
        <div ref={mapContainerRef} className="absolute inset-0 z-0">
          <MapContainer
            places={visiblePlaces}
            onSelectPlace={openPlace}
            loading={loading}
            center={mapCenter}
            anniversarySlugs={
              isAnniversary
                ? places
                    .filter((p) => isAnniversary(p.slug))
                    .map((p) => p.slug)
                : []
            }
            onGhostCapture={handleGhostCapture}
            onTowerFound={handleTowerFound}
            onHoverPlace={setHoveredPlace}
            selectedSlug={selectedPlaceSlug}
            connectedSlugs={selectedPlace ? selectedPlace.connectedTo : []}
            // ─── NEW: Pass dust for agitation effect ───
            agitationLevel={dust}
            // ─── NEW: Pass hidden places for ghost outlines ───
  hiddenPlaces={hiddenPlaces}
  // ─── NEW: Pass dust level for pin agitation ───
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

        <AnimatePresence>
          {showLanterns && (
            <LanternSystem
              onClose={() => setShowLanterns(false)}
              preselectedPlace={selectedPlace ?? undefined}
              mapCenter={mapCenter}
            />
          )}
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
      onClick={() => {
        window.dispatchEvent(new CustomEvent("vp-ui-click"));
        onClick();
      }}
      title={title}
      className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[11px] md:text-xs transition-all duration-300 active:scale-95 flex-shrink-0"
      style={{
        color: "#9a8a72",
        background: "rgba(18,14,10,0.65)",
        border: "1px solid rgba(122,107,82,0.18)",
        backdropFilter: "blur(6px)",
        boxShadow:
          "inset 0 1px 0 rgba(122,107,82,0.06), 0 2px 8px rgba(0,0,0,0.3)",
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
      <span className="hidden sm:inline font-mono uppercase tracking-wider">
        {label}
      </span>
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
        background: highlight
          ? "rgba(122,107,82,0.12)"
          : "rgba(18,14,10,0.65)",
        border: "1px solid rgba(122,107,82,0.18)",
        backdropFilter: "blur(6px)",
        boxShadow:
          "inset 0 1px 0 rgba(122,107,82,0.06), 0 2px 8px rgba(0,0,0,0.3)",
      }}
      onClick={() => {
        window.dispatchEvent(new CustomEvent("vp-ui-click"));
      }}
      onMouseEnter={(e) => {
        window.dispatchEvent(new CustomEvent("vp-ui-hover"));
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
      <span className="hidden sm:inline font-mono uppercase tracking-wider">
        {label}
      </span>
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