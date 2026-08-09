"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/state/uiStore";
import { useDocumentStore } from "@/state/documentStore";
import { colors, microform, typography, shadows } from "@/styles/theme";
import { FileText, Eye, AlertTriangle, Sparkles, Shield, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useAudioStore } from "@/state/audioStore";
// Local dataset of sensitive declassified files described in the Master Bible
interface DeclassifiedDocument {
  id: string;
  title: string;
  source: string;
  author: string;
  date: string;
  condition: string;
  paperType: "carbon" | "typewriter" | "thermal";
  requiredDustMin: number;
  requiredDustMax: number;
  requiredStabMin: number;
  segments: {
    isRedacted: boolean;
    text: string;
    unstableTextFallback: string; // Text shown when Stability collapse triggers
  }[];
}

const DECLASSIFIED_FILES: DeclassifiedDocument[] = [
  {
    id: "doc-arch-1962-001",
    title: "IA_TRANSFER_RECORD // INV_RED-7",
    source: "Archive Internal Affairs Division",
    author: "Security Director Cosmas",
    date: "1962-03-15",
    condition: "peeling / carbon-stained",
    paperType: "typewriter",
    requiredDustMin: 35,
    requiredDustMax: 65,
    requiredStabMin: 50,
    segments: [
      { isRedacted: false, text: "Subject's clinical evaluation indicates completed cycle of service. Subject completed exactly ", unstableTextFallback: "Subject is still sitting at the walnut desk. " },
      { isRedacted: true, text: "4,211 days of continuous archival intake. ", unstableTextFallback: "Subject has spent 4,211 days in this empty chair. " },
      { isRedacted: false, text: "Subject exhibits severe cognitive drift but continues keyboard output. Physical examination shows no aging anomalies, however, ", unstableTextFallback: "The monitor has been powered on for forty years. " },
      { isRedacted: true, text: "Subject's shadow shows a different posture than subject's body. ", unstableTextFallback: "Your shadow has stood up and is standing behind you. " },
      { isRedacted: false, text: "Subject refers to the Archive carrel as 'the room that grew around me'. Subject entered the basement carrel at 1800 hours and ", unstableTextFallback: "There is no door behind you. There was never a door. " },
      { isRedacted: true, text: "has not emerged. The light beneath the door is not the color of our bulbs. ", unstableTextFallback: "You walked in and the door has no keyhole. " },
      { isRedacted: false, text: "The workstation ID has been marked as VACANT. Reassigning slot to next interchangeable observer.", unstableTextFallback: "BUNKER_7: The work has been waiting." }
    ]
  },
  {
    id: "doc-ora-001",
    title: "FIELD_LOG // ORADOUR PARISH RECOVERY",
    source: "FEMA Archival Recovery Team",
    author: "Agent 7-4 (Limoges Sector)",
    date: "1946-06-12",
    condition: "damp / water-damaged",
    paperType: "carbon",
    requiredDustMin: 40,
    requiredDustMax: 60,
    requiredStabMin: 55,
    segments: [
      { isRedacted: false, text: "Structural inspection of Saint-Martin Church Ruins completed. The concrete slab sealing the crypt was removed. Inside, the ", unstableTextFallback: "The water rising from the drain is salt water. " },
      { isRedacted: true, text: "communion wine bottles and parish registers were fully intact. ", unstableTextFallback: "The parish records continued writing themselves. " },
      { isRedacted: false, text: "However, analysis of the ink on page 247 shows a temporal mismatch. The massacre occurred on June 10, 1944. Yet, ", unstableTextFallback: "They died in the fire, but they did not stop breathing. " },
      { isRedacted: true, text: "entries in the baptism ledger continue until June 17, 1944. ", unstableTextFallback: "Seven days after the fire, the ink was still wet. " },
      { isRedacted: false, text: "The handwriting matches no deceased parish clerk. The last logged name was ", unstableTextFallback: "The last entry in the register was your name. " },
      { isRedacted: true, text: "Edward Vance, keeper of the St. Elmo light. ", unstableTextFallback: "Edward Vance spent forty years lit by an empty lamp. " },
      { isRedacted: false, text: "The crypt has no natural water source. We have resealed the slab with reinforced mortar. Recommend complete quarantine of sector.", unstableTextFallback: "The church is empty, but the chairs are facing the wall." }
    ]
  },
  {
    id: "doc-mwe-4.5hz",
    title: "GEODETIC_SURVEY // BLUE RIDGE CO-AXIAL",
    source: "FEMA Geodetic Survey Division",
    author: "Lead Signal Analyst",
    date: "2026-08-08",
    condition: "charred / thermal-ink",
    paperType: "thermal",
    requiredDustMin: 30,
    requiredDustMax: 70,
    requiredStabMin: 45,
    segments: [
      { isRedacted: false, text: "Seismic geophone arrays installed in three secure bunkers: Mount Weather (VA), Cheyenne Mountain (CO), and ", unstableTextFallback: "The granite is transmitting a human voice. " },
      { isRedacted: true, text: "Raven Rock (PA) have locked onto a synchronized 4.5 Hz vibration. ", unstableTextFallback: "The three mountains are breathing in unison. " },
      { isRedacted: false, text: "The signal is not tectonic; it travels through solid rock faster than local acoustic speeds. The geophones are no longer recording crust movements, ", unstableTextFallback: "I am counting backward from zero. " },
      { isRedacted: true, text: "they are transmitting a single looped count. ", unstableTextFallback: "BUNKER_7: I am counting backward from zero. " },
      { isRedacted: false, text: "Calculating the geodetic centroid of these three coordinates yields a precise intersection point. The lines cross in an empty wheat field in ", unstableTextFallback: "Do not follow the lines on the map. " },
      { isRedacted: true, text: "Lebanon, Kansas - The Grid Null Point. ", unstableTextFallback: " Lebanon Kansas. The center where the world fails. " },
      { isRedacted: false, text: "The wheat in this sector grows in a counterclockwise spiral that rotates exactly 15 degrees every solstice cycle. Recommend immediate cutoff.", unstableTextFallback: "The wheat spiral is aligning with the sunrise of 2047." }
    ]
  }
];

