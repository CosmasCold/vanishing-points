"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function BreachOverlay() {
  const [active, setActive] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const check = () => {
      const breachTime = localStorage.getItem("bunker-breach-time");
      if (breachTime) {
        const diff = parseInt(breachTime, 10) - Date.now();
        if (diff <= 0) {
          setActive(true);
          setCountdown(null);
        } else {
          const mins = Math.floor(diff / 60000);
          setActive(false);
          setCountdown(`${mins}m`);
        }
      } else {
        setActive(false);
        setCountdown(null);
      }
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!active) return;

    // Phase 3: persist breach count + dispatch corruption events
    const count = parseInt(localStorage.getItem("vp-breach-count") || "0", 10);
    localStorage.setItem("vp-breach-count", String(count + 1));
    localStorage.setItem("vp-last-breach", Date.now().toString());
    window.dispatchEvent(new CustomEvent("breach-triggered"));
    window.dispatchEvent(new CustomEvent("atlas-invert", { detail: { source: "breach" } }));

    const flashInterval = setInterval(() => {
      setFlash(true);
      setTimeout(() => setFlash(false), 150);
    }, 8000 + Math.random() * 7000);
    return () => clearInterval(flashInterval);
  }, [active]);

  if (!active && !countdown) return null;

  return (
    <>
      {active && (
        <div
          className={`fixed inset-0 z-[9990] pointer-events-none transition-opacity duration-150 ${
            flash ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundColor: "rgba(51, 255, 0, 0.08)" }}
        />
      )}

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[9995]"
          >
            <Link
              href="/breach"
              className="flex items-center gap-2 px-4 py-2 bg-[#050a05] border border-[#33ff00]/60 rounded-lg text-[10px] font-mono uppercase tracking-widest text-[#33ff00] animate-pulse shadow-[0_0_20px_rgba(51,255,0,0.3)]"
            >
              <span className="w-2 h-2 rounded-full bg-[#33ff00]" />
              BREACH PROTOCOL ACTIVE
            </Link>
          </motion.div>
        )}

        {!active && countdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-6 right-6 z-[9995]"
          >
            <div className="px-3 py-1.5 bg-[#252018]/80 border border-[rgba(122,107,82,0.2)] rounded text-[9px] font-mono uppercase tracking-wider text-[#7a6e5e]">
              Breach in {countdown}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}