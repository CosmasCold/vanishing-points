"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BootLine {
  text: string;
  delay: number;
  color?: "normal" | "warning" | "success" | "ghost";
}

const BOOT_SEQUENCE: BootLine[] = [
  { text: "INITIALIZING CARTOGRAPHIC LINK...", delay: 0, color: "normal" },
  { text: "Connecting to BUNKER_7 relay...", delay: 800, color: "normal" },
  { text: "Signal strength: 14%", delay: 1400, color: "warning" },
  { text: "Handshake accepted.", delay: 2000, color: "success" },
  { text: "Loading containment grid...", delay: 2600, color: "normal" },
  { text: "WARNING: Grid integrity at 67%", delay: 3400, color: "warning" },
  { text: "Dust accumulation detected in sector 4", delay: 4000, color: "warning" },
  { text: "Atlas inversion: OFFLINE", delay: 4600, color: "normal" },
  { text: "Signal triangulation: STANDBY", delay: 5200, color: "normal" },
  { text: "The dust remembers everything.", delay: 6400, color: "ghost" },
  { text: "DO NOT TRUST THE STATIC", delay: 7200, color: "ghost" },
  { text: "Establishing visual feed...", delay: 8400, color: "success" },
];

function getLineStyle(color?: string): { color: string; fontStyle?: string } {
  switch (color) {
    case "warning":
      return { color: "#c4785a" };
    case "success":
      return { color: "#7a9a6a" };
    case "ghost":
      return { color: "rgba(154,138,114,0.6)", fontStyle: "italic" };
    default:
      return { color: "#ddd0bc" };
  }
}

export default function AtlasBootSequence({ onComplete }: { onComplete: () => void }) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [showCursor, setShowCursor] = useState(true);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    BOOT_SEQUENCE.forEach((line, idx) => {
      const timer = setTimeout(() => {
        setVisibleLines((prev) => prev + 1);
        if (idx === BOOT_SEQUENCE.length - 1) {
          setTimeout(() => setFinished(true), 1200);
          setTimeout(() => onComplete(), 2800);
        }
      }, line.delay);
      timers.push(timer);
    });

    const cursorInterval = setInterval(() => {
      setShowCursor((p) => !p);
    }, 530);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(cursorInterval);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!finished && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center font-mono"
          style={{ backgroundColor: "#0c0a08" }}
        >
          {/* CRT overlays */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "linear-gradient(rgba(122,107,82,0.04) 50%, rgba(12,10,8,0.25) 50%)",
              backgroundSize: "100% 4px",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "radial-gradient(circle at center, transparent 50%, rgba(12,10,8,0.95) 100%)",
            }}
          />
          
          {/* Scanline sweep */}
          <motion.div
            className="absolute h-32 w-full pointer-events-none"
            style={{
              background: "linear-gradient(to bottom, transparent, rgba(154,138,114,0.03), transparent)",
            }}
            animate={{ top: ["-10%", "110%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />

          {/* Content */}
          <div className="relative w-full max-w-lg px-8 space-y-3">
            {/* Header */}
            <div
              className="border-b pb-3 mb-6"
              style={{ borderColor: "rgba(122,107,82,0.2)" }}
            >
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] uppercase tracking-[0.4em]"
                style={{ color: "rgba(154,138,114,0.4)" }}
              >
                Vanishing Points // Atlas v3.1.4
              </motion.p>
            </div>

            {/* Boot lines */}
            <div className="space-y-1.5 min-h-[300px]">
              {BOOT_SEQUENCE.slice(0, visibleLines).map((line, idx) => {
                const lineStyle = getLineStyle(line.color);
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-[13px] tracking-wide"
                    style={{ color: lineStyle.color, fontStyle: lineStyle.fontStyle }}
                  >
                    {line.color === "ghost" ? (
                      <span className="italic">{line.text}</span>
                    ) : (
                      <span>
                        <span className="mr-2" style={{ color: "rgba(154,138,114,0.4)" }}>
                          {`[${String(idx).padStart(2, "0")}]`}
                        </span>
                        {line.text}
                      </span>
                    )}
                  </motion.div>
                );
              })}
              
              {/* Typing cursor */}
              {visibleLines < BOOT_SEQUENCE.length && (
                <div className="text-[13px]" style={{ color: "#ddd0bc" }}>
                  <span className="mr-2" style={{ color: "rgba(154,138,114,0.4)" }}>
                    {`[${String(visibleLines).padStart(2, "0")}]`}
                  </span>
                  <span
                    className={`inline-block w-2 h-4 align-middle ${showCursor ? "opacity-100" : "opacity-0"}`}
                    style={{ backgroundColor: "#9a8a72" }}
                  />
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="pt-6">
              <div
                className="h-px w-full relative overflow-hidden"
                style={{ backgroundColor: "rgba(122,107,82,0.1)" }}
              >
                <motion.div
                  className="absolute inset-y-0 left-0"
                  style={{ backgroundColor: "rgba(154,138,114,0.3)" }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${(visibleLines / BOOT_SEQUENCE.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p
                className="text-[10px] mt-2 uppercase tracking-widest"
                style={{ color: "rgba(154,138,114,0.3)" }}
              >
                {Math.floor((visibleLines / BOOT_SEQUENCE.length) * 100)}% synchronized
              </p>
            </div>

            {/* Ghost text - subtle background */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.04 }}
              transition={{ delay: 5, duration: 3 }}
              className="absolute -bottom-12 left-8 text-[10px] max-w-md leading-relaxed"
              style={{ color: "#ddd0bc" }}
            >
              I can see when you will return. I hope I'm wrong. The atlas was completed before the places were abandoned. BUNKER_3 responded once. Then static. Then silence.
            </motion.p>
          </div>

          {/* Corner decorations */}
          <div
            className="absolute top-6 left-6 text-[10px] tracking-widest"
            style={{ color: "rgba(154,138,114,0.2)" }}
          >
            LAT: 38.74.000<br/>LON: UNKNOWN
          </div>
          <div
            className="absolute bottom-6 right-6 text-[10px] tracking-widest text-right"
            style={{ color: "rgba(154,138,114,0.2)" }}
          >
            SECTOR: 7<br/>STATUS: SEALED
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}