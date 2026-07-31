"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Skull, Wind, MapPin, ChevronRight, ShieldAlert } from "lucide-react";
import { ExpeditionDef, ExpeditionPhase } from "@/lib/expeditions";
import { Place } from "@/types";

interface Props {
  place: Place;
  expedition: ExpeditionDef;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: {
    dust: number;
    items: string[];
    reportsUnlocked: number[];
    corruptionTriggered: boolean;
  }) => void;
}

export default function ExpeditionModal({
  place,
  expedition,
  isOpen,
  onClose,
  onComplete,
}: Props) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [totalDust, setTotalDust] = useState(0);
  const [items, setItems] = useState<string[]>([]);
  const [reports, setReports] = useState<number[]>([]);
  const [corruption, setCorruption] = useState(false);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPhaseIndex(0);
      setLog([
        `EXPEDITION INITIATED: ${expedition.placeName.toUpperCase()}`,
        `TYPE: ${expedition.type.toUpperCase()}`,
        `DANGER: ${place.dangerLevel}/5`,
        "",
        "The dust settles as you approach...",
        "",
      ]);
      setTotalDust(0);
      setItems([]);
      setReports([]);
      setCorruption(false);
      setEnded(false);
    }
  }, [isOpen, expedition, place.dangerLevel]);

  const choose = useCallback(
    (choice: ExpeditionPhase["choices"][0]) => {
      const phase = expedition.phases[phaseIndex];

      // Corruption roll
      const corrupted = Math.random() < choice.corruptionRisk;
      if (corrupted) setCorruption(true);

      const newItems = choice.itemId ? [...items, choice.itemId] : items;
      const newReports =
        choice.unlocksReportIndex !== undefined
          ? [...reports, choice.unlocksReportIndex]
          : reports;

      setItems(newItems);
      setReports(newReports);
      setTotalDust((d) => d + choice.dust);

      setLog((prev) => [
        ...prev,
        `> ${choice.label}`,
        "",
        ...choice.description.split(". ").map((s) => s.trim() + "."),
        "",
        `Dust accumulated: +${choice.dust}%`,
        corrupted ? "[!] CORRUPTION DETECTED" : "",
        "",
      ]);

      if (choice.next === "extract") {
        setEnded(true);
        setLog((prev) => [
          ...prev,
          "═══════════════════════════════════════",
          "EXTRACTION COMPLETE",
          `Total dust: ${totalDust + choice.dust}%`,
          `Items recovered: ${newItems.length}`,
          `Reports documented: ${newReports.length}`,
          corruption || corrupted
            ? "WARNING: Anomalous contamination present."
            : "No anomalous signatures.",
          "═══════════════════════════════════════",
        ]);
        onComplete({
          dust: totalDust + choice.dust,
          items: newItems,
          reportsUnlocked: newReports,
          corruptionTriggered: corruption || corrupted,
        });
      } else {
        setPhaseIndex(choice.next);
      }
    },
    [expedition, phaseIndex, items, reports, totalDust, corruption, onComplete]
  );

  if (!isOpen) return null;

  const phase = expedition.phases[phaseIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#0a0806]/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
    >
      <div className="w-full max-w-2xl bg-[#12100e] border border-[#9a8a72]/20 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#9a8a72]/10 flex items-center justify-between bg-[#0c0a08]">
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#5a4e42]">
              Expedition Log // {phaseIndex + 1}/{expedition.phases.length}
            </p>
            <h2 className="font-cinzel text-sm md:text-base text-[#ddd0bc] mt-0.5">
              {ended ? "Extraction Complete" : phase?.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#9a8a72]/20 flex items-center justify-center text-[#9a8a72] hover:text-[#ddd0bc] hover:border-[#9a8a72]/40 transition-all active:scale-95"
          >
            <X size={14} />
          </button>
        </div>

        {/* Narrative Log */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-3 font-mono text-xs md:text-sm text-[#b8a898] leading-relaxed">
          {log.map((line, i) => (
            <p
              key={i}
              className={
                line.startsWith(">") ? "text-[#c9b18a]" : line.startsWith("[!]") ? "text-[#a05050]" : ""
              }
            >
              {line}
            </p>
          ))}
          {!ended && phase && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="pt-2"
            >
              <p className="text-[#ddd0bc] text-sm md:text-base leading-relaxed font-sans">
                {phase.narrative}
              </p>
            </motion.div>
          )}
        </div>

        {/* Choices */}
        {!ended && phase && (
          <div className="p-5 md:p-6 border-t border-[#9a8a72]/10 bg-[#0c0a08] space-y-2">
            {phase.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => choose(choice)}
                className="w-full text-left p-3 md:p-4 rounded-lg border border-[#9a8a72]/15 hover:border-[#9a8a72]/40 hover:bg-[#1a1612] transition-all group active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm font-mono text-[#ddd0bc] group-hover:text-[#c9b18a] transition-colors">
                    {choice.label}
                  </span>
                  <ChevronRight
                    size={14}
                    className="text-[#5a4e42] group-hover:text-[#9a8a72] transition-colors"
                  />
                </div>
                <p className="text-[10px] md:text-xs text-[#7a6e5e] mt-1">
                  {choice.description}
                </p>
                <div className="flex items-center gap-3 mt-2 text-[9px] font-mono uppercase tracking-wider text-[#5a4e42]">
                  <span className="flex items-center gap-1">
                    <Wind size={10} />
                    +{choice.dust}%
                  </span>
                  {choice.corruptionRisk > 0 && (
                    <span className="flex items-center gap-1 text-[#8a5a4a]">
                      <ShieldAlert size={10} />
                      Risk
                    </span>
                  )}
                  {choice.itemId && (
                    <span className="flex items-center gap-1 text-[#7a6a5a]">
                      <MapPin size={10} />
                      Item
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* End State */}
        {ended && (
          <div className="p-5 md:p-6 border-t border-[#9a8a72]/10 bg-[#0c0a08]">
            <button
              onClick={onClose}
              className="w-full py-3 bg-[#1a1612] border border-[#9a8a72]/30 rounded-lg text-xs font-mono uppercase tracking-[0.2em] text-[#c9b18a] hover:bg-[#252018] transition-colors active:scale-[0.98]"
            >
              Return to Atlas
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}