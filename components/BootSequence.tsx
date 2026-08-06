"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  relayClick: "/audio/boot/relay_click.wav",
  roomTone: "/audio/boot/room_tone.mp3",
  rain: "/audio/boot/rain.mp3",
};

/* ═══════════════════════════════════════════════════════════════
   MONITOR SCREEN POSITION — Tweak these if text is misaligned
   ═══════════════════════════════════════════════════════════════ */
const MONITOR_SCREEN = {
  left: "56%",
  top: "42%",
  width: "340px",
  height: "260px",
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

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: Math.random() * -0.15 - 0.05,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.25 + 0.05,
      phase: Math.random() * Math.PI * 2,
    }));

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = Date.now() * 0.001;

      particles.forEach((p) => {
        p.x += p.vx + Math.sin(t + p.phase) * 0.1;
        p.y += p.vy;
        if (p.y < -5) p.y = canvas.height + 5;
        if (p.x < -5) p.x = canvas.width + 5;
        if (p.x > canvas.width + 5) p.x = -5;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 197, 169, ${p.opacity})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-30"
      style={{ mixBlendMode: "screen" }}
    />
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
    <div className="flex h-full w-full items-center justify-center">
      <div
        className="font-mono text-sm tracking-widest"
        style={{ color: "#8a6000", width: "380px", lineHeight: "1.8" }}
      >
        <div className="mb-4 text-xs tracking-[3px]" style={{ color: "#ffb000" }}>
          ARCHIVE TERMINAL
        </div>
        <div className="mb-4 h-px w-full" style={{ background: "#2a2520" }} />
        {LOADING_STEPS.slice(0, visibleSteps).map((step, i) => (
          <div key={i} style={{ opacity: i === visibleSteps - 1 ? 0.7 : 1 }}>
            {step}
            <span className="ml-3" style={{ color: "#6a9a5a" }}>
              [OK]
            </span>
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
          <div className="mt-2 text-right text-[10px] opacity-50">
            {Math.round(progress)}%
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CRT TEXT OVERLAY
   ═══════════════════════════════════════════════════════════════ */
function CRTTextOverlay({
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
      className="pointer-events-none absolute z-20 font-mono text-[11px] leading-relaxed"
      style={{
        left: MONITOR_SCREEN.left,
        top: MONITOR_SCREEN.top,
        width: MONITOR_SCREEN.width,
        height: MONITOR_SCREEN.height,
        color: "#ffb000",
        textShadow: "0 0 6px rgba(255,176,0,0.5), 0 0 14px rgba(255,176,0,0.15)",
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className="h-full w-full p-5"
        style={{
          background: "rgba(8,6,3,0.82)",
          boxShadow: "inset 0 0 40px rgba(0,0,0,0.85)",
        }}
      >
        {BOOT_LINES.slice(0, visibleCount).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 3 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.07 }}
            className="mb-1"
            style={{ color: line.color }}
          >
            {line.text}
            {i === visibleCount - 1 && cursorOn && (
              <span
                className="ml-1 inline-block"
                style={{
                  width: "7px",
                  height: "13px",
                  background: line.color,
                  verticalAlign: "middle",
                }}
              />
            )}
          </motion.div>
        ))}
        {showPrompt && (
          <motion.div
            className="mt-5 text-center text-[10px] tracking-[2.5px]"
            style={{ color: "#ffb000" }}
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            [ PRESS ENTER ]
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
type BootPhase = "idle" | "loading" | "booting" | "exiting";

export function BootSequence() {
  const markComplete = useBootStore((s) => s.markComplete);
  const setBooted = useUIStore((s) => s.setBooted);

  const [phase, setPhase] = useState<BootPhase>("idle");
  const [loadProgress, setLoadProgress] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const [cursorOn, setCursorOn] = useState(true);

  const audioRef = useRef<{
    roomTone?: Howl;
    rain?: Howl;
    crtWarmup?: Howl;
    powerClick?: Howl;
    relayClick?: Howl;
  }>({});
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cursorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Audio Setup ── */
  useEffect(() => {
    const a = audioRef.current;
    a.roomTone = new Howl({ src: [AUDIO_PATHS.roomTone], loop: true, volume: 0.12 });
    a.rain = new Howl({ src: [AUDIO_PATHS.rain], loop: true, volume: 0.18 });
    a.crtWarmup = new Howl({ src: [AUDIO_PATHS.crtWarmup], loop: true, volume: 0 });
    a.powerClick = new Howl({ src: [AUDIO_PATHS.powerClick], volume: 0.55 });
    a.relayClick = new Howl({ src: [AUDIO_PATHS.relayClick], volume: 0.3 });

    return () => {
      Object.values(a).forEach((s) => s?.unload());
      timersRef.current.forEach(clearTimeout);
      if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current);
      if (loadIntervalRef.current) clearInterval(loadIntervalRef.current);
    };
  }, []);

  /* ── Cursor blink ── */
  useEffect(() => {
    cursorIntervalRef.current = setInterval(() => setCursorOn((p) => !p), 530);
    return () => { if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current); };
  }, []);

  /* ── Click to start ── */
  const handleStart = useCallback(() => {
    if (phase !== "idle") return;
    const a = audioRef.current;
    a.roomTone?.play();
    a.rain?.play();
    setPhase("loading");

    // Fake loading progress (5-12 seconds)
    const duration = 7000 + Math.random() * 5000;
    const startTime = Date.now();
    loadIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setLoadProgress(pct);
      if (pct >= 100) {
        if (loadIntervalRef.current) clearInterval(loadIntervalRef.current);
        setTimeout(() => setPhase("booting"), 400);
      }
    }, 80);
  }, [phase]);

  /* ── Boot timing ── */
  useEffect(() => {
    if (phase !== "booting") return;
    const a = audioRef.current;
    const t = timersRef.current;

    t.push(setTimeout(() => { a.powerClick?.play(); setVisibleCount(1); }, 600));
    t.push(setTimeout(() => { a.crtWarmup?.fade(0, 0.35, 3500); a.crtWarmup?.play(); }, 1200));

    const lineTimes = [2000, 3100, 4300, 5500, 6700, 7900, 9100, 10800, 13500];
    lineTimes.forEach((time, idx) => {
      if (idx === 0) return;
      t.push(setTimeout(() => {
        a.relayClick?.rate(0.94 + Math.random() * 0.12);
        a.relayClick?.play();
        setVisibleCount(idx + 1);
      }, time));
    });

    t.push(setTimeout(() => setShowPrompt(true), 15500));

    return () => t.forEach(clearTimeout);
  }, [phase]);

  /* ── Keyboard ── */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
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
      setTimeout(() => { markComplete(); setBooted(true); }, 2500);
    }
  }, [phase, showPrompt, markComplete, setBooted]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  /* ── IDLE: Click gate ── */
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

  /* ── LOADING ── */
  if (phase === "loading") {
    return (
      <motion.div
        className="fixed inset-0 z-50"
        style={{ background: "#0a0908" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        <LoadingScreen progress={loadProgress} />
      </motion.div>
    );
  }

  /* ── BOOTING / EXITING ── */
  return (
    <AnimatePresence>
      {phase !== "exiting" && (
        <motion.div
          key="boot"
          className="fixed inset-0 z-50"
          style={{ background: "#0a0908" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        >
          {/* Background render */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url(/images/boot-room-render.png)" }}
          />

          {/* CRT text on monitor */}
          <CRTTextOverlay visibleCount={visibleCount} showPrompt={showPrompt} cursorOn={cursorOn} />

          {/* Dust particles */}
          <DustCanvas />

          {/* Scanlines */}
          <div
            className="pointer-events-none fixed inset-0 z-25"
            style={{
              background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.025) 2px, rgba(0,0,0,0.025) 4px)",
              mixBlendMode: "multiply",
            }}
          />

          {/* Vignette */}
          <div
            className="pointer-events-none fixed inset-0 z-25"
            style={{
              background: "radial-gradient(circle at 50% 45%, transparent 45%, rgba(10,9,8,0.55) 100%)",
            }}
          />

          {/* Film grain */}
          <div
            className="pointer-events-none fixed inset-0 z-25 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: "128px 128px",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}