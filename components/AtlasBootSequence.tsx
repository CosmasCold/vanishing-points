"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onComplete: () => void;
}

type BootPhase = "static" | "tuning" | "lock" | "clear";

export default function AtlasBootSequence({ onComplete }: Props) {
  const [phase, setPhase] = useState<BootPhase>("static");
  const [line, setLine] = useState("");
  const [subLine, setSubLine] = useState("");
  const [signalStrength, setSignalStrength] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const toneRef = useRef<OscillatorNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const startTime = useRef(Date.now());

  const getBootLines = useCallback((): { main: string; sub: string; duration: number } => {
    if (typeof window === "undefined") return { main: "Acquiring signal...", sub: "Stand by.", duration: 3000 };

    const dust = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
    const lastVisit = localStorage.getItem("vp-atlas-last-visit");
    const hoursAway = lastVisit ? Math.floor((Date.now() - parseInt(lastVisit)) / 3600000) : 0;
    const corruption = parseInt(localStorage.getItem("vp-corruption-stage") || "0", 10);
    const newPlaces = localStorage.getItem("vp-new-places-unseen") === "true";
    const echoesVisited = localStorage.getItem("vp-echoes-visited") === "true";

    // High corruption + absent long
    if (corruption >= 3 && hoursAway > 12) {
      return {
        main: "Signal contaminated. Reacquiring from memory.",
        sub: `You were gone for ${hoursAway} hours. The dust did not forget.`,
        duration: 4500,
      };
    }

    // High dust, returning to atlas
    if (dust > 60 && echoesVisited) {
      return {
        main: "Grid contact re-established.",
        sub: newPlaces 
          ? "The atlas has updated itself. New signals detected." 
          : "The grid holds. For now.",
        duration: 3500,
      };
    }

    // Long absence
    if (hoursAway > 24) {
      return {
        main: "Signal lost. Scanning previous frequency...",
        sub: `Last contact: ${hoursAway} hours ago. The static got loud.`,
        duration: 4000,
      };
    }

    // Medium absence
    if (hoursAway > 4) {
      return {
        main: "Re-establishing cartographic link...",
        sub: "The grid remembers intermittent witnesses.",
        duration: 3200,
      };
    }

    // First visit ever
    if (!lastVisit && !echoesVisited) {
      return {
        main: "Acquiring signal...",
        sub: "Every place you are about to see was abandoned. Someone documented them. That someone is gone.",
        duration: 5000,
      };
    }

    // Standard return
    return {
      main: "Tuning to grid frequency...",
      sub: echoesVisited 
        ? "BUNKER_7 terminal detected on auxiliary channel." 
        : "Anomalous signal detected at coordinates unknown.",
      duration: 2800,
    };
  }, []);

  // Initialize audio on first interaction (browser autoplay policy)
  const initAudio = useCallback(() => {
    if (ctxRef.current) return;
    const ctx = new AudioContext();
    ctxRef.current = ctx;

    // Static noise (pink noise approximation)
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = 0.08;
    noise.connect(gain);
    gain.connect(ctx.destination);
    noise.start();

    // Signal lock tone (detuned sine)
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 440;
    const toneGain = ctx.createGain();
    toneGain.gain.value = 0;
    osc.connect(toneGain);
    toneGain.connect(ctx.destination);
    osc.start();
    toneRef.current = osc;

    // Ramp down static, ramp up tone
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      toneGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 1);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 2);
    }, 800);

    // Stop everything
    setTimeout(() => {
      toneGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
      setTimeout(() => {
        noise.stop();
        osc.stop();
        ctx.close();
      }, 1200);
    }, 2500);
  }, []);

  useEffect(() => {
    const { main, sub, duration } = getBootLines();
    setLine(main);
    setSubLine(sub);

    // Record visit timestamp for next boot
    localStorage.setItem("vp-atlas-last-visit", String(Date.now()));

    // Phase timing
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setPhase("tuning"), 400));
    timers.push(setTimeout(() => setPhase("lock"), 1200));
    timers.push(setTimeout(() => setPhase("clear"), duration - 600));
    timers.push(setTimeout(() => {
      if (!skipped) onComplete();
    }, duration));

    // Signal strength animation
    let frame: number;
    const animateSignal = () => {
      setSignalStrength((prev) => {
        if (prev >= 100) return 100;
        const jitter = Math.random() * 15 - 7;
        return Math.min(100, prev + 2 + jitter);
      });
      frame = requestAnimationFrame(animateSignal);
    };
    frame = requestAnimationFrame(animateSignal);

    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(frame);
    };
  }, [getBootLines, onComplete, skipped]);

  const handleSkip = () => {
    setSkipped(true);
    if (ctxRef.current) {
      ctxRef.current.close();
    }
    onComplete();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center cursor-pointer"
      style={{ background: "#050403" }}
      onClick={handleSkip}
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === "clear" ? 0 : 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* CRT scanlines */}
      <div
        className="pointer-events-none fixed inset-0 z-[201]"
        style={{
          background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)",
          backgroundSize: "100% 4px",
        }}
      />

      {/* Vignette */}
      <div
        className="pointer-events-none fixed inset-0 z-[201]"
        style={{
          background: "radial-gradient(circle at 50% 50%, transparent 40%, rgba(5,4,3,0.8) 100%)",
        }}
      />

      {/* Static flash during phase 1 */}
      <AnimatePresence>
        {phase === "static" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0.1, 0.4, 0] }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[202]"
            style={{ background: "rgba(200,200,200,0.08)" }}
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-[203] text-center max-w-lg px-6 space-y-6">
        {/* Signal strength bars */}
        <div className="flex items-end justify-center gap-1 h-12 mb-4">
          {[20, 40, 60, 80, 100].map((threshold) => (
            <motion.div
              key={threshold}
              className="w-1.5 rounded-t"
              style={{
                background: signalStrength >= threshold ? "#9a8a72" : "rgba(90,78,66,0.2)",
                height: `${threshold * 0.5}px`,
              }}
              animate={{
                background: signalStrength >= threshold 
                  ? ["#9a8a72", "#c4785a", "#9a8a72"] 
                  : "rgba(90,78,66,0.2)",
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        {/* Main line */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1
            className="font-mono text-sm md:text-base tracking-[0.25em] uppercase"
            style={{ color: "#ddd0bc", textShadow: "0 0 12px rgba(221,208,188,0.15)" }}
          >
            {line}
          </h1>
        </motion.div>

        {/* Sub line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <p
            className="font-mono text-[11px] md:text-xs tracking-wider uppercase leading-relaxed"
            style={{ color: "#7a6e5e", textShadow: "0 0 8px rgba(122,107,82,0.1)" }}
          >
            {subLine}
          </p>
        </motion.div>

        {/* Progress / skip hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1.5 }}
          className="pt-8"
        >
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase" style={{ color: "#5a4e42" }}>
            Click anywhere to skip acquisition
          </p>
        </motion.div>
      </div>

      {/* Bottom status */}
      <div className="absolute bottom-8 left-0 right-0 z-[203] text-center">
        <p className="font-mono text-[9px] tracking-[0.4em] uppercase opacity-20" style={{ color: "#9a8a72" }}>
          {phase === "static" && "STATIC"}
          {phase === "tuning" && "TUNING"}
          {phase === "lock" && "SIGNAL LOCKED"}
          {phase === "clear" && "GRID CONTACT"}
        </p>
      </div>
    </motion.div>
  );
}