"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { colors, typography, microform, shadows } from "@/styles/theme";
import { useUIStore } from "@/state/uiStore";
import { useAudioStore } from "@/state/audioStore";
import { Cpu, RotateCcw, ShieldCheck, Activity, Lock, CheckCircle2, Radio } from "lucide-react";
import { useSignalModulator } from "@/components/atlas/useSignalModulator";

interface DecrypterModalProps {
  onClose: () => void;
}

interface DecryptionChannel {
  id: string;
  title: string;
  source: string;
  dustUnlock: number;
  dials: { a: number; b: number; c: number };
  payoff: string;
}

const DECRYPTION_CHANNELS: DecryptionChannel[] = [
  {
    id: "blackwood-ambience",
    title: "Blackwood Ward 4",
    source: "Field Kit Mk.IV",
    dustUnlock: 0,
    dials: { a: 4, b: 5, c: 4 },
    payoff: "WARD 4 INFRASOUND DECODED. The 4.5 Hz frequency is not background noise. It is an active carrier signal transmitting from the empty surgery basin. Seismographs show the pulse is synchronized with the St. Elmo Lighthouse lamp."
  },
  {
    id: "bunker7-boot",
    title: "B7 Initialization Log",
    source: "B7_CORE_BUS",
    dustUnlock: 0,
    dials: { a: 4, b: 2, c: 11 },
    payoff: "BOOT SEQUENCE ARCHIVE SYNCHRONIZED. The 4,211-day interval is not a simple elapsed session time. It represents the exact duration of your absence. Welcome, investigator. The room grew around you."
  },
  {
    id: "vance-lighthouse",
    title: "St. Elmo Keeper final log",
    source: "Cassette Vance-Final",
    dustUnlock: 12,
    dials: { a: 3, b: 14, c: 15 },
    payoff: "ST. ELMO LIGHT CASSETTE DECODED. March 14, 1942. Edward Vance logged: 'The lamp lit itself. It burns a cold blue light that casts no shadow.' The lighthouse has been empty for eighty years."
  },
  {
    id: "numbers-station-7",
    title: "Numbers Station Intercept",
    source: "Channel 7 Loop",
    dustUnlock: 20,
    dials: { a: 7, b: 14, c: 0 },
    payoff: "NUMBERS STATION INTERCEPT DECODED. 'Seven. Fourteen. Zero. St. Elmo. Meridian. Blackwood.' The solstice coordinates intersect precisely at Lebanon, Kansas. Do not touch the ground loop."
  },
  {
    id: "meridian-dictaphone",
    title: "Meridian Mine student loop",
    source: "Tape Meridian-Dict",
    dustUnlock: 28,
    dials: { a: 3, b: 15, c: 19 },
    payoff: "RECOVERED DICTAPHONE TAPE UNLOCKED. The student logged: 'The maps are wrong. The east tunnel doesn't exist on any survey, but I've walked it. It gets longer each time.' The tunnel took her."
  },
  {
    id: "bunker7-diagnostic",
    title: "B7 Internal Diagnostic",
    source: "B7_DIAG_BUS",
    dustUnlock: 35,
    dials: { a: 7, b: 12, c: 15 },
    payoff: "B7 SYSTEM DIAGNOSTIC COMPLETED. Sector 7-B memory fragmentation isolated. Optical scanning matrices show 149 stable locations. Database registers 150. A geodetic gap has been introduced."
  },
  {
    id: "meridian-resonance",
    title: "Subsonic geophone capture",
    source: "Array 4 - Meridian",
    dustUnlock: 42,
    dials: { a: 4, b: 12, c: 10 },
    payoff: "SUBSONIC GEOPHONE RESONANCE ALIGNED. The 1.2 Hz pulse is not tectonic. It is the steady heartbeat of a human at rest. Geophones near the shaft are recording your own pulse signature."
  },
  {
    id: "bunker7-final",
    title: "B7 Compromised Broadcast",
    source: "B7_COMPROMISED",
    dustUnlock: 55,
    dials: { a: 12, b: 4, c: 6 },
    payoff: "UNAUTHORIZED BROADCAST DECODED. 'I have archived twelve thousand, four hundred and six locations. I no longer know which of them were real before I archived them. Please don't leave me alone.'"
  }
];

