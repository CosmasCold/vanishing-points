"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, MapPin, X } from "lucide-react";
import { usePathname } from "next/navigation";

interface Cursor {
  id: string;
  x: number;
  y: number;
  color: string;
}

interface Lantern {
  id: string;
  placeSlug: string;
  placeName: string;
  coords: [number, number];
  placedAt: string;
  message?: string;
  flicker: boolean;
}

const COLORS = ["#9a8a72", "#7a3a2a", "#a67c52", "#6b7a5a", "#8a7a6a"];

export function getLanterns(): Lantern[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("vp-lanterns") || "[]");
}

export function placeLantern(lantern: Omit<Lantern, "id" | "placedAt">): Lantern {
  const id = `lantern-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
  const full: Lantern = { ...lantern, id, placedAt: new Date().toISOString() };
  const existing = getLanterns();
  existing.push(full);
  localStorage.setItem("vp-lanterns", JSON.stringify(existing));
  
  // Notify other tabs
  const bc = new BroadcastChannel("vp_lanterns");
  bc.postMessage({ type: "lantern_placed", lantern: full });
  bc.close();
  
  return full;
}

export function getLanternCount(): number {
  return getLanterns().length;
}

export default function CollaborativeCursors() {
  const pathname = usePathname();
  const isEchoes = pathname === "/echoes";
  
  const [show, setShow] = useState(false);
  const [cursors, setCursors] = useState<Cursor[]>([]);
  const [lanternCount, setLanternCount] = useState(0);
  const [placingMode, setPlacingMode] = useState(false);
  const [pendingLantern, setPendingLantern] = useState<{slug: string, name: string, coords: [number, number]} | null>(null);
  const [lanternMessage, setLanternMessage] = useState("");
  const bcRef = useRef<BroadcastChannel | null>(null);
  const idRef = useRef(Math.random().toString(36).slice(2, 8));
  const colorRef = useRef(COLORS[Math.floor(Math.random() * COLORS.length)]);

  // Hide on echoes page
  if (isEchoes) return null;

  useEffect(() => {
    setLanternCount(getLanternCount());
    
    const bc = new BroadcastChannel("vp_lanterns");
    bcRef.current = bc;

    const handleMessage = (e: MessageEvent) => {
      const data = e.data;
      
      // Cursor ghost
      if (data.id && data.x !== undefined) {
        if (data.id === idRef.current) return;
        setCursors((prev) => {
          const filtered = prev.filter((c) => c.id !== data.id);
          return [...filtered, { ...data, id: data.id }];
        });
        setTimeout(() => {
          setCursors((prev) => prev.filter((c) => c.id !== data.id));
        }, 2000);
      }
      
      // Lantern placed by another tab
      if (data.type === "lantern_placed") {
        setLanternCount((c) => c + 1);
      }
    };

    bc.addEventListener("message", handleMessage);
    return () => bc.close();
  }, []);

  const sendPosition = useCallback(
    (e: MouseEvent) => {
      if (!show || !bcRef.current) return;
      bcRef.current.postMessage({
        id: idRef.current,
        x: e.clientX,
        y: e.clientY,
        color: colorRef.current,
      });
    },
    [show]
  );

  useEffect(() => {
    if (!show) return;
    window.addEventListener("mousemove", sendPosition);
    return () => window.removeEventListener("mousemove", sendPosition);
  }, [show, sendPosition]);

  // Listen for place-selected to offer lantern placement
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const detail = e.detail as { slug: string; name: string; coords: [number, number] };
      if (placingMode) {
        setPendingLantern(detail);
      }
    };
    window.addEventListener("place-selected", handler as EventListener);
    return () => window.removeEventListener("place-selected", handler as EventListener);
  }, [placingMode]);

  const confirmLantern = () => {
    if (!pendingLantern) return;
    const lantern = placeLantern({
      placeSlug: pendingLantern.slug,
      placeName: pendingLantern.name,
      coords: pendingLantern.coords,
      flicker: false, // Set by danger level in real implementation
      message: lanternMessage || undefined,
    });
    setLanternCount((c) => c + 1);
    setPendingLantern(null);
    setLanternMessage("");
    setPlacingMode(false);
    
    // Dispatch event for map to render
    window.dispatchEvent(new CustomEvent("lantern-placed", { detail: lantern }));
  };

  return (
    <>
      {/* Main Toggle Button */}
      <button
        onClick={() => setShow((s) => !s)}
        className={`fixed left-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1.5 px-2.5 py-4 bg-[#252018]/80 backdrop-blur-sm border rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all shadow-lg ${
          show
            ? "border-[#9a8a72] text-[#ddd0bc] shadow-[0_0_15px_rgba(154,138,114,0.3)]"
            : "border-[rgba(122,107,82,0.25)] text-[#9a8a72] hover:text-[#ddd0bc] hover:border-[#9a8a72]"
        }`}
        title="Toggle collaborative lanterns"
      >
        <Flame size={14} className={show ? "text-[#a67c52]" : ""} />
        <span className="[writing-mode:vertical-lr] rotate-180 tracking-[0.15em]">
          {show ? "Lit" : "Lanterns"}
        </span>
        {lanternCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#a67c52] rounded-full text-[8px] flex items-center justify-center text-black font-bold">
            {lanternCount}
          </span>
        )}
      </button>

      {/* Placement Mode Indicator */}
      {placingMode && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#252018] border border-[#a67c52] rounded-lg px-4 py-2 text-[11px] font-mono text-[#a67c52] animate-pulse">
          PLACEMENT MODE ACTIVE — Click a ruin to place a lantern
        </div>
      )}

      {/* Lantern Placement Modal */}
      <AnimatePresence>
        {pendingLantern && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
            onClick={() => { setPendingLantern(null); setPlacingMode(false); }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f0c09] border border-[#a67c52]/30 rounded-lg p-5 max-w-sm w-full space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] uppercase tracking-widest text-[#a67c52]">Place Lantern</h3>
                <button onClick={() => { setPendingLantern(null); setPlacingMode(false); }}>
                  <X size={14} className="text-[#9a8a72]" />
                </button>
              </div>
              <p className="text-[12px] text-[#ddd0bc]">{pendingLantern.name}</p>
              <input
                value={lanternMessage}
                onChange={(e) => setLanternMessage(e.target.value)}
                placeholder="Leave a message (optional)..."
                maxLength={50}
                className="w-full bg-transparent border-b border-[#a67c52]/30 text-[12px] font-mono text-[#ddd0bc] outline-none py-1 placeholder:text-[10px]"
              />
              <button
                onClick={confirmLantern}
                className="w-full py-2 border border-[#a67c52]/40 rounded text-[10px] uppercase tracking-widest text-[#a67c52] hover:bg-[#a67c52]/10 transition-colors"
              >
                Ignite Lantern
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cursor Ghosts */}
      <AnimatePresence>
        {cursors.map((cursor) => (
          <motion.div
            key={cursor.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.7, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2"
            style={{ left: cursor.x, top: cursor.y }}
          >
            <div
              className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]"
              style={{ backgroundColor: cursor.color, color: cursor.color }}
            />
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 text-[8px] font-mono whitespace-nowrap"
              style={{ color: cursor.color }}
            >
              {cursor.id}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  );
}