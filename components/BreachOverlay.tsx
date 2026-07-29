"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBreachProtocol } from "@/hooks/useBreachProtocol";
import Link from "next/link";

export default function BreachOverlay() {
  const { active, countdown } = useBreachProtocol();
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setFlash(true);
      setTimeout(() => setFlash(false), 150);
    }, 8000 + Math.random() * 7000);
    return () => clearInterval(interval);
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
            className="fixed top-6 right-6 z-40"
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