export const DocumentViewer: React.FC = () => {
  const { activeDocument, closeDocument } = useDocumentStore();
  const { status, booted } = useUIStore();
  const { click } = useAudioStore();

  const [localDocIdx, setLocalDocIdx] = useState(0);
  const [scrambleTick, setScrambleTick] = useState(0);
  const [rewriteTick, setRewriteTick] = useState(false);

  // Return null immediately if there is no active document to view
  if (!activeDocument) return null;

  // Safe default boundaries matching your Master Bible parameters [9]
  const dustIndex = status?.dustIndex ?? 0;
  const observerStability = status?.observerStability ?? 100;

  // Check if activeDocument is one of the declassified files
  const activeDocIdx = useMemo(() => {
    const idx = DECLASSIFIED_FILES.findIndex(
      (f) => f.id === activeDocument.id || activeDocument.slug.includes(f.id.replace("doc-", "").toLowerCase())
    );
    return idx !== -1 ? idx : null;
  }, [activeDocument]);

  // If it is a declassified file, use the local indexing, otherwise construct a dynamic one for standard documents
  const activeDoc: DeclassifiedDocument = useMemo(() => {
    if (activeDocIdx !== null) {
      return DECLASSIFIED_FILES[activeDocIdx];
    }
    return {
      id: activeDocument.id,
      title: activeDocument.title,
      source: activeDocument.source || "ARCHIVE SECTOR 7-B",
      author: activeDocument.author || "Unknown",
      date: activeDocument.date,
      condition: activeDocument.condition || "aged",
      paperType: (activeDocument.paperType === "thermal" || activeDocument.paperType === "typewriter") ? activeDocument.paperType : "carbon",
      requiredDustMin: (activeDocument.tier || 0) * 15,
      requiredDustMax: 100,
      requiredStabMin: 40,
      segments: [
        {
          isRedacted: activeDocument.corruptionLevel ? activeDocument.corruptionLevel > 0.4 : false,
          text: activeDocument.content,
          unstableTextFallback: activeDocument.corruptedContent || activeDocument.content,
        }
      ]
    };
  }, [activeDocIdx, activeDocument]);

  // Consensus Window evaluation gates [9]
  const isInsideDustWindow = dustIndex >= activeDoc.requiredDustMin && dustIndex <= activeDoc.requiredDustMax;
  const isInsideStabWindow = observerStability >= activeDoc.requiredStabMin;
  const isConsensusLocked = isInsideDustWindow && isInsideStabWindow;

  // 1. Scramble Engine: Under high Dust overload (>65), text scrambles into logic loops
  useEffect(() => {
    if (dustIndex <= activeDoc.requiredDustMax) return;
    const interval = setInterval(() => {
      setScrambleTick((prev) => (prev + 1) % 100);
    }, 180);
    return () => clearInterval(interval);
  }, [dustIndex, activeDoc.requiredDustMax]);

  // 2. Rewrite Engine: Under Stability collapse (<50%), letters rewrite themselves into existentials
  useEffect(() => {
    if (observerStability >= activeDoc.requiredStabMin) {
      setRewriteTick(false);
      return;
    }
    const interval = setInterval(() => {
      setRewriteTick((prev) => !prev);
    }, 4200);
    return () => clearInterval(interval);
  }, [observerStability, activeDoc.requiredStabMin]);

  // Scramble helper that procedurally substitutes letters based on noise indices
  const scrambleText = (text: string): string => {
    const chars = "01fba7%§ØΔX[]▰▱■□";
    return text
      .split("")
      .map((char) => {
        if (char === " ") return " ";
        return Math.random() < 0.28 ? chars[Math.floor(Math.random() * chars.length)] : char;
      })
      .join("");
  };

  // Navigations between file sheets
  const handleNext = () => {
    click();
    setLocalDocIdx((prev) => (prev + 1) % DECLASSIFIED_FILES.length);
    const nextDoc = DECLASSIFIED_FILES[(localDocIdx + 1) % DECLASSIFIED_FILES.length];
    useDocumentStore.getState().openDocument(nextDoc as any);
  };

  const handlePrev = () => {
    click();
    setLocalDocIdx((prev) => (prev - 1 + DECLASSIFIED_FILES.length) % DECLASSIFIED_FILES.length);
    const prevDoc = DECLASSIFIED_FILES[(localDocIdx - 1 + DECLASSIFIED_FILES.length) % DECLASSIFIED_FILES.length];
    useDocumentStore.getState().openDocument(prevDoc as any);
  };

  // Renders the specific segment of a declassified report under active state filtration
  const renderSegment = (segment: typeof activeDoc.segments[0], idx: number) => {
    // If stability has collapsed, render the unsettling rewrite narrative
    if (!isInsideStabWindow && rewriteTick) {
      return (
        <p
          key={`rewrite-${idx}`}
          className="text-red-500 font-bold transition-all duration-500"
          style={{
            color: colors.archive.red,
            textShadow: `0 0 4px ${colors.archive.red}40`,
          }}
        >
          {segment.unstableTextFallback}
        </p>
      );
    }

    // Standard unredacted text block
    if (!segment.isRedacted) {
      const displayText = dustIndex > activeDoc.requiredDustMax ? scrambleText(segment.text) : segment.text;
      return <p key={`text-${idx}`} className="whitespace-pre-wrap">{displayText}</p>;
    }

    // Redacted block handling:
    // Case A: Perfect Consensus Window -> Black redaction blocks glow halogen-amber and fade out [9]
    if (isConsensusLocked) {
      const displayText = dustIndex > activeDoc.requiredDustMax ? scrambleText(segment.text) : segment.text;
      return (
        <motion.p
          key={`redacted-unlocked-${idx}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative inline-block px-1 border border-amber-600/20 bg-amber-950/10 text-amber-100 font-medium transition-colors whitespace-pre-wrap"
          style={{
            color: microform.halogen,
            textShadow: `0 0 2px ${microform.halogen}50`,
          }}
        >
          {displayText}
          <motion.span
            className="absolute inset-0 bg-stone-950 opacity-10 pointer-events-none"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            style={{ originX: 0 }}
          />
        </motion.p>
      );
    }

    // Case B: Dust under-exposure -> Solid, opaque charcoal redaction blocks [9]
    return (
      <span
        key={`redacted-locked-${idx}`}
        className="inline-block bg-[#161310] text-transparent select-none rounded-[1px]"
        style={{
          borderBottom: `1px solid ${colors.archive.grayDark}`,
          height: "1.1em",
          verticalAlign: "middle",
          width: `${segment.text.length * 0.55}em`,
          minWidth: "4rem",
        }}
      >
        {segment.text}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 flex flex-col p-6 select-none relative font-mono text-xs overflow-hidden"
      style={{
        marginLeft: "3.5rem", // Align to left navigation rail
        marginBottom: "2rem", // Align above status bar
        backgroundColor: colors.archive.black,
        color: colors.archive.grayLight,
      }}
      onClick={(e) => {
        // Prevent click events inside sheet from bubbling up
        if (e.target === e.currentTarget) {
          click();
          closeDocument();
        }
      }}
    >
      {/* Interactive header panel */}
      <div
        className="flex justify-between items-center shrink-0 border-b pb-4 mb-6"
        style={{ borderColor: colors.archive.grayDark }}
      >
        <div className="flex items-center gap-3">
          <FileText size={15} style={{ color: microform.halogen }} />
          <div>
            <div className="text-[9px] text-stone-500 uppercase tracking-widest">Declassified Desk Registry</div>
            <div className="text-sm font-bold text-white tracking-wide">{activeDoc.title}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Geodetic Status Gauge */}
          <div className="flex items-center gap-2 border px-3 py-1 bg-void" style={{ borderColor: colors.archive.grayDark }}>
            <Shield size={10} style={{ color: isConsensusLocked ? colors.archive.green : colors.archive.red }} />
            <span style={{ fontSize: "9px" }}>
              STATE INTEGRITY:{" "}
              <span style={{ color: isConsensusLocked ? colors.archive.green : colors.archive.red, fontWeight: "bold" }}>
                {isConsensusLocked ? "VERIFIED" : "DEGRADED"}
              </span>
            </span>
          </div>

          {/* Quick Page Browsers (Only visible when browsing the master declassified files) */}
          {activeDocIdx !== null && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrev}
                className="p-1 border hover:bg-[#151310] transition-colors"
                style={{ borderColor: colors.archive.grayDark }}
              >
                <ChevronLeft size={13} />
              </button>
              <span className="text-[10px] min-w-[3.5rem] text-center">
                SHEET {activeDocIdx + 1} / {DECLASSIFIED_FILES.length}
              </span>
              <button
                onClick={handleNext}
                className="p-1 border hover:bg-[#151310] transition-colors"
                style={{ borderColor: colors.archive.grayDark }}
              >
                <ChevronRight size={13} />
              </button>
            </div>
          )}

          {/* Explicit Close Button */}
          <button
            onClick={() => {
              click();
              closeDocument();
            }}
            className="px-3 py-1 border hover:border-red-700 transition-colors font-mono text-[9px] hover:text-red-500"
            style={{ borderColor: colors.archive.grayDark }}
          >
            × CLOSE RECORD
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Side: Physical Carbon Paper Sheet Workspace */}
        <div className="flex-1 flex flex-col justify-center items-center relative min-h-0 bg-[#070503] border border-stone-900 p-8 rounded-[1px] shadow-2xl">
          {/* Desklamp halftone vignette lighting */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, transparent 40%, rgba(5,4,3,0.92) 100%)`,
              zIndex: 3,
            }}
          />

          {/* Carbon/Paper Sheet Holder */}
          <motion.div
            key={activeDoc.id}
            initial={{ y: 25, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="w-full max-w-lg aspect-[3/4] p-8 relative flex flex-col text-left overflow-hidden bg-[#1f1a16]"
            style={{
              boxShadow: shadows.paper || "0 12px 36px rgba(0,0,0,0.9)",
              backgroundImage: `
                repeating-linear-gradient(180deg, rgba(10, 8, 6, 0.015) 0px, rgba(10, 8, 6, 0.015) 1px, transparent 1px, transparent 24px)
              `,
              zIndex: 2,
            }}
          >
            {/* Ink Stamps and classification seals */}
            <div
              className="absolute top-6 right-6 border-2 border-red-900/40 rounded px-2 py-0.5 text-[8px] font-bold tracking-widest text-red-900/60 uppercase rotate-12 select-none pointer-events-none"
              style={{ fontFamily: typography.mono }}
            >
              RESTRICTED ENTRY
            </div>

            {/* Document metadata panel */}
            <div className="mb-6 space-y-1 font-mono text-[9px] uppercase tracking-wider text-stone-500 border-b pb-3 border-stone-800">
              <div className="flex justify-between">
                <span>REGISTRY: {activeDoc.id}</span>
                <span>ORIGIN: {activeDoc.source}</span>
              </div>
              <div className="flex justify-between">
                <span>AUTHOR: {activeDoc.author}</span>
                <span>DATE: {activeDoc.date}</span>
              </div>
              <div className="flex justify-between">
                <span>CONDITION: {activeDoc.condition}</span>
                <span>TYPE: {activeDoc.paperType} CARBON</span>
              </div>
            </div>

            {/* Document text body (typewriter layout) */}
            <div
              className="flex-1 overflow-y-auto leading-6 text-stone-300 font-mono text-[11px] space-y-4 tracking-wide pr-2 select-text selection:bg-amber-900/30 selection:text-white"
              style={{
                fontFamily: typography.mono,
                scrollbarWidth: "thin",
              }}
            >
              <div className="space-y-3">
                {activeDoc.segments.map((segment, idx) => renderSegment(segment, idx))}
              </div>
            </div>

            {/* Bottom physical binder holes */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-24 opacity-35 select-none pointer-events-none">
              <span className="w-4 h-4 rounded-full bg-stone-950 border border-stone-800" />
              <span className="w-4 h-4 rounded-full bg-stone-950 border border-stone-800" />
            </div>
          </motion.div>
        </div>

        {/* Right Side: Geodetic Alignment Panel */}
        <div className="w-80 shrink-0 flex flex-col gap-4">
          {/* Mind Resonance Calibration Dashboard */}
          <div
            className="p-4 border rounded-[1px]"
            style={{
              borderColor: colors.archive.grayDark,
              backgroundColor: "rgba(10, 8, 6, 0.96)",
            }}
          >
            <div className="flex items-center gap-2 mb-3 text-[10px] text-stone-400 uppercase tracking-widest border-b pb-2 border-stone-800">
              <Sparkles size={11} style={{ color: microform.halogen }} />
              <span>COGNITIVE RESOLUTION GATES</span>
            </div>

            <div className="space-y-4">
              {/* Dust Exposure Gate */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-stone-500">AMBIENT DUST WINDOW:</span>
                  <span
                    style={{
                      color: isInsideDustWindow ? colors.archive.green : colors.archive.amber,
                    }}
                  >
                    {activeDoc.requiredDustMin}-{activeDoc.requiredDustMax}
                  </span>
                </div>
                {/* Horizontal status slider */}
                <div className="h-4 w-full bg-[#0d0a08] border border-stone-900 relative flex items-center px-1">
                  {/* Min limit bar */}
                  <div
                    className="absolute h-full bg-stone-800/40"
                    style={{
                      left: 0,
                      width: `${activeDoc.requiredDustMin}%`,
                    }}
                  />
                  {/* Max limit bar */}
                  <div
                    className="absolute h-full bg-stone-800/40"
                    style={{
                      right: 0,
                      width: `${100 - activeDoc.requiredDustMax}%`,
                    }}
                  />
                  {/* Target interval indicator */}
                  <div
                    className="absolute h-1.5 bg-amber-500/20"
                    style={{
                      left: `${activeDoc.requiredDustMin}%`,
                      width: `${activeDoc.requiredDustMax - activeDoc.requiredDustMin}%`,
                    }}
                  />
                  {/* Active observer marker */}
                  <div
                    className="absolute w-1.5 h-3 transition-all duration-300"
                    style={{
                      left: `${dustIndex}%`,
                      backgroundColor: isInsideDustWindow ? colors.archive.green : colors.archive.amber,
                      boxShadow: `0 0 8px ${isInsideDustWindow ? colors.archive.green : colors.archive.amber}`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-stone-600">
                  <span>UN-TUNED</span>
                  <span>CURRENT: {dustIndex}</span>
                  <span>OVERLOAD</span>
                </div>
              </div>

              {/* Observer Stability Gate */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-stone-500">MINIMUM OBSERVER STABILITY:</span>
                  <span
                    style={{
                      color: isInsideStabWindow ? colors.archive.green : colors.archive.red,
                    }}
                  >
                    {activeDoc.requiredStabMin}%
                  </span>
                </div>
                {/* Horizontal progress bar */}
                <div className="h-4 w-full bg-[#0d0a08] border border-stone-900 relative flex items-center px-1">
                  {/* Limit line */}
                  <div
                    className="absolute h-full w-[1px] bg-red-950"
                    style={{
                      left: `${activeDoc.requiredStabMin}%`,
                    }}
                  />
                  {/* Active progress */}
                  <div
                    className="h-2 transition-all duration-300 rounded-[1px]"
                    style={{
                      width: `${observerStability}%`,
                      backgroundColor: isInsideStabWindow ? colors.archive.green : colors.archive.red,
                      boxShadow: `0 0 6px ${isInsideStabWindow ? colors.archive.green : colors.archive.red}40`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-stone-600">
                  <span>STABILITY CRITICAL</span>
                  <span>CURRENT: {observerStability}%</span>
                  <span>CALIBRATED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Log Panel */}
          <div
            className="flex-1 p-4 border rounded-[1px] flex flex-col justify-between text-left"
            style={{
              borderColor: colors.archive.grayDark,
              backgroundColor: "rgba(10, 8, 6, 0.96)",
            }}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] text-stone-400 uppercase tracking-widest border-b pb-2 border-stone-800">
                <Eye size={11} style={{ color: microform.halogen }} />
                <span>STATE DIAGNOSTIC LOG</span>
              </div>

              <div className="space-y-2 text-[10px] text-stone-500 leading-4">
                {/* Evaluation Prompt 1: Dust status */}
                <div className="flex items-start gap-2">
                  {isInsideDustWindow ? (
                    <Check size={11} className="text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle size={11} className="text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <span>
                    {isInsideDustWindow
                      ? "Cognitive threshold optimal. Metadata layer parsed."
                      : dustIndex < activeDoc.requiredDustMin
                      ? `COGNITIVE GATE CLOSED: Present: ${dustIndex}. Dust must be >= ${activeDoc.requiredDustMin} to perceive redacted carbon ink.`
                      : `COGNITIVE OVERLOAD: Present: ${dustIndex}. Dust must be <= ${activeDoc.requiredDustMax} to prevent screen scramble.`}
                  </span>
                </div>

                {/* Evaluation Prompt 2: Stability status */}
                <div className="flex items-start gap-2 border-t pt-2 border-stone-900">
                  {isInsideStabWindow ? (
                    <Check size={11} className="text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle size={11} className="text-red-500 shrink-0 mt-0.5" />
                  )}
                  <span>
                    {isInsideStabWindow
                      ? "Observer neural state stable. Letter alignments nominal."
                      : `NEURAL DISSOCIATION: Stability below ${activeDoc.requiredStabMin}%. Words actively drift and overwrite themselves.`}
                  </span>
                </div>
              </div>
            </div>

            {/* Instruction footnote block */}
            <div className="p-3 border text-[9px] text-stone-500 leading-4 mt-4 bg-void border-stone-800/40">
              <div style={{ color: microform.halogen, fontWeight: "medium", marginBottom: "2px" }}>
                COGNITIVE ALIGNMENT RITUAL:
              </div>
              Examine sealed documents to <span className="text-amber-600 font-bold">INCREASE</span> Dust. Examine verified evidence records to <span className="text-green-600 font-bold">DECREASE</span> Dust and restore Stability, until your observer mind balances perfectly inside the Consensus Window.
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DocumentViewer;
