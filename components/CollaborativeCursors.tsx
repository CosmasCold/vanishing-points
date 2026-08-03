"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, X } from "lucide-react";
import { usePathname } from "next/navigation";

interface Cursor { id: string; x: number; y: number; color: string; }

interface Lantern {
  id: string;
  placeSlug: string;
  placeName: string;
  coords: [number, number];
  placedAt: string;
  message?: string;
  flicker: boolean;
}

const COLORS = ["#9a8a72", "#7a3a2a", "#a67c52", "#b8a080", "#8a7a6a"];

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
  const bc = new BroadcastChannel("vp_lanterns");
  bc.postMessage({ type: "lantern_placed", lantern: full });
  bc.close();
  return full;
}

export function getLanternCount(): number { return getLanterns().length; }

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

  useEffect(() => { setLanternCount(getLanternCount()); }, []);
  
  useEffect(() => {
    const bc = new BroadcastChannel("vp_lanterns");
    bcRef.current = bc;
    const handleMessage = (e: MessageEvent) => {
      const data = e.data;
      if (data.id && data.x !== undefined) {
        if (data.id === idRef.current) return;
        setCursors((prev) => { const f = prev.filter((c) => c.id !== data.id); return [...f, { ...data, id: data.id }]; });
        setTimeout(() => setCursors((prev) => prev.filter((c) => c.id !== data.id)), 2000);
      }
      if (data.type === "lantern_placed") setLanternCount((c) => c + 1);
    };
    bc.addEventListener("message", handleMessage);
    return () => bc.close();
  }, []);

  const sendPosition = useCallback((e: MouseEvent) => {
    if (!show || !bcRef.current) return;
    bcRef.current.postMessage({ id: idRef.current, x: e.clientX, y: e.clientY, color: colorRef.current });
  }, [show]);

  useEffect(() => {
    if (!show) return;
    window.addEventListener("mousemove", sendPosition);
    return () => window.removeEventListener("mousemove", sendPosition);
  }, [show, sendPosition]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { slug: string; name: string; coords: [number, number] } | undefined;
      if (placingMode && detail) setPendingLantern(detail);
    };
    window.addEventListener("place-selected", handler);
    return () => window.removeEventListener("place-selected", handler);
  }, [placingMode]);

  const confirmLantern = () => {
    if (!pendingLantern) return;
    const lantern = placeLantern({ placeSlug: pendingLantern.slug, placeName: pendingLantern.name, coords: pendingLantern.coords, flicker: false, message: lanternMessage || undefined });
    setLanternCount((c) => c + 1);
    setPendingLantern(null);
    setLanternMessage("");
    setPlacingMode(false);
    window.dispatchEvent(new CustomEvent("lantern-placed", { detail: lantern }));
  };

  if (isEchoes) return null;

  const toggleBtnStyle: React.CSSProperties = show
    ? { borderColor: "#9a8a72", color: "#ddd0bc" }
    : { borderColor: "rgba(122,107,82,0.25)", color: "#9a8a72" };

  return (
    <>
      <button
        onClick={() => setShow((s) => !s)}
        className="fixed left-4 md:left-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1.5 px-2 py-3 md:px-2.5 md:py-4 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-colors"
        style={{
          backgroundColor: "rgba(12,10,8,0.9)",
          border: "1px solid",
          ...toggleBtnStyle,
        }}
        onMouseEnter={(e) => {
          if (!show) {
            (e.currentTarget as HTMLElement).style.color = "#ddd0bc";
            (e.currentTarget as HTMLElement).style.borderColor = "#9a8a72";
          }
        }}
        onMouseLeave={(e) => {
          if (!show) {
            (e.currentTarget as HTMLElement).style.color = "#9a8a72";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(122,107,82,0.25)";
          }
        }}
        title="Toggle collaborative lanterns"
      >
        <Flame size={14} style={{ color: show ? "#a67c52" : "currentColor" }} />
        <span
          className="rotate-180 tracking-[0.15em] text-[10px]"
          style={{ writingMode: "vertical-lr" }}
        >
          {show ? "Lit" : "Lanterns"}
        </span>
        {lanternCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold"
            style={{ backgroundColor: "#a67c52", color: "#0c0a08" }}
          >
            {lanternCount}
          </span>
        )}
      </button>

      {show && (
        <button
          onClick={() => setPlacingMode((p) => !p)}
          className="fixed left-4 md:left-6 top-[calc(50%+70px)] md:top-[calc(50%+80px)] -translate-y-1/2 z-40 px-2 py-1.5 md:px-2.5 md:py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-colors"
          style={{
            backgroundColor: "rgba(12,10,8,0.9)",
            border: "1px solid",
            borderColor: placingMode ? "#a67c52" : "rgba(122,107,82,0.25)",
            color: placingMode ? "#a67c52" : "#9a8a72",
          }}
          onMouseEnter={(e) => {
            if (!placingMode) {
              (e.currentTarget as HTMLElement).style.color = "#ddd0bc";
            }
          }}
          onMouseLeave={(e) => {
            if (!placingMode) {
              (e.currentTarget as HTMLElement).style.color = "#9a8a72";
            }
          }}
        >
          {placingMode ? "Cancel" : "Place"}
        </button>
      )}

      {placingMode && (
        <div
          className="fixed top-20 md:top-24 left-1/2 -translate-x-1/2 z-50 rounded-lg px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-[11px] font-mono whitespace-nowrap animate-flicker"
          style={{
            backgroundColor: "#0c0a08",
            border: "1px solid #a67c52",
            color: "#a67c52",
          }}
        >
          Placement active — Click a ruin to place a lantern
        </div>
      )}

      <AnimatePresence>
        {pendingLantern && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(12,10,8,0.6)" }}
            onClick={() => { setPendingLantern(null); setPlacingMode(false); }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-lg p-4 md:p-5 max-w-sm w-full space-y-3"
              style={{
                backgroundColor: "#0c0a08",
                border: "1px solid rgba(166,124,82,0.3)",
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] uppercase tracking-widest" style={{ color: "#a67c52" }}>Place Lantern</h3>
                <button onClick={() => { setPendingLantern(null); setPlacingMode(false); }}>
                  <X size={14} style={{ color: "#9a8a72" }} />
                </button>
              </div>
              <p className="text-[12px] md:text-[13px]" style={{ color: "#ddd0bc" }}>{pendingLantern.name}</p>
              <input
                value={lanternMessage}
                onChange={(e) => setLanternMessage(e.target.value)}
                placeholder="Leave a message (optional)..."
                maxLength={50}
                className="w-full bg-transparent outline-none py-1 font-mono"
                style={{
                  borderBottom: "1px solid rgba(166,124,82,0.3)",
                  fontSize: "12px",
                  color: "#ddd0bc",
                }}
              />
              <button
                onClick={confirmLantern}
                className="w-full py-2 rounded text-[10px] uppercase tracking-widest transition-colors"
                style={{
                  border: "1px solid rgba(166,124,82,0.4)",
                  color: "#a67c52",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(166,124,82,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                }}
              >
                Ignite Lantern
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cursors.map((cursor) => (
          <motion.div
            key={cursor.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.6, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2"
            style={{ left: cursor.x, top: cursor.y }}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: cursor.color,
                boxShadow: `0 0 10px ${cursor.color}`,
              }}
            />
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-mono whitespace-nowrap"
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