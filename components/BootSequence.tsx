"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Howl } from "howler";
import { useBootStore } from "@/state/bootStore";
import { useUIStore } from "@/state/uiStore";

/* ═══════════════════════════════════════════════════════════════ AUDIO PATHS ═══════════════════════════════════════════════════════════════ */
const AUDIO_PATHS = {
  powerClick: "/audio/boot/power_click.mp3",
  crtWarmup: "/audio/boot/crt_warmup.wav",
  roomTone: "/audio/boot/room_tone.mp3",
  rain: "/audio/boot/rain.mp3",
};

/* ═══════════════════════════════════════════════════════════════ BOOT TEXT DATA ═══════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════ DUST PARTICLES (Canvas 2D) ═══════════════════════════════════════════════════════════════ */
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
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: Array<{ x: number; y: number; vx: number; vy: number; r: number; alpha: number }> = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2 - 0.05,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = height;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 176, 0, ${p.alpha})`;
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-30" style={{ mixBlendMode: "screen" }} />
  );
}

/* ═══════════════════════════════════════════════════════════════ LOADING SCREEN ═══════════════════════════════════════════════════════════════ */
function LoadingScreen({ progress }: { progress: number }) {
  const visibleSteps = Math.min(
    Math.floor((progress / 100) * LOADING_STEPS.length) + 1,
    LOADING_STEPS.length
  );

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="font-mono text-sm tracking-widest" style={{ color: "#8a6000", width: "380px", lineHeight: "1.8" }} >
        <div className="mb-4 text-xs tracking-[3px]" style={{ color: "#ffb000" }}> ARCHIVE TERMINAL </div>
        <div className="mb-4 h-px w-full" style={{ background: "#2a2520" }} />
        {LOADING_STEPS.slice(0, visibleSteps).map((step, i) => (
          <div key={i} style={{ opacity: i === visibleSteps - 1 ? 0.7 : 1 }}>
            {step} <span className="ml-3" style={{ color: "#6a9a5a" }}> [OK] </span>
          </div>
        ))}
        <div className="mt-5">
          <div className="h-0.5 w-full" style={{ background: "#1a1815" }}>
            <motion.div className="h-full" style={{ background: "#ffb000", boxShadow: "0 0 6px rgba(255,176,0,0.3)" }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>
          <div className="mt-2 text-right text-[10px] opacity-50"> {Math.round(progress)}% </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ MAIN COMPONENT ═══════════════════════════════════════════════════════════════ */
type BootPhase = "idle" | "loading" | "booting" | "exiting";

export function BootSequence({ onPowerOn }: { onPowerOn?: () => void }) {
  const markComplete = useBootStore((s) => s.markComplete);
  const setBooted = useUIStore((s) => s.setBooted);

  const [phase, setPhase] = useState<BootPhase>("idle");
  const [loadProgress, setLoadProgress] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const [cursorOn, setCursorOn] = useState(true);

  const audioRef = useRef<{
    powerClick: Howl | null;
    crtWarmup: Howl | null;
    roomTone: Howl | null;
    rain: Howl | null;
  }>({ powerClick: null, crtWarmup: null, roomTone: null, rain: null });

  const timersRef = useRef<any[]>([]);
  const cursorIntervalRef = useRef<any>(null);

  // Initialize howler sounds safely on client-side mount
  useEffect(() => {
    audioRef.current = {
      powerClick: new Howl({ src: [AUDIO_PATHS.powerClick], volume: 0.8 }),
      crtWarmup: new Howl({ src: [AUDIO_PATHS.crtWarmup], volume: 0.5, loop: true }),
      roomTone: new Howl({ src: [AUDIO_PATHS.roomTone], volume: 0.3, loop: true }),
      rain: new Howl({ src: [AUDIO_PATHS.rain], volume: 0.25, loop: true }),
    };

    return () => {
      const a = audioRef.current;
      a.powerClick?.unload();
      a.crtWarmup?.unload();
      a.roomTone?.unload();
      a.rain?.unload();
    };
  }, []);

  // Simulating the loading progress bar
  useEffect(() => {
    if (phase !== "loading") return;

    const interval = setInterval(() => {
      setLoadProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setPhase("booting");
          return 100;
        }
        return p + Math.random() * 12 + 4;
      });
    }, 280);

    return () => clearInterval(interval);
  }, [phase]);

  // Handle line typing delays
  useEffect(() => {
    if (phase !== "booting") return;

    audioRef.current.powerClick?.play();
    audioRef.current.crtWarmup?.play();

    BOOT_LINES.forEach((_, i) => {
      const t = setTimeout(() => {
        setVisibleCount(i + 1);
        if (i === BOOT_LINES.length - 1) {
          setShowPrompt(true);
        }
      }, (i + 1) * 600);
      timersRef.current.push(t);
    });

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
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

    // Trigger procedural analog synth & monitor whine click if passed down
    if (onPowerOn) onPowerOn();

    const a = audioRef.current;
    a.roomTone?.play();
    a.rain?.play();
    setPhase("loading");
  }, [phase, onPowerOn]);

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

  if (phase === "idle") {
    return (
      <motion.div className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center" style={{ background: "#0a0908" }} onClick={handleStart} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }} >
        <div className="text-center font-mono text-xs tracking-[3px]" style={{ color: "#ffb000", userSelect: "none" }}>
          <motion.div animate={{ opacity: [0.35, 1, 0.35] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}> [ CLICK TO INITIALIZE ] </motion.div>
          <div className="mt-6 text-[10px] tracking-wider" style={{ color: "#5a4a30" }}> VANISHING POINTS ARCHIVE — SYSTEM 7-B </div>
        </div>
      </motion.div>
    );
  }

  if (phase === "loading") {
    return (
      <motion.div className="fixed inset-0 z-50" style={{ background: "#0a0908" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} >
        <LoadingScreen progress={loadProgress} />
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      {phase !== "exiting" && (
        <motion.div key="boot" className="fixed inset-0 z-50" style={{ background: "#0a0908" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2.5, ease: "easeInOut" }} >
          {/* Background render fallback static image choice */}
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url(/images/boot-room-render.png)" }} />

          {/* Foreground text logs overlay */}
          <div className="absolute top-1/2 left-1/2 h-[360px] w-[480px] -translate-x-1/2 -translate-y-[195px] p-[28px] font-mono text-sm leading-[1.7] select-none" style={{ color: "#ffb000", textShadow: "0 0 6px rgba(255,176,0,0.5), 0 0 14px rgba(255,176,0,0.15)", whiteSpace: "pre-wrap" }}>
            <div className="absolute inset-0" style={{ background: "rgba(8,6,3,0.85)", boxShadow: "inset 0 0 50px rgba(0,0,0,0.95)", borderRadius: "2px" }} />
            <div className="relative z-10">
              {BOOT_LINES.slice(0, visibleCount).map((line, i) => (
                <div key={i} style={{ color: line.color, marginBottom: "5px" }}>
                  {line.text}
                  {i === visibleCount - 1 && cursorOn && (
                    <span className="ml-1 inline-block h-3 w-1.5 align-middle" style={{ background: line.color }} />
                  )}
                </div>
              ))}
              {showPrompt && (
                <div className="mt-6 text-center text-xs tracking-[2.5px] animate-pulse" style={{ color: "#ffb000" }}>
                  [ PRESS ENTER ]
                </div>
              )}
            </div>
          </div>

          <DustCanvas />
        </motion.div>
      )}
    </AnimatePresence>
  );
}