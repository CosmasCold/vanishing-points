"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, X } from "lucide-react";
import { NUMBERS_STATIONS } from "@/lib/echoesContent";

export default function NumbersStation() {
  const [open, setOpen] = useState(false);
  const [freq, setFreq] = useState(88.0);
  const [signal, setSignal] = useState<string | null>(null);
  const [strength, setStrength] = useState(0);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{
    noise: GainNode;
    tone: GainNode;
    filter: BiquadFilterNode;
    toneOsc: OscillatorNode;
  } | null>(null);

  // Load unlocked codes
  useEffect(() => {
    const raw = localStorage.getItem("bunker-codes");
    if (raw) setUnlocked(JSON.parse(raw));
  }, []);

  // Init Web Audio static
  useEffect(() => {
    if (!open) return;
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const noiseGain = ctx.createGain();
    const toneGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const master = ctx.createGain();

    filter.type = "bandpass";
    filter.frequency.value = 1000;
    filter.Q.value = 1;

    // White noise buffer
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(master);

    // Tone oscillator (the "signal")
    const toneOsc = ctx.createOscillator();
    toneOsc.type = "sine";
    toneOsc.frequency.value = 440;
    toneOsc.connect(toneGain);
    toneGain.connect(master);

    master.gain.value = 0.08;
    master.connect(ctx.destination);

    noise.start();
    toneOsc.start();

    nodesRef.current = { noise: noiseGain, tone: toneGain, filter, toneOsc };

    return () => {
      noise.stop();
      toneOsc.stop();
      ctx.close();
      audioCtxRef.current = null;
    };
  }, [open]);

  // Tune logic
  useEffect(() => {
    if (!nodesRef.current) return;
    const { noise, tone, filter, toneOsc } = nodesRef.current;

    let bestDist = Infinity;
    let bestStation: (typeof NUMBERS_STATIONS)[0] | null = null;

    for (const station of NUMBERS_STATIONS) {
      const d = Math.abs(freq - station.freq);
      if (d < bestDist) {
        bestDist = d;
        bestStation = station;
      }
    }

    const clampedDist = Math.min(bestDist, 2.0);
    const str = Math.max(0, 1 - clampedDist / 0.6);

    setStrength(str);
    setSignal(str > 0.7 ? bestStation!.text : null);

    noise.gain.value = 0.15 * (1 - str * 0.9);
    tone.gain.value = 0.08 * str;
    if (bestStation) {
      toneOsc.frequency.value = 200 + bestStation.freq * 3;
      filter.frequency.value = 500 + bestStation.freq * 8;
    }

    if (str > 0.85 && bestStation?.code && !unlocked.includes(bestStation.code)) {
      const next = [...unlocked, bestStation.code];
      setUnlocked(next);
      localStorage.setItem("bunker-codes", JSON.stringify(next));
    }
  }, [freq, unlocked]);

  const dialMarks = useMemo(() => {
    const marks: number[] = [];
    for (let f = 88; f <= 108; f += 2) {
      marks.push(f);
    }
    return marks;
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-32 left-6 z-40 flex items-center gap-2 px-3 py-2 bg-[#252018]/80 backdrop-blur-sm border border-[rgba(122,107,82,0.25)] rounded-lg text-[10px] font-mono uppercase tracking-wider text-[#9a8a72] hover:text-[#ddd0bc] hover:border-[#9a8a72] transition-all shadow-lg"
        title="Numbers Station"
      >
        <Radio size={12} />
        <span className="hidden sm:inline">Signal</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-48 left-6 z-40 w-72 bg-[#050a05]/95 border border-[#33ff00]/30 rounded-lg p-4 shadow-[0_0_30px_rgba(51,255,0,0.1)] backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#33ff00]/70">
                Numbers Station
              </span>
              <button onClick={() => setOpen(false)} className="text-[#33ff00]/50 hover:text-[#33ff00]">
                <X size={12} />
              </button>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between text-[9px] font-mono text-[#33ff00]/40 mb-1">
                <span>88.0 MHz</span>
                <span>{freq.toFixed(1)} MHz</span>
                <span>108.0 MHz</span>
              </div>
              <input
                type="range"
                min={88}
                max={108}
                step={0.1}
                value={freq}
                onChange={(e) => setFreq(parseFloat(e.target.value))}
                className="w-full h-1 bg-[#33ff00]/20 rounded-lg appearance-none cursor-pointer accent-[#33ff00]"
              />
              <div className="flex justify-between mt-1">
                {dialMarks.map((m) => (
                  <div
                    key={m}
                    className={`w-px h-1 ${Math.abs(freq - m) < 0.5 ? "bg-[#33ff00]" : "bg-[#33ff00]/20"}`}
                  />
                ))}
              </div>
            </div>

            {/* Signal strength */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] font-mono text-[#33ff00]/40 uppercase">Signal</span>
              <div className="flex-1 h-1.5 bg-[#33ff00]/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#33ff00] transition-all duration-300"
                  style={{ width: `${strength * 100}%`, opacity: strength > 0.3 ? 1 : 0.3 }}
                />
              </div>
            </div>

            {/* Transcript */}
            <div className="min-h-[3rem] p-2 bg-[#0a0f0a] border border-[#33ff00]/10 rounded text-[11px] font-mono text-[#33ff00]/80 leading-relaxed">
              {signal ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={signal}
                >
                  {signal}
                </motion.span>
              ) : (
                <span className="text-[#33ff00]/20 italic">
                  {strength > 0.2 ? "[weak signal...]" : "[static]"}
                </span>
              )}
            </div>

            {unlocked.length > 0 && (
              <div className="mt-3 pt-2 border-t border-[#33ff00]/10">
                <p className="text-[9px] font-mono text-[#33ff00]/40 uppercase mb-1">Codes Decrypted</p>
                <div className="flex flex-wrap gap-1">
                  {unlocked.map((c) => (
                    <span key={c} className="px-1.5 py-0.5 bg-[#33ff00]/10 border border-[#33ff00]/20 rounded text-[9px] font-mono text-[#33ff00]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}