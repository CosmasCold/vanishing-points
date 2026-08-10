"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Howl } from "howler";
import { useBootStore } from "@/state/bootStore";
import { useUIStore } from "@/state/uiStore";

/* ═══════════════════════════════════════════════════════════════
   AUDIO PATHS
   ═══════════════════════════════════════════════════════════════ */
const AUDIO_PATHS = {
  powerClick: "/audio/boot/power_click.mp3",
  crtWarmup: "/audio/boot/crt_warmup.wav",
  roomTone: "/audio/boot/room_tone.mp3",
  rain: "/audio/boot/rain.mp3",
};

/* ═══════════════════════════════════════════════════════════════
   BOOT TEXT DATA
   ═══════════════════════════════════════════════════════════════ */
const BOOT_LINES = [
  { text: "POWER RESTORED", color: "#6a9a5a" },
  { text: "Loading Archive Kernel...", color: "#8a6000" },
  { text: "Initializing Atlas...", color: "#8a6000" },
  { text: "Checking Integrity...", color: "#8a6000" },
  { text: "Loading Investigations...", color: "#8a6000" },
  { text: "Synchronizing Evidence...", color: "#8a6000" },
  { text: "Loading Local Cache...", color: "#8a6000" },
  { text: "4,211 days since last session", color: "#a85d5d" },
  { text: "Dust Index: Stable", color: "#6a9a5a" },
  { text: "Good evening, Investigator.", color: "#e8e0d0" },
];

const LOADING_STEPS = [
  "> Initializing Archive kernel...",
  "> Mounting asset volumes...",
  "> Verifying geometry integrity...",
  "> Loading texture banks...",
  "> Synchronizing scene graph...",
  "> Calibrating render pipeline...",
];

/* ═══════════════════════════════════════════════════════════════
   DUST PARTICLES (Canvas 2D)
   ═══════════════════════════════════════════════════════════════ */
function DustCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: { x: number; y: number; r: number; vx: number; vy: number; alpha: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -Math.random() * 0.15 - 0.05,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(201, 169, 110, 0.15)";
      
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }
        if (p.x < 0 || p.x > width) p.vx = -p.vx;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 169, 110, ${p.alpha})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-30" style={{ mixBlendMode: "screen" }} />
  );
}

/* ═══════════════════════════════════════════════════════════════
   LOADING SCREEN
   ═══════════════════════════════════════════════════════════════ */
