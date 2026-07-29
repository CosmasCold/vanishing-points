"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Cursor {
  id: string;
  x: number;
  y: number;
  color: string;
  lastSeen: number;
}

const COLORS = ["#9a8a72", "#7a6b52", "#5a4e42", "#8a7a62", "#6b5a42"];

export default function CollaborativeCursors() {
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});
  const bcRef = useRef<BroadcastChannel | null>(null);
  const idRef = useRef(`cursor-${Math.random().toString(36).slice(2, 8)}`);
  const colorRef = useRef(COLORS[Math.floor(Math.random() * COLORS.length)]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("BroadcastChannel" in window)) return;

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

    const interval = setInterval(() => {
      bc.postMessage({
        type: "cursor",
        id: idRef.current,
        x: -100,
        y: -100,
        color: colorRef.current,
      });
    }, 5000);

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

    // Cleanup stale cursors
    const cleanup = setInterval(() => {
      setCursors((prev) => {
        const now = Date.now();
        const next: Record<string, Cursor> = {};
        Object.values(prev).forEach((c) => {
          if (now - c.lastSeen < 10000) next[c.id] = c;
        });
        return next;
      });
    }, 5000);

    return () => {
      window.removeEventListener("mousemove", handleMouse);
      clearInterval(interval);
      clearInterval(cleanup);
      bc.close();
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9997] overflow-hidden">
      <AnimatePresence>
        {Object.values(cursors).map((c) => (
          c.x < 0 ? null : (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.6, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute"
              style={{
                left: `${c.x}%`,
                top: `${c.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div
                className="w-3 h-3 rounded-full blur-sm"
                style={{ background: c.color }}
              />
              <div
                className="w-1.5 h-1.5 rounded-full absolute top-0.75 left-0.75"
                style={{ background: c.color }}
              />
            </motion.div>
          )
        ))}
      </AnimatePresence>
    </div>
  );
}