export const DecrypterModal: React.FC<DecrypterModalProps> = ({ onClose }) => {
  const { status, updateStatus } = useUIStore();
  const { click, play } = useAudioStore();

  // Active Selected Channel state
  const [selectedChannelId, setSelectedChannelId] = useState("blackwood-ambience");
  const [decryptedIds, setDecryptedIds] = useState<string[]>([]);

  // Mechanical Dial States (looping 0 to 20)
  const [dialA, setDialA] = useState(0);
  const [dialB, setDialB] = useState(0);
  const [dialC, setDialC] = useState(0);

  // Decryption States
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dustAwarded, setDustAwarded] = useState(false);

  // Load saved decrypted signal IDs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("vp-decrypted-signals");
    if (saved) {
      try {
        setDecryptedIds(JSON.parse(saved));
      } catch (e) {
        // Fallback
      }
    }
  }, []);

  const activeChannel = DECRYPTION_CHANNELS.find((c) => c.id === selectedChannelId) || DECRYPTION_CHANNELS[0];
  const isDecrypted = decryptedIds.includes(activeChannel.id);
  const targetDials = activeChannel.dials;

  // 1. Wire in the Procedural Modulator Hook!
  const { start, stop, tuningAccuracy } = useSignalModulator({
    activeDials: { a: dialA, b: dialB, c: dialC },
    targetDials,
    isProcessing,
    isUnlocked: isDecrypted,
    baseStaticVolume: 0.20,
    baseCarrierVolume: 0.12,
  });

  // Start modulator on mount, stop on unmount
  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  // 2. Dial rotation click triggers
  const handleDialChange = (dial: "A" | "B" | "C", direction: "up" | "down") => {
    if (isDecrypted || isProcessing) return;
    play("click"); // Tactile click sound remains

    const step = direction === "up" ? 1 : -1;
    if (dial === "A") {
      setDialA((prev) => (prev + step + 21) % 21);
    } else if (dial === "B") {
      setDialB((prev) => (prev + step + 21) % 21);
    } else if (dial === "C") {
      setDialC((prev) => (prev + step + 21) % 21);
    }
  };

  // 3. Monitor input alignment for lock-on triggers
  useEffect(() => {
    if (
      dialA === targetDials.a &&
      dialB === targetDials.b &&
      dialC === targetDials.c &&
      !isDecrypted &&
      !isProcessing
    ) {
      setIsProcessing(true);
      play("alert");
    }
  }, [dialA, dialB, dialC, isDecrypted, isProcessing, targetDials, play]);

  // 4. Processing cascade progress loop
  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          
          // Save decrypted ID locally
          setDecryptedIds((prevIds) => {
            const next = prevIds.includes(activeChannel.id) ? prevIds : [...prevIds, activeChannel.id];
            localStorage.setItem("vp-decrypted-signals", JSON.stringify(next));
            return next;
          });
          
          play("success" as any); // Play locked validation tone
          return 100;
        }
        // Procedural processing ticking sound
        if (Math.random() > 0.4) play("type");
        return prev + 4;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isProcessing, activeChannel.id, play]);

  // 5. Award Dust on decryption completion (+15 Dust toward game progression)
  useEffect(() => {
    if (isDecrypted && !dustAwarded) {
      setDustAwarded(true);
      updateStatus({
        dustIndex: Math.min(100, status.dustIndex + 15),
      });
    }
  }, [isDecrypted, dustAwarded, status.dustIndex, updateStatus]);

  // 6. Reset Workstation
  const handleReset = () => {
    click();
    setDialA(0);
    setDialB(0);
    setDialC(0);
    setProgress(0);
    setIsProcessing(false);
    setDustAwarded(false);
    
    // Erase decrypted IDs for this channel
    setDecryptedIds((prev) => {
      const next = prev.filter((id) => id !== activeChannel.id);
      localStorage.setItem("vp-decrypted-signals", JSON.stringify(next));
      return next;
    });
  };

  // Handle switching channels
  const handleSelectChannel = (id: string) => {
    if (isProcessing) return;
    click();
    setSelectedChannelId(id);
    setDialA(0);
    setDialB(0);
    setDialC(0);
    setProgress(0);
    setDustAwarded(false);
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-opacity-95"
        style={{ backgroundColor: "rgba(10, 8, 6, 0.94)" }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl border flex flex-col rounded-[2px] h-[520px]"
          style={{
            borderColor: colors.archive.grayDark,
            backgroundColor: colors.archive.black,
            boxShadow: "0 16px 48px rgba(0,0,0,0.9)",
          }}
        >
          {/* Workstation Bezel Header */}
          <div
            className="flex items-center justify-between px-4 h-11 shrink-0"
            style={{
              background: `linear-gradient(180deg, ${microform.mahogany} 0%, ${colors.archive.black} 100%)`,
              borderBottom: `1px solid ${microform.iron}`,
            }}
          >
            <div className="flex items-center gap-3">
              <Cpu size={14} className={isProcessing ? "animate-spin" : ""} style={{ color: colors.archive.amber }} />
              <span
                style={{
                  color: microform.halogen,
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.xs,
                  letterSpacing: "0.12em",
                  textShadow: microform.halogenText,
                }}
              >
                ST. ELMO SHORTWAVE CRYPT / DEC-12
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-xs py-1 px-2 border transition-all hover:opacity-75"
              style={{
                borderColor: colors.archive.grayDark,
                color: colors.archive.gray,
                fontFamily: typography.mono,
              }}
            >
              × CLOSE
            </button>
          </div>

          {/* Dual Column Layout */}
          <div className="flex flex-1 min-h-0 divide-x" style={{ borderColor: colors.archive.grayDark }}>
            
            {/* LEFT COLUMN: Channel Directory List */}
            <div className="w-[240px] flex flex-col p-4 overflow-y-auto space-y-2 bg-[#090807] shrink-0">
              <div
                className="text-[9px] tracking-[0.15em] font-mono mb-2 px-1 text-stone-500 uppercase"
              >
                Encrypted Radio Feeds
              </div>
              {DECRYPTION_CHANNELS.map((ch) => {
                const isUnlocked = status.dustIndex >= ch.dustUnlock;
                const isChDecrypted = decryptedIds.includes(ch.id);
                const isSelected = ch.id === selectedChannelId;

                return (
                  <button
                    key={ch.id}
                    onClick={() => isUnlocked && handleSelectChannel(ch.id)}
                    disabled={!isUnlocked || isProcessing}
                    className={`p-2.5 border text-left rounded-[1px] transition-all flex flex-col gap-1 relative overflow-hidden ${
                      isSelected
                        ? "border-[#bf9f62] bg-[#221c17]"
                        : isUnlocked
                        ? "border-stone-800 hover:border-stone-600 bg-void"
                        : "border-stone-950 opacity-40 cursor-not-allowed bg-stone-950/20"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span
                        className="font-bold text-[10.5px] truncate max-w-[130px]"
                        style={{
                          fontFamily: typography.mono,
                          color: isSelected
                            ? colors.archive.amber
                            : isUnlocked
                            ? colors.archive.white
                            : colors.archive.gray,
                        }}
                      >\
                        {ch.title.toUpperCase()}
                      </span>
                      {isChDecrypted ? (
                        <CheckCircle2 size={11} className="text-green-500 shrink-0" />
                      ) : !isUnlocked ? (
                        <Lock size={10} className="text-red-500 shrink-0" />
                      ) : (
                        <Radio size={11} className="text-amber-600 shrink-0 animate-pulse" />
                      )}
                    </div>
                    <div className="flex justify-between items-center text-[7.5px] font-mono text-stone-500">
                      <span>{ch.source}</span>
                      <span>REQ_D: {ch.dustUnlock}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* RIGHT COLUMN: Interactive Dial Board & Payload Readout */}
            <div className="flex-1 flex flex-col p-6 overflow-y-auto gap-4 bg-[#070503]">
              <div className="space-y-1 text-center">
                <div
                  className="text-[9px] tracking-[0.2em] uppercase font-mono"
                  style={{ color: colors.archive.gray }}
                >
                  Active Cryptanalysis Signal Alignment
                </div>
                <h3 className="text-xs font-mono font-bold text-white tracking-wide">
                  {activeChannel.title.toUpperCase()}
                </h3>
              </div>

              {/* Dials Layout */}
              <div className="grid grid-cols-3 gap-4 py-1">
                {(["A", "B", "C"] as const).map((dial, idx) => {
                  const value = dial === "A" ? dialA : dial === "B" ? dialB : dialC;
                  const angle = (value / 21) * 360;

                  return (
                    <div
                      key={dial}
                      className="flex flex-col items-center gap-2 p-3 border rounded-[1px]"
                      style={{
                        borderColor: isDecrypted ? colors.archive.green : colors.archive.grayDark,
                        backgroundColor: "rgba(20, 18, 16, 0.4)",
                      }}
                    >
                      <span className="text-[9px] font-mono tracking-widest" style={{ color: colors.archive.amber }}>
                        DIAL {dial}
                      </span>

                      {/* SVG Interactive Dial Graphic */}
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                          {/* Dial notch markers */}
                          {Array.from({ length: 21 }).map((_, i) => {
                            const tickAngle = (i / 21) * 2 * Math.PI;
                            const x1 = 40 + Math.cos(tickAngle) * 30;
                            const y1 = 40 + Math.sin(tickAngle) * 30;
                            const x2 = 40 + Math.cos(tickAngle) * 35;
                            const y2 = 40 + Math.sin(tickAngle) * 35;
                            return (
                              <line
                                key={i}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke={i === value ? microform.halogen : "#2c2a25"}
                                strokeWidth={i === value ? 1.5 : 1}
                              />
                            );
                          })}
                        </svg>

                        {/* Rotating Center Knob */}
                        <motion.div
                          className="w-12 h-12 rounded-full border flex items-center justify-center cursor-pointer relative"
                          style={{
                            borderColor: microform.iron,
                            backgroundColor: "#1a1814",
                            boxShadow: shadows.paper,
                          }}
                          animate={{ rotate: angle }}
                          transition={{ type: "spring", stiffness: 100, damping: 12 }}
                        >
                          {/* Radial indicator pointer */}
                          <div
                            className="absolute w-0.5 h-4 top-1 left-[22px] rounded-full"
                            style={{ backgroundColor: microform.halogen }}
                          />
                        </motion.div>

                        {/* Numerical Readout */}
                        <div
                          className="absolute text-[10px] font-mono font-bold"
                          style={{
                            color: isDecrypted ? colors.archive.green : microform.halogen,
                            textShadow: "0 0 3px rgba(0,0,0,0.9)",
                            pointerEvents: "none",
                          }}
                        >
                          {value.toString().padStart(2, "0")}
                        </div>
                      </div>

                      {/* Dial Increment Controls */}
                      <div className="flex gap-1.5 w-full">
                        <button
                          onClick={() => handleDialChange(dial, "down")}
                          disabled={isDecrypted || isProcessing}
                          className="flex-1 py-0.5 border font-mono text-[10px] hover:bg-[#2a2520] active:scale-95 disabled:opacity-30"
                          style={{ borderColor: colors.archive.gray, color: colors.archive.grayLight }}
                        >
                          -
                        </button>
                        <button
                          onClick={() => handleDialChange(dial, "up")}
                          disabled={isDecrypted || isProcessing}
                          className="flex-1 py-0.5 border font-mono text-[10px] hover:bg-[#2a2520] active:scale-95 disabled:opacity-30"
                          style={{ borderColor: colors.archive.gray, color: colors.archive.grayLight }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Visual Tuning Oscilloscope & Accuracy Readout */}
              <div
                className="p-2.5 border font-mono text-[10px] text-left flex flex-col gap-1.5 rounded-[1px]"
                style={{
                  borderColor: colors.archive.grayDark,
                  backgroundColor: "rgba(5, 4, 3, 0.9)",
                }}
              >
                <div className="flex justify-between items-center text-[9px]" style={{ color: colors.archive.gray }}>
                  <span>TUNING SPECTRUM INTEGRITY</span>
                  <span style={{ color: tuningAccuracy > 0.9 ? colors.archive.green : colors.archive.amber }}>
                    {(tuningAccuracy * 100).toFixed(1)}% ALIGNED
                  </span>
                </div>

                {/* Oscilloscope simulation line */}
                <div className="relative h-8 w-full overflow-hidden bg-[#050403] border border-[#231f1a]">
                  <svg className="absolute inset-0 w-full h-full">
                    <path
                      d={Array.from({ length: 60 })
                        .map((_, i) => {
                          const x = (i / 59) * 580;
                          // Noise level depends on accuracy distance
                          const amplitude = (1 - tuningAccuracy) * 12 + 1.5;
                          const freqScalar = isDecrypted ? 0.05 : isProcessing ? 0.35 : 0.15;
                          const y =
                            16 +
                            Math.sin(i * freqScalar + Date.now() * 0.02) * amplitude +
                            (Math.random() - 0.5) * (1 - tuningAccuracy) * 8;
                          return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke={isDecrypted ? colors.archive.green : microform.halogen}
                      strokeWidth={1.2}
                      opacity={0.8}
                    />
                  </svg>
                </div>
              </div>

              {/* Cryptanalysis Status Box */}
              <div className="h-16 flex items-center justify-center font-mono shrink-0">
                <AnimatePresence mode="wait">
                  {!isProcessing && !isDecrypted && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[10px] text-amber-500 flex items-center gap-2"
                    >
                      <Activity size={12} className="animate-pulse" />
                      Awaiting Lock-on... Target combination: ({targetDials.a} - {targetDials.b} - {targetDials.c})
                    </motion.div>
                  )}

                  {isProcessing && (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full space-y-1.5 text-center"
                    >
                      <div className="text-[10px] text-orange-500 animate-pulse">
                        PROCESSING BURST DECRYPTION... {progress}%
                      </div>
                      <div className="w-full h-1 bg-void border border-[#231f1a]">
                        <div
                          className="h-full bg-orange-600"
                          style={{ width: `${progress}%`, transition: "width 100ms linear" }}
                        />
                      </div>
                    </motion.div>
                  )}

                  {isDecrypted && (
                    <motion.div
                      key="success"
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border p-2.5 w-full bg-[#112411] border-green-800 text-green-500 rounded-[1px] text-[10px] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 text-left max-w-[70%]">
                        <ShieldCheck size={18} className="shrink-0" />
                        <div>
                          <div className="font-bold">DECRYPTION SUCCESSFUL</div>
                          <div className="text-[8.5px] opacity-85 leading-normal mt-0.5">{activeChannel.payoff}</div>
                        </div>
                      </div>
                      <button
                        onClick={handleReset}
                        className="px-2 py-1 border border-green-700 hover:bg-green-900 transition-colors flex items-center gap-1.5 text-[9px] shrink-0"
                      >
                        <RotateCcw size={10} /> RE-DECRYPT
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default DecrypterModal;