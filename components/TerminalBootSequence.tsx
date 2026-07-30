"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BootLine {
  text: string;
  delay: number;
  color?: "normal" | "warning" | "success" | "ghost" | "error";
}

const BOOT_SEQUENCE: BootLine[] = [
  { text: "BIOS CHECKSUM: 0x4F7A... VERIFIED", delay: 0, color: "normal" },
  { text: "MEMORY TEST: 640K OK", delay: 300, color: "normal" },
  { text: "PERIPHERAL SCAN: KEYBOARD DETECTED", delay: 600, color: "normal" },
  { text: "HARDLINE STATUS: NO CARRIER", delay: 900, color: "warning" },
  { text: "ATTEMPTING UPLINK...", delay: 1300, color: "normal" },
  { text: "UPLINK FAILED. ROUTING THROUGH BUNKER_7 RELAY.", delay: 1800, color: "warning" },
  { text: "RELAY HANDSHAKE: ACCEPTED", delay: 2400, color: "success" },
  { text: "DECRYPTING KERNEL...", delay: 2800, color: "normal" },
  { text: "WARNING: KERNEL MODIFIED 03:14", delay: 3400, color: "warning" },
  { text: "LOADING BUNKER_7 INTERFACE v2.4.1", delay: 4000, color: "normal" },
  { text: "ATMOSPHERE: BREATHABLE (QUESTIONABLE)", delay: 4600, color: "warning" },
  { text: "SIGNAL: INTERMITTENT", delay: 5200, color: "warning" },
  { text: "The terminal remembers the last person who sat here.", delay: 6400, color: "ghost" },
  { text: "It wasn't you.", delay: 7400, color: "ghost" },
  { text: "BOOT COMPLETE.", delay: 8800, color: "success" },
];

export default function TerminalBootSequence({ onComplete }: { onComplete: () => void }) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    BOOT_SEQUENCE.forEach((line, idx) => {
      const timer = setTimeout(() => {
        setVisibleLines((prev) => prev + 1);
        if (idx === BOOT_SEQUENCE.length - 1) {
          setTimeout(() => setFinished(true), 1000);
          setTimeout(() => onComplete(), 2200);
        }
      }, line.delay);
      timers.push(timer);
    });
    const cursorInterval = setInterval(() => setShowCursor((p) => !p), 500);
    return () => { timers.forEach(clearTimeout); clearInterval(cursorInterval); };
  }, [onComplete]);

  const getColor = (color?: string) => {
    switch (color) {
      case "warning": return "text-[#c4a060]/80";
      case "success": return "text-[#7a9a6a]/80";
      case "ghost": return "text-[#9a8a72]/40 italic";
      case "error": return "text-[#a05050]/80";
      default: return "text-[#c8c0b4]/80";
    }
  };

  return (
    <AnimatePresence>
      {!finished && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-[#080605] flex items-center justify-center font-mono p-4 md:p-6"
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,20,0.06)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.85)_100%)]" />
          
          <div className="relative w-full max-w-xl space-y-1">
            <div className="border-b border-[rgba(200,190,170,0.06)] pb-2 mb-4 md:mb-6">
              <p className="text-[9px] uppercase tracking-[0.4em] text-[#555]">BUNKER_7 // Secure Terminal // Cold Boot</p>
            </div>

            <div className="space-y-1 min-h-[280px] md:min-h-[320px]">
              {BOOT_SEQUENCE.slice(0, visibleLines).map((line, idx) => (
                <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className={`text-[11px] md:text-[13px] tracking-wide ${getColor(line.color)}`}>
                  {line.color === "ghost" ? <span className="pl-4">{line.text}</span> : <span><span className="text-[#444] mr-2">{`[${String(idx).padStart(2,"0")}]`}</span>{line.text}</span>}
                </motion.div>
              ))}
              {visibleLines < BOOT_SEQUENCE.length && (
                <div className="text-[11px] md:text-[13px] text-[#c8c0b4]/80">
                  <span className="text-[#444] mr-2">{`[${String(visibleLines).padStart(2,"0")}]`}</span>
                  <span className={`inline-block w-2 h-4 bg-[#9a8a72] align-middle ${showCursor ? "opacity-100" : "opacity-0"}`} />
                </div>
              )}
            </div>

            <div className="pt-4 md:pt-6 border-t border-[rgba(200,190,170,0.04)]">
              <div className="h-px w-full bg-[rgba(200,190,170,0.04)] relative overflow-hidden">
                <motion.div className="absolute inset-y-0 left-0 bg-[#9a8a72]/15" initial={{ width: "0%" }} animate={{ width: `${(visibleLines / BOOT_SEQUENCE.length) * 100}%` }} transition={{ duration: 0.3 }} />
              </div>
              <p className="text-[9px] text-[#444] mt-2 uppercase tracking-widest">{Math.floor((visibleLines / BOOT_SEQUENCE.length) * 100)}% loaded</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}