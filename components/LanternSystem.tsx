"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, MapPin, Sparkles, Wind } from "lucide-react";
import { Place } from "@/types";
import { showToast } from "@/lib/toast";

// NOTE: If spendDust does not exist in @/hooks/useDustLevel, add this:
// export function spendDust(amount: number): number {
//   if (typeof window === "undefined") return 0;
//   const current = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
//   const next = Math.max(0, current - amount);
//   localStorage.setItem("vp-dust-accumulation", next.toString());
//   return next;
// }
import { spendDust } from "@/hooks/useDustLevel";

interface Lantern {
  id: string;
  placeId?: string;
  placeName?: string;
  lat: number;
  lng: number;
  message: string;
  placedAt: string;
}

interface Props {
  onClose: () => void;
  preselectedPlace?: Place;
  mapCenter?: [number, number]; // [lng, lat]
}

const CONSTELLATION_THRESHOLD = 5;
const LANTERN_COST = 5;

function loadLanterns(): Lantern[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("vp-lanterns") || "[]");
  } catch {
    return [];
  }
}

function saveLanterns(lanterns: Lantern[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("vp-lanterns", JSON.stringify(lanterns));
}

export default function LanternSystem({ onClose, preselectedPlace, mapCenter }: Props) {
  const [lanterns, setLanterns] = useState<Lantern[]>([]);
  const [message, setMessage] = useState("");
  const [dust, setDust] = useState(0);

  useEffect(() => {
    setLanterns(loadLanterns());
    const d = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
    setDust(d);
  }, []);

  const canPlace = preselectedPlace || mapCenter;
  const placeName = preselectedPlace?.name || "These coordinates";
  const lat = preselectedPlace ? preselectedPlace.coordinates[1] : mapCenter ? mapCenter[1] : 0;
  const lng = preselectedPlace ? preselectedPlace.coordinates[0] : mapCenter ? mapCenter[0] : 0;

  const placeLantern = () => {
    if (!canPlace) {
      showToast("The atlas cannot find a threshold. Select a ruin first.", "warning");
      return;
    }

    if (dust < LANTERN_COST) {
      showToast(
        `Insufficient dust. A lantern requires ${LANTERN_COST}% contamination. You carry ${dust}%.`,
        "warning"
      );
      return;
    }

    spendDust(LANTERN_COST);
    const nextDust = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
    setDust(nextDust);

    const lantern: Lantern = {
      id: `lantern-${Date.now()}`,
      placeId: preselectedPlace?._id,
      placeName: preselectedPlace?.name,
      lat,
      lng,
      message: message.trim() || "A light in the dark.",
      placedAt: new Date().toISOString(),
    };

    const next = [...lanterns, lantern];
    saveLanterns(next);
    setLanterns(next);
    setMessage("");

    if (next.length === CONSTELLATION_THRESHOLD) {
      showToast(
        "Five points of light. The constellation aligns. Check the terminal.",
        "success"
      );
    } else if (next.length > CONSTELLATION_THRESHOLD) {
      showToast("The grid remembers this light. The constellation holds.", "success");
    } else {
      showToast(
        `Lantern placed. ${CONSTELLATION_THRESHOLD - next.length} more until alignment.`,
        "success"
      );
    }
  };

  const progress = Math.min(lanterns.length / CONSTELLATION_THRESHOLD, 1);
  const remaining = Math.max(0, CONSTELLATION_THRESHOLD - lanterns.length);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(12,10,8,0.88)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 16 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col rounded-xl border"
        style={{
          background: "linear-gradient(180deg, #14100c 0%, #0c0a08 100%)",
          borderColor: "rgba(122,107,82,0.18)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(122,107,82,0.08)",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 border-b flex items-center justify-between flex-shrink-0"
          style={{ borderColor: "rgba(122,107,82,0.12)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center border"
              style={{
                borderColor: "rgba(196,120,90,0.3)",
                background: "rgba(196,120,90,0.06)",
              }}
            >
              <Flame size={14} style={{ color: "#c4785a" }} />
            </div>
            <div>
              <h2
                className="font-cinzel text-base tracking-wide"
                style={{ color: "#ddd0bc", textShadow: "0 0 8px rgba(221,208,188,0.06)" }}
              >
                Lantern Grid
              </h2>
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-40 mt-0.5" style={{ color: "#9a8a72" }}>
                {lanterns.length} lit · {remaining > 0 ? `${remaining} to alignment` : "Constellation aligned"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
            style={{ border: "1px solid rgba(122,107,82,0.15)", color: "#9a8a72" }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Constellation progress */}
        <div className="px-6 py-4 flex-shrink-0" style={{ background: "rgba(122,107,82,0.03)" }}>
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: "#5a4e42" }}>
            <span className="flex items-center gap-1.5">
              <Sparkles size={10} />
              Constellation Alignment
            </span>
            <span style={{ color: progress >= 1 ? "#c4785a" : "#9a8a72" }}>
              {lanterns.length} / {CONSTELLATION_THRESHOLD}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(90,78,66,0.2)" }}>
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                background: progress >= 1
                  ? "linear-gradient(90deg, #c4785a, #e8a080)"
                  : "linear-gradient(90deg, #5a4e42, #9a8a72)",
                boxShadow: progress >= 1 ? "0 0 8px rgba(196,120,90,0.3)" : "none",
              }}
            />
          </div>
          {progress >= 1 && (
            <p className="text-[9px] font-mono mt-2 italic" style={{ color: "#c4785a", opacity: 0.7 }}>
              The grid holds. The archivist used to map stars. Now he maps dust.
            </p>
          )}
        </div>

        {/* Lantern list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {lanterns.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <Wind size={20} className="mx-auto opacity-20" style={{ color: "#9a8a72" }} />
              <p className="text-[11px] font-mono uppercase tracking-wider opacity-30" style={{ color: "#9a8a72" }}>
                No lanterns on the grid
              </p>
              <p className="text-[11px] opacity-25 italic" style={{ color: "#7a6e5e" }}>
                They burn in the dark. Place them on ruins you have visited.
              </p>
            </div>
          ) : (
            lanterns.map((l) => (
              <div
                key={l.id}
                className="p-3.5 rounded-lg border relative overflow-hidden"
                style={{
                  borderColor: "rgba(122,107,82,0.1)",
                  background: "rgba(18,14,10,0.5)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Flame size={10} style={{ color: "#c4785a", opacity: 0.7 }} />
                      <span className="text-[10px] font-mono uppercase tracking-wider truncate" style={{ color: "#9a8a72" }}>
                        {l.placeName || `${l.lat.toFixed(3)}°, ${l.lng.toFixed(3)}°`}
                      </span>
                    </div>
                    <p className="text-[13px] leading-relaxed" style={{ color: "#ddd0bc", opacity: 0.85 }}>
                      "{l.message}"
                    </p>
                    <p className="text-[9px] font-mono mt-2 opacity-25 uppercase tracking-wider" style={{ color: "#9a8a72" }}>
                      {new Date(l.placedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                {/* Subtle warm glow behind each lantern card */}
                <div
                  className="absolute -top-6 -right-6 w-16 h-16 rounded-full pointer-events-none"
                  style={{
                    background: "radial-gradient(circle, rgba(196,120,90,0.06) 0%, transparent 70%)",
                  }}
                />
              </div>
            ))
          )}
        </div>

        {/* Place new lantern */}
        <div
          className="px-6 py-5 border-t flex-shrink-0 space-y-3"
          style={{ borderColor: "rgba(122,107,82,0.1)" }}
        >
          {canPlace ? (
            <>
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider" style={{ color: "#5a4e42" }}>
                <MapPin size={10} style={{ color: "#9a8a72" }} />
                <span className="truncate">Place lantern at {placeName}</span>
              </div>

              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 60))}
                placeholder="A whisper in the dark..."
                className="w-full py-2.5 px-3 rounded-lg text-[13px] font-mono outline-none placeholder:opacity-20"
                style={{
                  background: "rgba(18,14,10,0.6)",
                  border: "1px solid rgba(122,107,82,0.15)",
                  color: "#ddd0bc",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(154,138,114,0.3)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(122,107,82,0.15)";
                }}
              />

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "#5a4e42" }}>
                  Cost: {LANTERN_COST}% dust · You carry {dust}%
                </span>
                <button
                  onClick={placeLantern}
                  disabled={dust < LANTERN_COST}
                  className="px-5 py-2.5 rounded-lg text-[11px] font-mono uppercase tracking-wider font-bold transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    color: dust >= LANTERN_COST ? "#0c0a08" : "#5a4e42",
                    background: dust >= LANTERN_COST
                      ? "linear-gradient(135deg, #9a8a72, #7a6a52)"
                      : "transparent",
                    border: dust >= LANTERN_COST
                      ? "1px solid rgba(122,107,82,0.3)"
                      : "1px solid rgba(90,78,66,0.15)",
                    boxShadow: dust >= LANTERN_COST
                      ? "inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.3)"
                      : "none",
                  }}
                >
                  Light Lantern
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-[11px] font-mono opacity-30" style={{ color: "#9a8a72" }}>
                Select a ruin on the map to place a lantern.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}