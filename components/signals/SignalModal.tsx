"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { colors, typography, microform } from "@/styles/theme";
import { X, Play, Pause, Radio, Lock, Unlock } from "lucide-react";
import { useSignalModulator } from "@/components/atlas/useSignalModulator";
import { useAudioStore } from "@/state/audioStore";

export interface SignalArtifact {
  id: string;
  title: string;
  source: string;
  length: string;
  dustUnlock: number;
  description: string;
  transcript: string[];
  mediaUrl?: string; // Physical MP3 track url
}

interface SignalModalProps {
  signal: SignalArtifact;
  onClose: () => void;
}

interface SignalAudioProfile {
  frequency: number;
  type: "ghostly" | "terminal" | "numbers" | "radar";
  label: string;
}

const SIGNAL_SETTINGS: Record<string, SignalAudioProfile> = {
  "blackwood-ambience": { frequency: 4.5, type: "ghostly", label: "ANOMALOUS INFRASOUND RES_4.5" },
  "bunker7-boot": { frequency: 7.0, type: "terminal", label: "B7_CORE_BUS_7.0" },
  "vance-lighthouse": { frequency: 5.8, type: "ghostly", label: "SOLSTICE_DRIFT_5.8" },
  "vance-oradour": { frequency: 6.2, type: "ghostly", label: "ORADOUR_RES_6.2" }, // GHOSTLY resonant sweep!
  "numbers-station-7": { frequency: 8.2, type: "numbers", label: "NUMBERS_STATION_8.2" },
  "meridian-dictaphone": { frequency: 3.1, type: "ghostly", label: "CAVERN_RESONANCE_3.1" },
  "bunker7-diagnostic": { frequency: 7.3, type: "terminal", label: "B7_DIAG_BUS_7.3" },
  "meridian-resonance": { frequency: 10.0, type: "radar", label: "DUGA_WOODPECKER_10.0" },
  "bunker7-final": { frequency: 7.9, type: "terminal", label: "B7_COMPROMISED_7.9" },
  "gila-baseball": { frequency: 6.0, type: "ghostly", label: "SONORAN_ECHO_6.0" },
  "teu-echo": { frequency: 6.6, type: "ghostly", label: "RADOME_SPHERE_6.6" },
};

