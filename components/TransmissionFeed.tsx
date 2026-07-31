"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio } from "lucide-react";

const TRANSMISSIONS = [
  "Signal at 38°74'N — coordinate does not exist on any chart.",
  "BUNKER_3 responded. One word: 'Don't.'",
  "The dust carries memory. It spelled a name I haven't used in years.",
  "03:14 — all feeds went dark. Something breathed in the static.",
  "Previous archivist's notes recovered. My handwriting. I don't remember writing them.",
  "A door opened that wasn't on the schematic. It opened from both sides.",
  "The atlas updated itself while I slept. There are now seven Pripyats.",
  "Coordinates point to the ocean floor. The depth reads zero.",
  "Someone else is using this terminal. The cursor moves when I look away.",
  "The silence has a rhythm. Listen closer. It knows you're listening.",
  "Hashima is growing. Satellite imagery confirms new floors.",
  "The Ferris wheel in Pripyat turned 3° last night. No wind for miles.",
  "A lantern appeared at 0°N, 0°E. The message reads: 'Finally, company.'",
  "The numbers station changed frequency. It's broadcasting my birthday.",
  "Expedition Team 4 reached the coordinates. They found a bunker. Our bunker. From next week.",
];

export default function TransmissionFeed() {
  const [current, setCurrent] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const showTransmission = useCallback(() => {
    const msg = TRANSMISSIONS[Math.floor(Math.random() * TRANSMISSIONS.length)];
    setCurrent(msg);
    setVisible(true);
    // Stay visible for 8 seconds, then fade
    setTimeout(() => setVisible(false), 8000);
    setTimeout(() => setCurrent(null), 9500);
  }, []);

  useEffect(() => {
    // Initial delay: 20-40s, then every 45-90s
    const initial = setTimeout(showTransmission, 20000 + Math.random() * 20000);
    return () => clearTimeout(initial);
  }, [showTransmission]);

  useEffect(() => {
    if (!visible && current === null) {
      const next = setTimeout(showTransmission, 45000 + Math.random() * 45000);
      return () => clearTimeout(next);
    }
  }, [visible, current, showTransmission]);

  return (
    <AnimatePresence>
      {visible && current && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-[45] pointer-events-none"
        >
          <div className="bg-[#1a1612]/90 backdrop-blur-md border border-[#c9b18a]/20 rounded-lg px-4 py-3 shadow-lg shadow-black/40 relative overflow-hidden">
            {/* Subtle copper glow line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9b18a]/40 to-transparent" />
            
            <div className="flex items-start gap-3">
              <Radio size={14} className="text-[#c9b18a]/60 mt-0.5 flex-shrink-0 animate-pulse" />
              <div className="space-y-1">
                <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#c9b18a]/50">
                  Intercepted Transmission
                </p>
                <p className="text-xs md:text-sm font-mono text-[#d4c4a8] leading-relaxed">
                  {current}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}