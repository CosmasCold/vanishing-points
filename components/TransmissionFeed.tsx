"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cycleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTransmission = useCallback(() => {
    // Clear any lingering timers
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    if (clearTimer.current) clearTimeout(clearTimer.current);

    const msg = TRANSMISSIONS[Math.floor(Math.random() * TRANSMISSIONS.length)];
    setCurrent(msg);
    setVisible(true);

    fadeTimer.current = setTimeout(() => setVisible(false), 8000);
    clearTimer.current = setTimeout(() => setCurrent(null), 9500);
  }, []);

  useEffect(() => {
    const initial = setTimeout(showTransmission, 20000 + Math.random() * 20000);
    return () => {
      clearTimeout(initial);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      if (clearTimer.current) clearTimeout(clearTimer.current);
      if (cycleTimer.current) clearTimeout(cycleTimer.current);
    };
  }, [showTransmission]);

  useEffect(() => {
    if (!visible && current === null) {
      cycleTimer.current = setTimeout(showTransmission, 45000 + Math.random() * 45000);
      return () => {
        if (cycleTimer.current) clearTimeout(cycleTimer.current);
      };
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
          <div
            className="rounded-lg px-4 py-3 relative overflow-hidden border"
            style={{
              backgroundColor: "rgba(12,10,8,0.95)",
              borderColor: "rgba(154,138,114,0.2)",
            }}
          >
            {/* Subtle copper glow line */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(154,138,114,0.4), transparent)",
              }}
            />
            
            <div className="flex items-start gap-3">
              <Radio
                size={14}
                className="mt-0.5 flex-shrink-0"
                style={{ color: "rgba(154,138,114,0.6)" }}
              />
              <div className="space-y-1">
                <p
                  className="text-[10px] font-mono uppercase tracking-[0.2em]"
                  style={{ color: "rgba(154,138,114,0.5)" }}
                >
                  Intercepted Transmission
                </p>
                <p
                  className="text-xs md:text-sm font-mono leading-relaxed"
                  style={{ color: "#ddd0bc" }}
                >
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