"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { colors, typography, microform, shadows } from "@/styles/theme";
import { useUIStore } from "@/state/uiStore";
import { useAudioStore } from "@/state/audioStore";
import { Cpu, RotateCcw, ShieldCheck, Activity } from "lucide-react";
import { useSignalModulator } from "@/components/atlas/useSignalModulator";

interface DecrypterModalProps {
  onClose: () => void;
}

export const DecrypterModal: React.FC<DecrypterModalProps> = ({ onClose }) => {
  const { status, updateStatus } = useUIStore();
  const { click, play } = useAudioStore();

  // Mechanical Dial States (looping 0 to 20)
  const [dialA, setDialA] = useState(0);
  const [dialB, setDialB] = useState(0);
  const [dialC, setDialC] = useState(0);

  // Decryption States
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [dustAwarded, setDustAwarded] = useState(false);

  // 1. Wire in the Procedural Modulator Hook! [1]
  const { start, stop, tuningAccuracy } = useSignalModulator({
    activeDials: { a: dialA, b: dialB, c: dialC },
    targetDials: { a: 7, b: 14, c: 0 }, // Solstice Vector
    isProcessing,
    isUnlocked: isDecrypted,
    baseStaticVolume: 0.20,
    baseCarrierVolume: 0.12,
  });

  // Start modulator on mount, stop on unmount [5]
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
    // Solstice vector combination: 7 - 14 - 0 [360]
    if (dialA === 7 && dialB === 14 && dialC === 0 && !isDecrypted && !isProcessing) {
      setIsProcessing(true);
      play("alert");
    }
  }, [dialA, dialB, dialC, isDecrypted, isProcessing, play]);

  // 4. Processing cascade progress loop
  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setIsDecrypted(true);
          play("success" as any); // Play locked validation tone
          return 100;
        }
        // Procedural processing ticking sound [2]
        if (Math.random() > 0.4) play("type");
        return prev + 4;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isProcessing, play]);

  // 5. Award Dust on decryption completion (+15 Dust toward game progression)
  useEffect(() => {
    if (isDecrypted && !dustAwarded) {
      setDustAwarded(true);
      updateStatus({
        dustIndex: status.dustIndex + 15,
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
    setIsDecrypted(false);
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
          className="w-full max-w-xl border flex flex-col rounded-[2px]"
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

          {/* Main Interface Body */}
          <div className="p-6 flex flex-col gap-6 text-center select-none" style={{ color: colors.archive.white }}>
            <div className="space-y-1">
              <div
                className="text-[10px] tracking-[0.2em] uppercase font-mono"
                style={{ color: colors.archive.gray }}
              >
                Archival Decryption Interface
              </div>
              <p className="text-xs font-mono max-w-md mx-auto" style={{ color: colors.archive.grayLight }}>
                Align frequency dials to match the anomalous solstice vector. Maximize tuning accuracy to crack static.
              </p>
            </div>

            {/* Dials Layout */}
            <div className="grid grid-cols-3 gap-4 py-4">
              {(["A", "B", "C"] as const).map((dial, idx) => {
                const value = dial === "A" ? dialA : dial === "B" ? dialB : dialC;
                const angle = (value / 21) * 360;

                return (
                  <div
                    key={dial}
                    className="flex flex-col items-center gap-3 p-4 border rounded-[1px]"
                    style={{
                      borderColor: isDecrypted ? colors.archive.green : colors.archive.grayDark,
                      backgroundColor: "rgba(20, 18, 16, 0.5)",
                    }}
                  >
                    <span className="text-[10px] font-mono tracking-widest" style={{ color: colors.archive.amber }}>
                      DIAL {dial}
                    </span>

                    {/* SVG Interactive Dial Graphic */}
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        {/* Dial notch markers */}
                        {Array.from({ length: 21 }).map((_, i) => {
                          const tickAngle = (i / 21) * 2 * Math.PI;
                          const x1 = 48 + Math.cos(tickAngle) * 38;
                          const y1 = 48 + Math.sin(tickAngle) * 38;
                          const x2 = 48 + Math.cos(tickAngle) * 43;
                          const y2 = 48 + Math.sin(tickAngle) * 43;
                          return (
                            <line
                              key={i}
                              x1={x1}
                              y1={y1}
                              x2={x2}
                              y2={y2}
                              stroke={i === value ? microform.halogen : "#3a3833"}
                              strokeWidth={i === value ? 1.5 : 1}
                            />
                          );
                        })}
                      </svg>

                      {/* Rotating Center Knob */}
                      <motion.div
                        className="w-16 h-16 rounded-full border-2 flex items-center justify-center cursor-pointer relative"
                        style={{
                          borderColor: microform.iron,
                          backgroundColor: "#231f1a",
                          boxShadow: shadows.paper,
                        }}
                        animate={{ rotate: angle }}
                        transition={{ type: "spring", stiffness: 100, damping: 12 }}
                      >
                        {/* Radial indicator pointer */}
                        <div
                          className="absolute w-1 h-6 top-1 left-[30px] rounded-full"
                          style={{ backgroundColor: microform.halogen }}
                        />
                      </motion.div>

                      {/* Numerical Readout */}
                      <div
                        className="absolute text-xs font-mono font-bold"
                        style={{
                          color: isDecrypted ? colors.archive.green : microform.halogen,
                          textShadow: "0 0 4px rgba(0,0,0,0.8)",
                          pointerEvents: "none",
                        }}
                      >
                        {value.toString().padStart(2, "0")}
                      </div>
                    </div>

                    {/* Dial Increment Controls */}
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => handleDialChange(dial, "down")}
                        disabled={isDecrypted || isProcessing}
                        className="flex-1 py-1 border font-mono text-xs hover:bg-[#2a2520] active:scale-95 disabled:opacity-30"
                        style={{ borderColor: colors.archive.gray, color: colors.archive.grayLight }}
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleDialChange(dial, "up")}
                        disabled={isDecrypted || isProcessing}
                        className="flex-1 py-1 border font-mono text-xs hover:bg-[#2a2520] active:scale-95 disabled:opacity-30"
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
              className="p-3 border font-mono text-xs text-left flex flex-col gap-2 rounded-[1px]"
              style={{
                borderColor: colors.archive.grayDark,
                backgroundColor: "rgba(5, 4, 3, 0.9)",
              }}
            >
              <div className="flex justify-between items-center text-[10px]" style={{ color: colors.archive.gray }}>
                <span>TUNING SPECTRUM INTEGRITY</span>
                <span style={{ color: tuningAccuracy > 0.9 ? colors.archive.green : colors.archive.amber }}>
                  {(tuningAccuracy * 100).toFixed(1)}% ALIGNED
                </span>
              </div>

              {/* Oscilloscope simulation line */}
              <div className="relative h-10 w-full overflow-hidden bg-[#0c0a08] border border-[#231f1a]">
                <svg className="absolute inset-0 w-full h-full">
                  <path
                    d={Array.from({ length: 60 })
                      .map((_, i) => {
                        const x = (i / 59) * 480;
                        // Noise level depends on accuracy distance
                        const amplitude = (1 - tuningAccuracy) * 16 + 2;
                        const freqScalar = isDecrypted ? 0.05 : isProcessing ? 0.35 : 0.15;
                        const y =
                          20 +
                          Math.sin(i * freqScalar + Date.now() * 0.02) * amplitude +
                          (Math.random() - 0.5) * (1 - tuningAccuracy) * 12;
                        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                      })
                      .join(" ")}
                    fill="none"
                    stroke={isDecrypted ? colors.archive.green : microform.halogen}
                    strokeWidth={1.5}
                    opacity={0.8}
                  />
                </svg>
              </div>
            </div>

            {/* Cryptanalysis Status Box */}
            <div className="h-16 flex items-center justify-center font-mono">
              <AnimatePresence mode="wait">
                {!isProcessing && !isDecrypted && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-amber-500 flex items-center gap-2"
                  >
                    <Activity size={14} className="animate-pulse" />
                    Awaiting Carrier Lock-on... (7 - 14 - 0)
                  </motion.div>
                )}

                {isProcessing && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full space-y-2 text-center"
                  >
                    <div className="text-xs text-orange-500 animate-pulse">
                      PROCESSING BURST DECRYPTION... {progress}%
                    </div>
                    <div className="w-full h-1.5 bg-void border border-[#231f1a]">
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
                    className="border p-3 w-full bg-[#112411] border-green-800 text-green-500 rounded-[1px] text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <ShieldCheck size={20} className="shrink-0" />
                      <div>
                        <div className="font-bold">DECRYPTION SUCCESSFUL</div>
                        <div className="text-[10px] opacity-75">Solstice frequency intercept decoded (+15 Dust)</div>
                      </div>
                    </div>
                    <button
                      onClick={handleReset}
                      className="px-2 py-1 border border-green-700 hover:bg-green-900 transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw size={11} /> RESET
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default DecrypterModal;
