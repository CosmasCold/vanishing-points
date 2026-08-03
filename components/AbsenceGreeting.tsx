"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAbsence } from "@/hooks/useAbsence";

export default function AbsenceGreeting() {
  const { gone, hoursAway, isFirstVisit } = useAbsence();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isFirstVisit && gone) {
      const t = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(t);
    }
  }, [gone, isFirstVisit]);

  const message = useMemo(() => {
    const messages = [
      `The dust has settled in your absence.`,
      `BUNKER_7: ${Math.round(hoursAway || 0)} hours. The perimeter shifted.`,
      `The silence accumulated while you were gone.`,
      `Something was cataloged. Something was removed.`,
      `The atlas continued without you.`,
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }, [hoursAway]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div
            className="px-5 py-2.5 rounded-lg text-[10px] font-mono uppercase tracking-widest"
            style={{
              backgroundColor: "rgba(12,10,8,0.95)",
              border: "1px solid rgba(122,107,82,0.3)",
              color: "#9a8a72",
            }}
          >
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}