export const SignalModal: React.FC<SignalModalProps> = ({ signal, onClose }) => {
  const { play, click } = useAudioStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(1.0); // Tuning slider from 1.0 to 10.0 Hz
  const [filterQ, setFilterQ] = useState(1.0); // Filter Q factor from 0.1 to 10.0
  const [inductiveGain, setInductiveGain] = useState(-6.0); // Inductive Gain from -12 to +12
  const [isLocked, setIsLocked] = useState(false);

  // Audio elements references for physical narration track playback
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Get active audio configuration or fallback
  const profile = useMemo(() => {
    return SIGNAL_SETTINGS[signal.id] || { frequency: 5.0, type: "ghostly", label: "UNKNOWN_CARRIER" };
  }, [signal.id]);

  const targetFrequency = profile.frequency;

  // 1. Wire useSignalModulator Hook (Map 1D frequency to 3D Dial space)
  // Map Frequency, Q-Bandwidth, and Gain directly into activeDials [8]
  const { start, stop, tuningAccuracy } = useSignalModulator({
    activeDials: { 
      a: frequency * 2, 
      b: filterQ * 2, 
      c: (inductiveGain + 12) 
    },
    targetDials: { 
      a: targetFrequency * 2, 
      b: 5.0 * 2, 
      c: 12.0 // Target is 0.0 dB (which corresponds to 12.0 offset)
    },
    isProcessing: false,
    isUnlocked: isLocked,
    baseStaticVolume: 0.15,
    baseCarrierVolume: 0.08,
  });

  // Track lock alignment criteria
  useEffect(() => {
    if (!isPlaying) return;

    // Multi-band Lock-on: Requires Frequency (Hz), Bandwidth (Q), and Inductive Gain (dB) aligned
    const freqMatch = Math.abs(frequency - targetFrequency) < 0.06;
    const qMatch = Math.abs(filterQ - 5.0) < 0.5;
    const gainMatch = Math.abs(inductiveGain - 0.0) < 1.0;
    const fullyAligned = freqMatch && qMatch && gainMatch;

    if (fullyAligned) {
      if (!isLocked) {
        setIsLocked(true);
        play("alert"); // Locked alert thud
      }
    } else {
      if (isLocked) {
        setIsLocked(false);
      }
    }
  }, [frequency, targetFrequency, isLocked, isPlaying, play]);

  // Hook lifecycle mount / play controls for synth
  useEffect(() => {
    if (isPlaying) {
      start();
    } else {
      stop();
    }
  }, [isPlaying, start, stop]);

  // Manage physical voiceover play-back once carrier is locked
  useEffect(() => {
    if (!signal.mediaUrl) return;

    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(signal.mediaUrl);
      audioPlayerRef.current.loop = signal.id === "numbers-station-7";
    }

    const player = audioPlayerRef.current;

    if (isPlaying && isLocked) {
      player.play().catch((err) => {
        console.warn("[Signal Audio] Voiceover playback blocked or failed:", err);
      });
    } else {
      player.pause();
    }

    return () => {
      player.pause();
    };
  }, [isPlaying, isLocked, signal.mediaUrl, signal.id]);

  // Ensure clean teardown on close
  useEffect(() => {
    return () => {
      stop();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, [stop]);

  const togglePlayback = () => {
    click();
    setIsPlaying((prev) => !prev);
  };

  // Canvas visual rendering oscillator
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = isLocked ? colors.archive.green : microform.halogen;
      ctx.lineWidth = 1.6;

      const t = Date.now() * 0.015;
      const count = canvas.width;

      for (let i = 0; i < count; i++) {
        const x = i;
        let y = canvas.height / 2;

        if (isPlaying) {
          if (isLocked) {
            // Decrypted cleanly: render highly distinctive waveforms depending on the locked resonance signal type
            switch (profile.type) {
              case "ghostly":
                // 1. Ghostly: Low-frequency infrasound wave with eerie micro-ripples
                y += Math.sin(i * 0.035 + t) * 16 + Math.sin(i * 0.3 - t * 2.5) * 2.5 * Math.sin(t * 0.12);
                break;
              case "terminal":
                // 2. Terminal: Square-wave digital steps with subtle high-speed logic jitters
                const square = Math.sign(Math.sin(i * 0.06 + t));
                const jitter = Math.random() > 0.985 ? (Math.random() - 0.5) * 6 : 0;
                y += square * 15 + jitter;
                break;
              case "numbers":
                // 3. Numbers: Heavily modulated Amplitude Modulation (AM) sideband envelope
                const envelope = Math.sin(i * 0.02 + t * 0.5) * 16;
                const carrier = Math.sin(i * 0.38 + t * 3.5);
                y += envelope * carrier;
                break;
              case "radar":
                // 4. Radar: Rhythmic sharp sawtooth transients mimicking the 10 Hz Duga woodpecker spikes
                const period = 35; // distance between clicks
                const phase = (i + t * 45) % period;
                y += phase < 3.2 ? -28 : 5; // A heavy downward electrostatic coil strike
                break;
              default:
                y += Math.sin(i * 0.05 + t) * 12 + Math.cos(i * 0.1 - t) * 4;
                break;
            }
          } else {
            // Tuned static: heavy erratic waves modulated by tuning distance
            const fDist = Math.abs(frequency - targetFrequency);
            const qDist = Math.abs(filterQ - 5.0);
            const gDist = Math.abs(inductiveGain - 0.0);
            
            // Saturation overload if gain is driven too high
            const gainDrive = inductiveGain > 6.0 ? (inductiveGain - 6.0) * 4 : 0;
            const staticLevel = (fDist * 12) + (qDist * 8) + (gDist * 2) + gainDrive;
            const noise = (Math.random() - 0.5) * staticLevel * 2;
            y += Math.sin(i * 0.1 * (11 - frequency) + t) * (15 / (staticLevel + 0.1)) + noise;
          }
        } else {
          // Off: flat, dead noise line
          y += (Math.random() - 0.5) * 0.6;
        }

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
      frameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, frequency, targetFrequency, isLocked, profile.type]);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(10, 8, 6, 0.92)" }}
        onClick={() => {
          stop();
          onClose();
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl border flex flex-col rounded-[2px]"
          style={{
            borderColor: colors.archive.grayDark,
            backgroundColor: colors.archive.black,
            boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
          }}
        >
          {/* Bezel Title Header */}
          <div
            className="flex items-center justify-between px-4 h-11 shrink-0"
            style={{
              background: `linear-gradient(180deg, ${microform.mahogany} 0%, ${microform.iron} 100%)`,
              borderBottom: `1px solid ${microform.iron}`,
            }}
          >
            <div className="flex items-center gap-3">
              <Radio size={14} className="animate-pulse" style={{ color: colors.archive.amber }} />
              <span
                style={{
                  color: microform.halogen,
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.xs,
                  letterSpacing: "0.12em",
                  textShadow: microform.halogenText,
                }}
              >
                TACTILE SIGNAL RECORDER // MOD-7B
              </span>
            </div>
            <button
              onClick={() => {
                stop();
                onClose();
              }}
              className="text-xs py-1 px-2 border transition-all hover:opacity-75"
              style={{
                borderColor: colors.archive.grayDark,
                color: colors.archive.gray,
                fontFamily: typography.mono,
              }}
            >
              × DISCONNECT
            </button>
          </div>

          {/* Modal Main Content Container */}
          <div className="p-6 flex flex-col gap-5 text-left font-mono text-xs">
            <div className="flex justify-between border-b pb-3" style={{ borderColor: colors.archive.grayDark }}>
              <div>
                <h3 className="text-sm font-bold" style={{ color: colors.archive.white }}>
                  {signal.title}
                </h3>
                <span className="text-[10px]" style={{ color: colors.archive.gray }}>
                  {signal.source} • {signal.length}
                </span>
              </div>
              <div className="text-right">
                <span style={{ color: isLocked ? colors.archive.green : colors.archive.red }} className="flex items-center gap-1.5 font-bold">
                  {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                  {isLocked ? "CARRIER LOCKED" : "UNRESOLVED STATIC"}
                </span>
                <span className="text-[10px]" style={{ color: colors.archive.gray }}>
                  {profile.label}
                </span>
              </div>
            </div>

            {/* Visual Oscilloscope Canvas Component */}
            <div className="relative h-28 bg-void border flex flex-col justify-between p-2" style={{ borderColor: colors.archive.grayDark }}>
              <span className="text-[9px] uppercase tracking-wider" style={{ color: colors.archive.gray }}>
                Interactive Spectrogram
              </span>
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
              <div className="z-10 flex justify-between items-baseline text-[9px] mt-auto" style={{ color: colors.archive.gray }}>
                <span>BAND: {isLocked ? "CLEAN" : "DIRTY DUST_WOBBLE"}</span>
                <span>CENTER: {profile.frequency}Hz</span>
              </div>
            </div>

            {/* Analog Complex Tuning Panel with multi-band sliders */}
            <div className="flex items-center gap-4 p-4 border rounded-[1px] bg-void" style={{ borderColor: colors.archive.grayDark }}>
              <button
                onClick={togglePlayback}
                className="w-12 h-12 flex items-center justify-center rounded-full border transition-transform active:scale-90 hover:bg-[#1a1815] shrink-0"
                style={{
                  borderColor: isPlaying ? colors.archive.green : colors.archive.amber,
                  color: isPlaying ? colors.archive.green : colors.archive.amber,
                }}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </button>

              <div className="flex-1 space-y-3">
                {/* 1. Frequency Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px]" style={{ color: colors.archive.gray }}>
                    <span>CARRIER RES_FREQUENCY SWEEP</span>
                    <span style={{ color: Math.abs(frequency - targetFrequency) < 0.06 ? colors.archive.green : microform.halogen }}>
                      {frequency.toFixed(2)} Hz
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.05"
                    value={frequency}
                    disabled={!isPlaying}
                    onChange={(e) => setFrequency(parseFloat(e.target.value))}
                    className="w-full h-1 bg-[#1a1a18] rounded-lg appearance-none cursor-pointer accent-[#ffaa55] disabled:opacity-30"
                  />
                </div>

                {/* 2. Bandwidth Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px]" style={{ color: colors.archive.gray }}>
                    <span>CARRIER FILTER BANDWIDTH (Q-FACTOR)</span>
                    <span style={{ color: Math.abs(filterQ - 5.0) < 0.5 ? colors.archive.green : microform.halogen }}>
                      {filterQ.toFixed(1)} Q
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="10.0"
                    step="0.1"
                    value={filterQ}
                    disabled={!isPlaying}
                    onChange={(e) => setFilterQ(parseFloat(e.target.value))}
                    className="w-full h-1 bg-[#1a1a18] rounded-lg appearance-none cursor-pointer accent-[#ffaa55] disabled:opacity-30"
                  />
                </div>

                {/* 3. Inductive Gain Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px]" style={{ color: colors.archive.gray }}>
                    <span>INDUCTIVE COIL TRANS-GAIN</span>
                    <span style={{ color: Math.abs(inductiveGain - 0.0) < 1.0 ? colors.archive.green : microform.halogen }}>
                      {inductiveGain > 0 ? "+" : ""}{inductiveGain.toFixed(1)} dB
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-12.0"
                    max="12.0"
                    step="0.5"
                    value={inductiveGain}
                    disabled={!isPlaying}
                    onChange={(e) => setInductiveGain(parseFloat(e.target.value))}
                    className="w-full h-1 bg-[#1a1a18] rounded-lg appearance-none cursor-pointer accent-[#ffaa55] disabled:opacity-30"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Signal Transcription (Shown ONLY once fully locked-on) */}
            <div className="flex-1 flex flex-col gap-2 p-4 border max-h-48 overflow-y-auto" style={{ borderColor: colors.archive.grayDark, backgroundColor: "rgba(5,4,3,0.5)" }}>
              <span className="text-[9px] tracking-wider uppercase border-b pb-1 mb-1 block" style={{ borderColor: colors.archive.grayDark, color: colors.archive.gray }}>
                Transmission Log Decrypt
              </span>
              {isLocked ? (
                <div className="space-y-1.5 overflow-y-auto">
                  {signal.transcript.map((line, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.4 }}
                      className="text-xs"
                      style={{
                        color: line.includes("INVESTIGATOR:") || line.includes("VANCE:") || line.includes("WOMAN:")
                          ? colors.archive.white
                          : line.includes("BUNKER_7:") || line.includes("VOICE:")
                          ? colors.archive.blueBright
                          : colors.archive.grayLight,
                        fontFamily: typography.mono,
                      }}
                    >
                      {line}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-1 opacity-50 py-4">
                  <Unlock size={16} className="text-stone-600" />
                  <span className="text-[10px] text-stone-500 uppercase tracking-widest text-center">
                    Align Frequency to {profile.frequency}Hz to unlock shortwave recording
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default SignalModal;
