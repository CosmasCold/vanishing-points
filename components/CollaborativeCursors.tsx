"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";

interface Cursor {
  id: string;
  x: number;
  y: number;
  color: string;
  lastSeen: number;
}

const COLORS = ["#c4a882", "#8a9a7a", "#a48a7a", "#7a8a9a", "#9a8a6a"];

export default function CollaborativeCursors() {
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});
  const [enabled, setEnabled] = useState(false);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const idRef = useRef(`cursor-${Math.random().toString(36).slice(2, 8)}`);
  const colorRef = useRef(COLORS[Math.floor(Math.random() * COLORS.length)]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("BroadcastChannel" in window)) return;
    if (!enabled) return;

    const bc = new BroadcastChannel("vp-cursors");
    bcRef.current = bc;

    const handleMouse = (e: MouseEvent) => {
      bc.postMessage({
        type: "cursor",
        id: idRef.current,
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
        color: colorRef.current,
      });
    };

    bc.onmessage = (ev) => {
      if (ev.data.id === idRef.current) return;
      setCursors((prev) => ({
        ...prev,
        [ev.data.id]: {
          id: ev.data.id,
          x: ev.data.x,
          y: ev.data.y,
          color: ev.data.color,
          lastSeen: Date.now(),
        },
      }));
    };

    window.addEventListener("mousemove", handleMouse);

    const cleanup = setInterval(() => {
      setCursors((prev) => {
        const now = Date.now();
        const next: Record<string, Cursor> = {};
        Object.values(prev).forEach((c) => {
          if (now - c.lastSeen < 8000) next[c.id] = c;
        });
        return next;
      });
    }, 3000);

    return () => {
      window.removeEventListener("mousemove", handleMouse);
      clearInterval(cleanup);
      bc.close();
    };
  }, [enabled]);

  return (
    <>
      <button
        onClick={() => setEnabled(!enabled)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-3 py-1.5 bg-[#252018] border border-[rgba(122,107,82,0.3)] rounded-full text-[10px] font-mono uppercase tracking-wider text-[#9a8a72] hover:text-[#ddd0bc] transition-all shadow-lg"
        title="Toggle collaborative cursors (opens another tab to test)"
      >
        <Users size={12} />
        {enabled ? `Lanterns: ${Object.keys(cursors).length}` : "Show Lanterns"}
      </button>

      {enabled && (
        <div className="fixed inset-0 pointer-events-none z-[9996] overflow-hidden">
          <AnimatePresence>
            {Object.values(cursors).map((c) => (
              c.x < 0 ? null : (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 0.7, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute"
                  style={{ left: `${c.x}%`, top: `${c.y}%`, transform: "translate(-50%, -50%)" }}
                >
                  <div className="w-4 h-4 rounded-full blur-md" style={{ background: c.color }} />
                  <div className="w-2 h-2 rounded-full absolute top-1 left-1" style={{ background: c.color }} />
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[8px] font-mono text-[#9a8a72] whitespace-nowrap opacity-50">
                    explorer-{c.id.slice(-4)}
                  </div>
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}