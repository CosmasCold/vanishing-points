"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, MapPin, Zap, Triangle, Lock, Unlock, Wind } from "lucide-react";
import { showToast } from "@/lib/toast";

interface Tower {
  id: string;
  name: string;
  coords: [number, number];
  discoveredAt: string;
}

interface Props {
  theme: {
    primary: string;
    dim: string;
    accent: string;
  };
  onPushTerminal?: (lines: string[]) => void;
}

/* ─── localStorage helpers ─── */
function getTowers(): Tower[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("vp-towers-found") || "[]");
  } catch {
    return [];
  }
}

function getDust(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
}

function addDust(amount: number) {
  if (typeof window === "undefined") return;
  const current = getDust();
  const next = Math.min(100, current + amount);
  localStorage.setItem("vp-dust-accumulation", next.toString());
  window.dispatchEvent(new CustomEvent("vp-dust-change"));
}

function isTriangulated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("vp-bunker-triangulated") === "true";
}

function setTriangulatedFlag() {
  if (typeof window === "undefined") return;
  localStorage.setItem("vp-bunker-triangulated", "true");
}

/* ─── Component ─── */
export default function SignalTriangulation({ theme, onPushTerminal }: Props) {
  const [towers, setTowers] = useState<Tower[]>([]);
  const [triangulated, setTriangulated] = useState(false);
  const [triangulating, setTriangulating] = useState(false);

  const refresh = useCallback(() => {
    setTowers(getTowers());
    setTriangulated(isTriangulated());
  }, []);

  useEffect(() => {
    refresh();
    // Listen for tower discoveries from Atlas while this panel is open
    const handler = () => refresh();
    window.addEventListener("vp-tower-found", handler);
    return () => window.removeEventListener("vp-tower-found", handler);
  }, [refresh]);

  const handleTriangulate = () => {
    if (triangulated) {
      showToast("Triangulation already complete. The bunker has been found.", "info");
      return;
    }
    if (towers.length < 3) {
      showToast(
        `Insufficient signals. ${3 - towers.length} more tower${towers.length === 2 ? "" : "s"} required for triangulation.`,
        "warning"
      );
      return;
    }

    setTriangulating(true);

    setTimeout(() => {
      setTriangulating(false);
      setTriangulated(true);
      setTriangulatedFlag();
      addDust(15);

      showToast("Triangulation complete. BUNKER_7 location verified.", "success");

      onPushTerminal?.([
        `╔══════════════════════════════════════╗`,
        `║  TRIANGULATION COMPLETE              ║`,
        `╠══════════════════════════════════════╣`,
        `║  Signals aligned: ${String(towers.length).padStart(2, "0")}                ║`,
        `║  Dust accumulation: +15%             ║`,
        `║  BUNKER_7 coordinates: CONFIRMED     ║`,
        `╚══════════════════════════════════════╝`,
        "",
        "The archivist's notes suggest the bunker is not underground.",
        "It is between the signals.",
        "",
      ]);
    }, 2500);
  };

  const needed = Math.max(0, 3 - towers.length);

  return (
    <div className="space-y-5 text-[11px] md:text-[13px] font-mono select-none">
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: theme.dim }}>
          Signal Triangulation
        </p>
        <p className="text-[10px] mt-1 leading-relaxed" style={{ color: theme.dim }}>
          The towers broadcast on overlapping frequencies. Three points are required to resolve BUNKER_7's position.
        </p>
      </div>

      {/* Radar scope */}
      <div
        className="relative h-48 rounded-lg border overflow-hidden flex items-center justify-center"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(18,14,10,0.9) 0%, #0c0a08 100%)",
          borderColor: triangulated ? "rgba(196,120,90,0.2)" : "rgba(122,107,82,0.12)",
          boxShadow: triangulated ? "inset 0 0 40px rgba(196,120,90,0.04)" : "none",
        }}
      >
        {/* Grid rings */}
        {[30, 50, 70].map((r) => (
          <div
            key={r}
            className="absolute rounded-full border pointer-events-none"
            style={{
              width: `${r * 2}px`,
              height: `${r * 2}px`,
              borderColor: "rgba(122,107,82,0.08)",
            }}
          />
        ))}
        {/* Crosshairs */}
        <div className="absolute w-full h-px pointer-events-none" style={{ background: "rgba(122,107,82,0.06)" }} />
        <div className="absolute h-full w-px pointer-events-none" style={{ background: "rgba(122,107,82,0.06)" }} />

        {/* Tower pings */}
        {towers.slice(0, 3).map((t, i) => {
          const angle = (i * 120 - 90) * (Math.PI / 180);
          const dist = 50;
          const x = Math.cos(angle) * dist;
          const y = Math.sin(angle) * dist;
          return (
            <motion.div
              key={t.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.2, type: "spring" }}
              className="absolute flex flex-col items-center gap-1"
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "#c4785a", boxShadow: "0 0 8px rgba(196,120,90,0.4)" }}
              />
              <span className="text-[9px] uppercase tracking-wider whitespace-nowrap" style={{ color: "#9a8a72" }}>
                {t.name}
              </span>
            </motion.div>
          );
        })}

        {/* Center lock */}
        <div
          className="absolute w-3 h-3 rounded-full border"
          style={{
            borderColor: triangulated ? "#c4785a" : "rgba(122,107,82,0.2)",
            background: triangulated ? "rgba(196,120,90,0.15)" : "transparent",
          }}
        >
          {triangulated && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute inset-0 rounded-full"
              style={{ background: "rgba(196,120,90,0.3)" }}
            />
          )}
        </div>

        {/* Triangulation lines when complete */}
        {triangulated && towers.length >= 3 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {towers.slice(0, 3).map((t, i) => {
              const angle = (i * 120 - 90) * (Math.PI / 180);
              const dist = 50;
              const cx = 50 + (Math.cos(angle) * dist * 100) / 192; // approximate % for 192px half-height
              const cy = 50 + (Math.sin(angle) * dist * 100) / 96;
              return (
                <line
                  key={t.id}
                  x1="50%"
                  y1="50%"
                  x2={`${cx}%`}
                  y2={`${cy}%`}
                  stroke="rgba(196,120,90,0.15)"
                  strokeWidth="1"
                />
              );
            })}
          </svg>
        )}

        {/* Scanning sweep */}
        {!triangulated && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: "conic-gradient(from 0deg, transparent 0deg, rgba(154,138,114,0.03) 60deg, transparent 120deg)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>

      {/* Tower list */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest" style={{ color: theme.dim }}>
          Discovered Towers ({towers.length})
        </p>

        {towers.length === 0 ? (
          <div
            className="p-4 rounded-lg border text-center space-y-2"
            style={{ borderColor: "rgba(122,107,82,0.08)", background: "rgba(18,14,10,0.4)" }}
          >
            <Wind size={16} className="mx-auto opacity-20" style={{ color: "#9a8a72" }} />
            <p className="text-[11px] opacity-30" style={{ color: "#9a8a72" }}>
              No tower signals detected on the Atlas.
            </p>
            <p className="text-[10px] opacity-20" style={{ color: "#7a6e5e" }}>
              The towers appear as anomalous markers on the surface map.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {towers.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 p-3 rounded-lg border"
                style={{
                  borderColor: "rgba(122,107,82,0.1)",
                  background: "rgba(18,14,10,0.4)",
                }}
              >
                <MapPin size={12} style={{ color: "#c4785a" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate" style={{ color: "#ddd0bc" }}>
                    {t.name}
                  </p>
                  <p className="text-[10px]" style={{ color: "#5a4e42" }}>
                    {t.coords[1].toFixed(4)}°N, {t.coords[0].toFixed(4)}°E
                  </p>
                </div>
                <span className="text-[10px] uppercase tracking-wider" style={{ color: "#7a9a6a" }}>
                  Locked
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider">
          <span style={{ color: theme.dim }}>Triangulation Progress</span>
          <span style={{ color: towers.length >= 3 ? "#c4785a" : theme.dim }}>
            {towers.length} / 3
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden border" style={{ background: "#0c0a08", borderColor: "rgba(122,107,82,0.1)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              background: towers.length >= 3
                ? "linear-gradient(90deg, #c4785a, #e8a080)"
                : "linear-gradient(90deg, #5a4e42, #9a8a72)",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((towers.length / 3) * 100, 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        {needed > 0 && (
          <p className="text-[10px]" style={{ color: "#5a4e42" }}>
            {needed} more signal{needed > 1 ? "s" : ""} required.
          </p>
        )}
      </div>

      {/* Action button */}
      <button
        onClick={handleTriangulate}
        disabled={triangulating || triangulated || towers.length < 3}
        className="w-full py-3 rounded-lg border text-[11px] uppercase tracking-[0.15em] font-bold transition-all disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2 relative overflow-hidden"
        style={{
          borderColor: triangulated
            ? "rgba(122,154,106,0.3)"
            : towers.length >= 3
            ? "rgba(196,120,90,0.3)"
            : "rgba(122,107,82,0.1)",
          color: triangulated
            ? "#7a9a6a"
            : towers.length >= 3
            ? "#c4785a"
            : "#5a4e42",
          backgroundColor: triangulated
            ? "rgba(122,154,106,0.06)"
            : towers.length >= 3
            ? "rgba(196,120,90,0.06)"
            : "transparent",
          opacity: towers.length < 3 && !triangulated ? 0.5 : 1,
        }}
      >
        {triangulating && (
          <motion.div
            className="absolute inset-0 opacity-10"
            style={{ backgroundColor: "#c4785a" }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          {triangulated ? (
            <Lock size={14} />
          ) : triangulating ? (
            <Zap size={14} className="animate-pulse" />
          ) : (
            <Unlock size={14} />
          )}
          {triangulated
            ? "BUNKER_7 Located"
            : triangulating
            ? "Resolving coordinates..."
            : towers.length >= 3
            ? "Initiate Triangulation"
            : "Insufficient Signals"}
        </span>
      </button>

      {/* Completed lore */}
      <AnimatePresence>
        {triangulated && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="border-l-2 pl-3 py-1"
            style={{ borderColor: "rgba(196,120,90,0.2)" }}
          >
            <p className="text-xs leading-relaxed italic" style={{ color: "#c4785a", opacity: 0.7 }}>
              The archivist's notes suggest the bunker is not underground. It is between the signals. You have found the space between.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}