function LoadingScreen({ progress }: { progress: number }) {
  const visibleSteps = Math.min(
    Math.floor((progress / 100) * LOADING_STEPS.length) + 1,
    LOADING_STEPS.length
  );

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#070503]">
      <div className="font-mono text-sm tracking-widest" style={{ color: "#8a6000", width: "380px", lineHeight: "1.8" }}>
        <div className="mb-4 text-xs tracking-[3px]" style={{ color: "#ffb000" }}>
          ARCHIVE TERMINAL
        </div>
        <div className="mb-4 h-px w-full" style={{ background: "#2a2520" }} />
        {LOADING_STEPS.slice(0, visibleSteps).map((step, i) => (
          <div key={i} style={{ opacity: i === visibleSteps - 1 ? 0.7 : 1 }}>
            {step} <span className="ml-3" style={{ color: "#6a9a5a" }}> [OK] </span>
          </div>
        ))}
        <div className="mt-5">
          <div className="h-0.5 w-full" style={{ background: "#1a1815" }}>
            <motion.div
              className="h-full"
              style={{ background: "#ffb000", boxShadow: "0 0 6px rgba(255,176,0,0.3)" }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="mt-2 text-right text-[10px] opacity-50">{Math.round(progress)}%</div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN SEQUENCE EXPORT
   ═══════════════════════════════════════════════════════════════ */
type BootPhase = "idle" | "degauss" | "loading" | "booting" | "exiting";

export function BootSequence({ onPowerOn }: { onPowerOn?: () => void }) {
  const markComplete = useBootStore((s) => s.markComplete);
  const setBooted = useUIStore((s) => s.setBooted);

  const [phase, setPhase] = useState<BootPhase>("idle");
  const [loadProgress, setLoadProgress] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const [cursorOn, setCursorOn] = useState(true);

  // ── CRT Degauss Visual Physics State ──
  const [degaussIntensity, setDegaussIntensity] = useState(0);
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });

  const audioRef = useRef<{
    powerClick: Howl | null;
    crtWarmup: Howl | null;
    roomTone: Howl | null;
    rain: Howl | null;
  }>({
    powerClick: null,
    crtWarmup: null,
    roomTone: null,
    rain: null,
  });

  const timersRef = useRef<any[]>([]);
  const cursorIntervalRef = useRef<any>(null);
  const degaussFrameId = useRef<number | null>(null);

  // Initialize howler sounds safely on client-side mount
  useEffect(() => {
    audioRef.current = {
      powerClick: new Howl({ src: [AUDIO_PATHS.powerClick], volume: 0.8 }),
      crtWarmup: new Howl({ src: [AUDIO_PATHS.crtWarmup], volume: 0.5, loop: true }),
      roomTone: new Howl({ src: [AUDIO_PATHS.roomTone], volume: 0.3, loop: true }),
      rain: new Howl({ src: [AUDIO_PATHS.rain], volume: 0.25, loop: true }),
    };

    return () => {
      Object.values(audioRef.current).forEach((sound) => sound?.stop());
    };
  }, []);

  // ── Procedural Web Audio Degauss Synthesizer ──
  const playDegaussSound = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      // 1. Master Output Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0, now);
      masterGain.gain.linearRampToValueAtTime(0.85, now + 0.02); // Sharp surge
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6); // 1.6s decay
      masterGain.connect(ctx.destination);

      // 2. High-Voltage Spark Relay Clack
      const bufferSize = 0.015 * ctx.sampleRate; // 15ms duration
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;

      const hpFilter = ctx.createBiquadFilter();
      hpFilter.type = "highpass";
      hpFilter.frequency.setValueAtTime(2500, now);

      noiseNode.connect(hpFilter);
      hpFilter.connect(masterGain);
      noiseNode.start(now);

      // Triangle pressure clack
      const clackOsc = ctx.createOscillator();
      clackOsc.type = "triangle";
      clackOsc.frequency.setValueAtTime(110, now);
      clackOsc.frequency.exponentialRampToValueAtTime(25, now + 0.1);
      const clackGain = ctx.createGain();
      clackGain.gain.setValueAtTime(0.9, now);
      clackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      clackOsc.connect(clackGain);
      clackGain.connect(masterGain);
      clackOsc.start(now);
      clackOsc.stop(now + 0.1);

      // 3. Magnetic Coil Discharge (Swept Sub-Bass Sine)
      const sineOsc = ctx.createOscillator();
      sineOsc.type = "sine";
      sineOsc.frequency.setValueAtTime(120, now); // Warm hum frequency
      sineOsc.frequency.exponentialRampToValueAtTime(18, now + 1.1); // Sweeps deep down

      const sineGain = ctx.createGain();
      sineGain.gain.setValueAtTime(0.7, now);
      sineGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

      sineOsc.connect(sineGain);
      sineGain.connect(masterGain);
      sineOsc.start(now);
      sineOsc.stop(now + 1.2);

      // 4. Electromagnetic Coil Jitter (60Hz Line Buzz)
      const buzzOsc = ctx.createOscillator();
      buzzOsc.type = "sawtooth";
      buzzOsc.frequency.setValueAtTime(60, now);

      const buzzFilter = ctx.createBiquadFilter();
      buzzFilter.type = "lowpass";
      buzzFilter.frequency.setValueAtTime(180, now); // Muffle high harsh harmonics

      const buzzGain = ctx.createGain();
      buzzGain.gain.setValueAtTime(0.35, now);
      buzzGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65); // Swiftly decays as coil settles

      buzzOsc.connect(buzzFilter);
      buzzFilter.connect(buzzGain);
      buzzGain.connect(masterGain);
      buzzOsc.start(now);
      buzzOsc.stop(now + 0.7);

      // Clean context teardown
      setTimeout(() => {
        ctx.close();
      }, 2000);
    } catch (e) {
      console.warn("[Degauss Web Audio fallback failed]", e);
    }
  }, []);

  // ── CRT Degauss Visual Tick Loop ──
  const startDegaussVisualTick = useCallback(() => {
    let startTimestamp: number | null = null;
    const duration = 1500; // 1.5 seconds

    const tick = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = elapsed / duration;

      if (progress >= 1.0) {
        setDegaussIntensity(0);
        setShakeOffset({ x: 0, y: 0 });
        setPhase("loading"); // Complete degauss -> advance to loading progress bar!
        return;
      }

      // Exponential decay of degaussing magnet energy
      const intensity = Math.exp(-progress * 4.2);
      setDegaussIntensity(intensity);

      // High-frequency shiver shake logic
      const shakeX = (Math.random() - 0.5) * intensity * 15;
      const shakeY = (Math.random() - 0.5) * intensity * 15;
      setShakeOffset({ x: shakeX, y: shakeY });

      degaussFrameId.current = requestAnimationFrame(tick);
    };

    degaussFrameId.current = requestAnimationFrame(tick);
  }, []);

  // Simulating the loading progress bar
  useEffect(() => {
    if (phase !== "loading") return;
    const interval = setInterval(() => {
      setLoadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setPhase("booting");
          return 100;
        }
        return prev + 2.0;
      });
    }, 45);
    return () => clearInterval(interval);
  }, [phase]);

  // Handle line typing delays
  useEffect(() => {
    if (phase !== "booting") return;

    const a = audioRef.current;
    a.crtWarmup?.play();
    a.roomTone?.play();
    a.rain?.play();

    const playLines = (index: number) => {
      if (index >= BOOT_LINES.length) {
        setShowPrompt(true);
        return;
      }
      setVisibleCount(index + 1);
      const timer = setTimeout(() => {
        playLines(index + 1);
      }, 350 + Math.random() * 220);
      timersRef.current.push(timer);
    };

    playLines(0);

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, [phase]);

  // Cursor blink
  useEffect(() => {
    cursorIntervalRef.current = setInterval(() => setCursorOn((p) => !p), 530);
    return () => {
      if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current);
    };
  }, []);

  // Click to start
  const handleStart = useCallback(() => {
    if (phase !== "idle") return;
    
    // 1. Play clack sound
    audioRef.current.powerClick?.play();
    if (onPowerOn) onPowerOn();

    // 2. Play massive procedural degauss surge
    playDegaussSound();

    // 3. Engage visual shake + convergence splits
    setPhase("degauss");
    startDegaussVisualTick();
  }, [phase, onPowerOn, playDegaussSound, startDegaussVisualTick]);

  // Keyboard navigation bypass / complete
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (phase === "booting" && !showPrompt && e.key !== "Enter") {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
        setVisibleCount(BOOT_LINES.length);
        setShowPrompt(true);
        return;
      }
      if (phase === "booting" && e.key === "Enter" && showPrompt) {
        setPhase("exiting");
        const a = audioRef.current;
        a.roomTone?.fade(a.roomTone.volume(), 0, 2200);
        a.rain?.fade(a.rain.volume(), 0, 2200);
        a.crtWarmup?.fade(a.crtWarmup.volume(), 0, 2200);
        setTimeout(() => {
          markComplete();
          setBooted(true);
        }, 2500);
      }
    },
    [phase, showPrompt, markComplete, setBooted]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Clean animation frame on unmount
  useEffect(() => {
    return () => {
      if (degaussFrameId.current) cancelAnimationFrame(degaussFrameId.current);
    };
  }, []);

  if (phase === "idle") {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center"
        style={{ background: "#0a0908" }}
        onClick={handleStart}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      >
        <div className="text-center font-mono text-xs tracking-[3px]" style={{ color: "#ffb000", userSelect: "none" }}>
          <motion.div animate={{ opacity: [0.35, 1, 0.35] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}>
            [ CLICK TO INITIALIZE ]
          </motion.div>
          <div className="mt-6 text-[10px] tracking-wider" style={{ color: "#5a4a30" }}>
            VANISHING POINTS ARCHIVE — SYSTEM 7-B
          </div>
        </div>
      </motion.div>
    );
  }

  // Visual Chromatic convergence shift values driven directly by live Degauss loop!
  const chromaticSeparation = degaussIntensity * 18;

  return (
    <AnimatePresence>
      {phase !== "exiting" && (
        <motion.div
          key="boot"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          style={{ 
            background: "#0a0908",
            // Apply physical coordinate shakes directly to viewport matrix!
            transform: `translate(${shakeOffset.x}px, ${shakeOffset.y}px)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        >
          {/* Static room background frame (Photographic rendering) */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-[4000ms] ease-in-out"
            style={{
              backgroundImage: "url(/images/boot-room-render.png)",
              // Scales down slightly as degauss activates (represents desk receding)
              transform: phase === "degauss" ? "scale(0.95)" : "scale(1.0)",
              filter: `brightness(${0.22 + (phase === "degauss" ? (1 - degaussIntensity) * 0.28 : 0.0)}) contrast(1.15) sepia(0.08)`,
              transition: "transform 1500ms cubic-bezier(0.1, 0.8, 0.2, 1), filter 1500ms ease",
            }}
          />

          {/* Degauss Electromagnetic White Discharge screen flash overlay */}
          {phase === "degauss" && (
            <div 
              className="absolute inset-0 z-40 bg-white pointer-events-none"
              style={{
                opacity: degaussIntensity * 0.95, // Bright instant flare fading exponentially
              }}
            />
          )}

          {/* Core overlay effects: Dust & CRT scanline convergence grid */}
          <DustCanvas />

          {/* Main system screen component */}
          <div className="relative z-10 w-full max-w-lg scale-90 md:scale-100">
            {phase === "degauss" || phase === "loading" ? (
              <div 
                className="w-[480px] h-[360px] flex items-center justify-center border bg-[#050403] rounded-[2px] shadow-2xl relative"
                style={{
                  borderColor: "#1a1612",
                  // Visual color splitting text shadow convergence errors [28]
                  textShadow: `${chromaticSeparation}px 0px 0px rgba(255, 0, 0, 0.35), ${-chromaticSeparation}px 0px 0px rgba(0, 255, 255, 0.35)`,
                }}
              >
                {phase === "loading" ? (
                  <LoadingScreen progress={loadProgress} />
                ) : (
                  <div className="text-center font-mono text-[10px] uppercase tracking-widest text-[#8a6000] animate-pulse">
                    Magnetic Calibration Active...
                  </div>
                )}
              </div>
            ) : (
              <CRTScreenText
                visibleCount={visibleCount}
                showPrompt={showPrompt}
                cursorOn={cursorOn}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUBCOMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function CRTScreenText({
  visibleCount,
  showPrompt,
  cursorOn,
}: {
  visibleCount: number;
  showPrompt: boolean;
  cursorOn: boolean;
}) {
  return (
    <div
      style={{
        width: "480px",
        height: "360px",
        pointerEvents: "none",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: "13px",
        lineHeight: "1.7",
        color: "#ffb000",
        textShadow: "0 0 6px rgba(255,176,0,0.5), 0 0 14px rgba(255,176,0,0.15)",
        whiteSpace: "pre-wrap",
        userSelect: "none",
        background: "rgba(8,6,3,0.92)",
        padding: "28px",
        borderRadius: "2px",
        boxShadow: "inset 0 0 50px rgba(0,0,0,0.9)",
        border: "1px solid #2a2520",
      }}
    >
      {BOOT_LINES.slice(0, visibleCount).map((line, i) => (
        <div
          key={i}
          style={{
            color: line.color,
            marginBottom: "5px",
            opacity: 0,
            animation: "phosphorIn 70ms ease forwards",
            animationDelay: `${i * 40}ms`,
          }}
        >
          {line.text}
          {i === visibleCount - 1 && cursorOn && (
            <span
              style={{
                display: "inline-block",
                width: "7px",
                height: "13px",
                background: line.color,
                marginLeft: "4px",
                verticalAlign: "middle",
              }}
            />
          )}
        </div>
      ))}
      {showPrompt && (
        <div
          style={{
            marginTop: "18px",
            color: "#ffb000",
            fontSize: "11px",
            letterSpacing: "2.5px",
            textAlign: "center",
            animation: "pulsePrompt 2.2s ease-in-out infinite",
          }}
        >
          [ PRESS ENTER TO BOOT ]
        </div>
      )}
      <style>{`
        @keyframes phosphorIn {
          from { opacity: 0; transform: translateX(3px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulsePrompt {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
