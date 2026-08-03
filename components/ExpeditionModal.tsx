"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wind, MapPin, ChevronRight, ShieldAlert, Skull, Radio } from "lucide-react";
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
        `═══════════════════════════════════════`,
        `EXPEDITION INITIATED: ${expedition.placeName.toUpperCase()}`,
        `TYPE: ${expedition.type.toUpperCase()}`,
        `DANGER: ${place.dangerLevel}/5`,
        `═══════════════════════════════════════`,
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
      const corrupted = Math.random() < choice.corruptionGain;
      if (corrupted) setCorruption(true);

      const newItems = choice.itemId ? [...items, choice.itemId] : items;
      const newReports =
        choice.unlocksReportIndex !== undefined
          ? [...reports, choice.unlocksReportIndex]
          : reports;

      setItems(newItems);
      setReports(newReports);
      setTotalDust((d) => d + choice.dustGain);

      setLog((prev) => [
        ...prev,
        `> ${choice.label}`,
        "",
        ...choice.description.split(/\. (?=[A-Z])/).map((s) => s.trim() + "."),
        "",
        `Dust accumulated: +${choice.dustGain}%`,
        corrupted ? "[!] CORRUPTION DETECTED — The Other is watching." : "",
        "",
      ]);

      if (choice.next === "extract") {
        setEnded(true);
        setLog((prev) => [
          ...prev,
          "═══════════════════════════════════════",
          "EXTRACTION COMPLETE",
          `Total dust: ${totalDust + choice.dustGain}%`,
          `Items recovered: ${newItems.length}`,
          `Reports documented: ${newReports.length}`,
          corruption || corrupted
            ? "WARNING: Anomalous contamination present."
            : "No anomalous signatures detected.",
          "═══════════════════════════════════════",
        ]);
        onComplete({
          dust: totalDust + choice.dustGain,
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
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
      style={{ background: "rgba(8,6,4,0.92)", backdropFilter: "blur(8px)" }}
    >
      {/* Corruption pulse overlay */}
      {corruption && (
        <div
          className="pointer-events-none fixed inset-0 z-[101] animate-pulse"
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(196,120,90,0.04) 0%, transparent 70%)",
            animationDuration: "3s",
          }}
        />
      )}

      <motion.div
        initial={{ scale: 0.96, y: 12, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.96, y: 12, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl rounded-xl overflow-hidden flex flex-col max-h-[90dvh] relative"
        style={{
          background: "linear-gradient(180deg, rgba(18,14,10,0.96), rgba(10,8,6,0.98))",
          border: "1px solid rgba(122,107,82,0.18)",
          borderLeft: "3px solid #9a8a72",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(122,107,82,0.06)",
        }}
      >
        {/* Bronze trim top */}
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, #9a8a7260, transparent)" }} />

        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(122,107,82,0.1)" }}
        >
          <div className="space-y-0.5">
            <p
              className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.3em]"
              style={{ color: "#5a4e42" }}
            >
              Expedition Log // {ended ? "COMPLETE" : `PHASE ${phaseIndex + 1}/${expedition.phases.length}`}
            </p>
            <h2
              className="font-cinzel text-sm md:text-base font-medium tracking-wide"
              style={{ color: "#ddd0bc", textShadow: "0 0 8px rgba(221,208,188,0.08)" }}
            >
              {ended ? "Extraction Complete" : phase?.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{
              border: "1px solid rgba(122,107,82,0.2)",
              color: "#5a4e42",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(122,107,82,0.4)";
              e.currentTarget.style.color = "#ddd0bc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(122,107,82,0.2)";
              e.currentTarget.style.color = "#5a4e42";
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Narrative Log */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-1.5 font-mono text-xs md:text-sm leading-[1.8]">
          {log.map((line, i) => {
            let color = "#b8a898";
            let opacity = 1;
            let extraShadow = "";
            if (line.startsWith(">")) {
              color = "#c9b18a";
              opacity = 0.85;
            } else if (line.startsWith("[!]")) {
              color = "#c4785a";
              extraShadow = "0 0 6px rgba(196,120,90,0.25)";
              opacity = 1;
            } else if (line.startsWith("═")) {
              color = "#9a8a72";
              opacity = 0.4;
            } else if (line.startsWith("EXTRACTION") || line.startsWith("EXPEDITION")) {
              color = "#ddd0bc";
              opacity = 0.9;
            } else if (line.startsWith("Total") || line.startsWith("Items") || line.startsWith("Reports")) {
              color = "#9a8a72";
              opacity = 0.7;
            } else if (line.startsWith("WARNING")) {
              color = "#c4785a";
              opacity = 0.9;
            }

            return (
              <p
                key={i}
                className="whitespace-pre-wrap"
                style={{ color, opacity, textShadow: extraShadow }}
              >
                {line}
              </p>
            );
          })}

          {!ended && phase && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="pt-3"
            >
              <p
                className="text-[13px] md:text-[14px] leading-[1.85] font-mono"
                style={{ color: "#ddd0bc", textShadow: "0 0 4px rgba(221,208,188,0.06)" }}
              >
                {phase.narrative}
              </p>
            </motion.div>
          )}
        </div>

        {/* Choices */}
        {!ended && phase && (
          <div
            className="p-5 md:p-6 space-y-2.5 flex-shrink-0"
            style={{
              borderTop: "1px solid rgba(122,107,82,0.1)",
              background: "linear-gradient(180deg, rgba(12,10,8,0.6), rgba(10,8,6,0.8))",
            }}
          >
            {phase.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => choose(choice)}
                className="w-full text-left p-3.5 md:p-4 rounded-lg transition-all group active:scale-[0.99]"
                style={{
                  background: "rgba(122,107,82,0.04)",
                  border: "1px solid rgba(122,107,82,0.12)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(122,107,82,0.08)";
                  e.currentTarget.style.borderColor = "rgba(122,107,82,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(122,107,82,0.04)";
                  e.currentTarget.style.borderColor = "rgba(122,107,82,0.12)";
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs md:text-sm font-mono font-bold tracking-wide transition-colors"
                    style={{ color: "#ddd0bc" }}
                  >
                    {choice.label}
                  </span>
                  <ChevronRight
                    size={14}
                    className="opacity-30 group-hover:opacity-70 transition-all group-hover:translate-x-0.5"
                    style={{ color: "#9a8a72" }}
                  />
                </div>
                <p
                  className="text-[11px] md:text-xs mt-1.5 leading-relaxed"
                  style={{ color: "#7a6e5e" }}
                >
                  {choice.description}
                </p>
                <div className="flex items-center gap-4 mt-2.5 text-[10px] md:text-[11px] font-mono uppercase tracking-[0.1em]">
                  <span className="flex items-center gap-1.5" style={{ color: "#9a8a72" }}>
                    <Wind size={10} />
                    +{choice.dustGain}%
                  </span>
                  {choice.corruptionGain > 0 && (
                    <span className="flex items-center gap-1.5" style={{ color: "#c4785a" }}>
                      <ShieldAlert size={10} />
                      {Math.round(choice.corruptionGain * 100)}% risk
                    </span>
                  )}
                  {choice.itemId && (
                    <span className="flex items-center gap-1.5" style={{ color: "#7a9a6a" }}>
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
          <div
            className="p-5 md:p-6 flex-shrink-0"
            style={{
              borderTop: "1px solid rgba(122,107,82,0.1)",
              background: "linear-gradient(180deg, rgba(12,10,8,0.6), rgba(10,8,6,0.8))",
            }}
          >
            <div
              className="rounded-lg p-4 mb-4 space-y-2"
              style={{
                background: "rgba(122,107,82,0.04)",
                border: "1px solid rgba(122,107,82,0.12)",
              }}
            >
              <div className="flex items-center justify-between text-xs font-mono" style={{ color: "#9a8a72" }}>
                <span>Dust</span>
                <span style={{ color: "#ddd0bc" }}>{totalDust}%</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono" style={{ color: "#9a8a72" }}>
                <span>Items</span>
                <span style={{ color: "#ddd0bc" }}>{items.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono" style={{ color: "#9a8a72" }}>
                <span>Reports</span>
                <span style={{ color: "#ddd0bc" }}>{reports.length}</span>
              </div>
              {corruption && (
                <div
                  className="flex items-center gap-2 pt-2 mt-2 text-[11px] font-mono uppercase tracking-wider"
                  style={{
                    color: "#c4785a",
                    borderTop: "1px solid rgba(196,120,90,0.15)",
                  }}
                >
                  <Skull size={12} />
                  Anomalous contamination present
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-lg text-xs font-mono uppercase tracking-[0.2em] font-bold transition-all active:scale-[0.98]"
              style={{
                color: "#0c0a08",
                background: "linear-gradient(135deg, #9a8a72, #7a6a52)",
                border: "1px solid rgba(122,107,82,0.3)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 16px rgba(0,0,0,0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #b0a088, #8a7a62)";
                e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.15), 0 6px 20px rgba(0,0,0,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #9a8a72, #7a6a52)";
                e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 16px rgba(0,0,0,0.3)";
              }}
            >
              Return to Atlas
            </button>
          </div>
        )}

        {/* Bottom bronze trim */}
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, #9a8a7230, transparent)" }} />
      </motion.div>
    </motion.div>
  );
}