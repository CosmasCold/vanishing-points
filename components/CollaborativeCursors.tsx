"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";

interface Cursor {
  id: string;
  x: number;
  y: number;
  color: string;
}

const COLORS = ["#9a8a72", "#7a3a2a", "#a67c52", "#6b7a5a", "#8a7a6a"];

export default function CollaborativeCursors() {
  const [show, setShow] = useState(false);
  const [cursors, setCursors] = useState<Cursor[]>([]);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const idRef = useRef(Math.random().toString(36).slice(2, 8));
  const colorRef = useRef(COLORS[Math.floor(Math.random() * COLORS.length)]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const bc = new BroadcastChannel("vp_lanterns");
    bcRef.current = bc;

    const handleMessage = (e: MessageEvent) => {
      const data = e.data as { id: string; x: number; y: number; color: string };
      if (data.id === idRef.current) return;
      setCursors((prev) => {
        const filtered = prev.filter((c) => c.id !== data.id);
        return [...filtered, { ...data, id: data.id }];
      });
      setTimeout(() => {
        setCursors((prev) => prev.filter((c) => c.id !== data.id));
      }, 2000);
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

  return (
    <>
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
      </button>

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