"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, X, Keyboard } from "lucide-react";

const SHORTCUTS = [
  { key: "E", action: "Open Expedition Planner" },
  { key: "N", action: "Find Nearest Ruin" },
  { key: "R", action: "Random Destination" },
  { key: "A", action: "Open Archives (List)" },
  { key: "S", action: "Submit Discovery" },
  { key: "?", action: "Show this guide" },
  { key: "Esc", action: "Close panel / overlay" },
];

export default function HelpOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-[9999] w-9 h-9 flex items-center justify-center rounded-full bg-[#252018] border border-[rgba(122,107,82,0.3)] text-[#9a8a72] hover:text-[#ddd0bc] hover:border-[#9a8a72] transition-all shadow-lg"
        title="Keyboard shortcuts (?)"
      >
        <HelpCircle size={14} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-[rgba(15,12,9,0.9)] backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="submit-card rounded-xl p-8 w-full max-w-md relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Keyboard size={16} className="text-[#9a8a72]" />
                  <h2 className="font-cinzel text-lg text-[#3d3228]">Cartographer's Guide</h2>
                </div>
                <button onClick={() => setOpen(false)} className="text-[#9a8a72] hover:text-[#5a4e42]">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                {SHORTCUTS.map((s) => (
                  <div key={s.key} className="flex items-center justify-between py-2 border-b border-[rgba(62,50,40,0.08)] last:border-0">
                    <span className="text-sm text-[#4a3e32]">{s.action}</span>
                    <kbd className="px-2 py-1 bg-[rgba(90,78,66,0.08)] border border-[rgba(122,107,82,0.2)] rounded text-[10px] font-mono text-[#5a4e42]">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-[10px] font-mono text-[#9a8a72] text-center uppercase tracking-wider">
                Press ? anywhere to toggle this guide
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}