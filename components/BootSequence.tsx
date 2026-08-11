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
   DUST PARTICLES (Canvas 2D) - STORY GROUNDED GHOSTLY PARTICLES
   ═══════════════════════════════════════════════════════════════ */
function DustCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    // Microscopic static drift particulates configuration
    interface Particulate {
      x: number;
      y: number;
      vx: number;
      vy: number;
      length: number;
      thickness: number;
      angle: number;
      angularSpeed: number;
      opacity: number;
      type: "fiber" | "ash";
      points?: { dx: number; dy: number }[];
    }

    const particulates: Particulate[] = [];
    const maxParticles = 60; // Lightweight high-density thread layer

    for (let i = 0; i < maxParticles; i++) {
      const type = Math.random() > 0.4 ? "ash" : "fiber";
      const p: Particulate = {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() * 0.1) + 0.04, // Slow, weighted falling drift
        length: type === "fiber" ? 4 + Math.random() * 8 : 1 + Math.random() * 2,
        thickness: type === "fiber" ? 0.45 : 1.2,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (Math.random() - 0.5) * 0.006,
        opacity: 0.22 + Math.random() * 0.35, // High contrast visible dust
        type,
      };

      if (type === "ash") {
        const sides = 3 + Math.floor(Math.random() * 3);
        p.points = [];
        for (let s = 0; s < sides; s++) {
          const a = (s / sides) * Math.PI * 2;
          const r = 0.5 + Math.random() * 1.5;
          p.points.push({ dx: Math.cos(a) * r, dy: Math.sin(a) * r });
        }
      }
      particulates.push(p);
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particulates.forEach((p) => {
        // Apply lazy Brownian motion transforms
        p.y += p.vy;
        p.x += p.vx + Math.sin(Date.now() * 0.001 + p.angle) * 0.06;
        p.angle += p.angularSpeed;

        // Reset wrapping limits
        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        // Faint electrostatic blue-indigo UV resonance glare
        ctx.strokeStyle = `rgba(129, 140, 248, ${p.opacity})`;
        ctx.fillStyle = `rgba(129, 140, 248, ${p.opacity * 0.8})`;
        ctx.lineWidth = p.thickness;

        if (p.type === "fiber") {
          ctx.beginPath();
          ctx.moveTo(-p.length / 2, 0);
          ctx.quadraticCurveTo(0, Math.sin(p.angle) * 1.8, p.length / 2, 0);
          ctx.stroke();
        } else if (p.type === "ash" && p.points) {
          ctx.beginPath();
          ctx.moveTo(p.points[0].dx, p.points[0].dy);
          for (let idx = 1; idx < p.points.length; idx++) {
            ctx.lineTo(p.points[idx].dx, p.points[idx].dy);
          }
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-30"
      style={{ mixBlendMode: "screen", filter: "blur(0.35px)" }}
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
    <div className="flex h-full w-full items-center justify-center bg-[#070503]">
      <div className="font-mono text-sm tracking-widest" style={{ color: "#8a6000", width: "380px", lineHeight: "1.8" }}>
        <div className="mb-4 text-xs tracking-[3px]" style={{ color: "#ffb000" }}>
          ARCHIVE TERMINAL
        </div>
        <div className="mb-4 h-px w-full" style={{ background: "#2a2520" }} />
        {LOADING_STEPS.slice(0, visibleSteps).map((step, i) => (
          <div key={i} style={{ opacity: i === visibleSteps - 1 ? 0.7 : 1 }}>
            {step}
            <span className="ml-3" style={{ color: "#6a9a5a" }}> [OK] </span>
          </div>
        ))}
        <div className="mt-5">
          <div className="h-0.5 w-full" style={{ background: "#1a1815" }}>
            <motion.div className="h-full" style={{ background: "#ffb000", boxShadow: "0 0 6px rgba(255,176,0,0.3)" }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>
          <div className="mt-2 text-right text-[10px] opacity-50">{Math.round(progress)}%</div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SHUTDOWN SCREEN (CRT Power-down physics collapse simulation)
   ═══════════════════════════════════════════════════════════════ */
function ShutdownScreen() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Stage 1: Main screen collapses to vertical slit
    const t1 = setTimeout(() => setStage(1), 800);
    // Stage 2: Slit collapses to central phosphor dot
    const t2 = setTimeout(() => setStage(2), 1400);
    // Stage 3: Central dot burns out into absolute black
    const t3 = setTimeout(() => setStage(3), 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  if (stage === 3) {
    return (
      <div className="fixed inset-0 z-50 bg-[#000000] flex flex-col items-center justify-center pointer-events-none" style={{ backgroundColor: "#000000" }} />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none" style={{ backgroundColor: "#0a0908" }} >
      <motion.div
        initial={{ scaleX: 1, scaleY: 1, opacity: 1, filter: "brightness(1) contrast(1.15)" }}
        animate={{
          scaleY: stage >= 1 ? 0.002 : 1,
          scaleX: stage >= 2 ? 0.002 : 1,
          opacity: stage >= 2 ? [1, 0.4, 0] : 1,
          filter: stage >= 2 ? "brightness(2) contrast(1.5)" : "brightness(1) contrast(1.15)",
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="w-[480px] h-[360px] bg-[#ffaa55] rounded-[2px]"
        style={{
          boxShadow: stage < 2 ? "0 0 45px rgba(255, 170, 85, 0.85), inset 0 0 40px rgba(0,0,0,0.9)" : "0 0 15px rgba(255, 250, 240, 1)",
          backgroundColor: stage >= 2 ? "#ffffff" : "#ffaa55",
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN SEQUENCE EXPORT
   ═══════════════════════════════════════════════════════════════ */
type BootPhase = "idle" | "degauss" | "loading" | "booting" | "exiting";

interface BootSequenceProps {
  onPowerOn?: () => void;
}

export function BootSequence({ onPowerOn }: BootSequenceProps) {
  const markComplete = useBootStore((s) => s.markComplete);
  const setBooted = useUIStore((s) => s.setBooted);
  const [phase, setPhase] = useState<BootPhase>("idle");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEnding = localStorage.getItem("vp-ending");
      if (storedEnding === "shutdown") {
        setPhase("shutdown" as any);
      } else if (storedEnding === "backup") {
        localStorage.removeItem("vp-ending");
      }
    }
  }, []);

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

  // ── Procedural Web Audio Degauss Synthesizer ──
  const playDegaussSound = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 1.2);
      
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      vibrato.frequency.setValueAtTime(35, now);
      vibratoGain.gain.setValueAtTime(15, now);
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      vibrato.start();
      osc.start();
      vibrato.stop(now + 1.5);
      osc.stop(now + 1.5);
    } catch (e) {
      console.warn("Web Audio Degauss failed:", e);
    }
  }, []);

  // ── CRT Degauss Visual Tick Loop ──
  const startDegaussVisualTick = useCallback(() => {
    let startTimestamp: number | null = null;
    const duration = 1500;

    const degaussTick = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = timestamp - startTimestamp;
      const pct = Math.min(1.0, progress / duration);
      
      const intensity = 1.0 - pct;
      setDegaussIntensity(intensity);

      if (pct < 1.0) {
        const shakePower = intensity * 15;
        setShakeOffset({
          x: (Math.random() - 0.5) * shakePower,
          y: (Math.random() - 0.5) * shakePower,
        });
        degaussFrameId.current = requestAnimationFrame(degaussTick);
      } else {
        setShakeOffset({ x: 0, y: 0 });
        setDegaussIntensity(0);
        setPhase("loading");
      }
    };
    degaussFrameId.current = requestAnimationFrame(degaussTick);
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

    let currentLine = 0;
    const typeNextLine = () => {
      if (currentLine >= BOOT_LINES.length) {
        setShowPrompt(true);
        return;
      }
      setVisibleCount(currentLine + 1);
      
      const delay = currentLine === 7 ? 2200 : 250 + Math.random() * 180;
      currentLine++;
      const timer = setTimeout(typeNextLine, delay);
      timersRef.current.push(timer);
    };

    const startTimer = setTimeout(typeNextLine, 600);
    timersRef.current.push(startTimer);

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
    setPhase("degauss");
    
    const a = audioRef.current;
    a.powerClick?.play();
    
    playDegaussSound();
    startDegaussVisualTick();

    if (onPowerOn) onPowerOn();

    setTimeout(() => {
      a.roomTone?.play();
      a.roomTone?.fade(0, 0.3, 1000);
      a.rain?.play();
      a.rain?.fade(0, 0.25, 1000);
      a.crtWarmup?.play();
      a.crtWarmup?.fade(0, 0.4, 3000);
    }, 150);
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
        a.roomTone?.fade(a.roomTone.volume() as number, 0, 2200);
        a.rain?.fade(a.rain.volume() as number, 0, 2200);
        a.crtWarmup?.fade(a.crtWarmup.volume() as number, 0, 2200);
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

  useEffect(() => {
    return () => {
      if (degaussFrameId.current) cancelAnimationFrame(degaussFrameId.current);
    };
  }, []);

  if (phase === ("shutdown" as any)) {
    return <ShutdownScreen />;
  }

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
        <DustCanvas />
      </motion.div>
    );
  }

  const degaussIntensityInv = 1.0 - degaussIntensity;
  // Opening scene visual sags calibrated for rich, warm backlight (0.45 baseline to 0.85 full lit)
  const roomBrightness = phase === "degauss" ? 0.45 + degaussIntensityInv * 0.40 : 0.85;
  const roomScale = phase === "degauss" ? 1.0 - degaussIntensityInv * 0.05 : 0.95;

  const chromaticSeparation = degaussIntensity * 18;

  return (
    <AnimatePresence>
      {phase !== "exiting" && (
        <motion.div
          key="boot"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          style={{
            background: "#0a0908",
            transform: `translate(${shakeOffset.x}px, ${shakeOffset.y}px)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        >
          {/* Static room background frame (Photographic rendering) */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url(/images/boot-room-render.png)",
              transform: `scale(${roomScale})`,
              filter: `brightness(${roomBrightness}) contrast(1.15) sepia(0.08)`,
              transition: "transform 1500ms cubic-bezier(0.1, 0.8, 0.2, 1), filter 1500ms ease",
            }}
          />

          {/* Glowing CRT phosphor monitor screen frame */}
          <motion.div
            style={{
              zIndex: 40,
              boxShadow: `0 0 ${40 + degaussIntensity * 120}px rgba(255, 170, 85, ${0.15 + (1 - degaussIntensity) * 0.45})`,
              textShadow: `${chromaticSeparation}px 0 0 rgba(255,0,0,0.3), -${chromaticSeparation}px 0 0 rgba(0,255,255,0.3)`,
              filter: `contrast(${1.0 + degaussIntensity * 0.4}) brightness(${1.0 - degaussIntensity * 0.6})`,
              transform: `scale(${1.0 - degaussIntensity * 0.08})`,
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
          >
            {phase === "loading" ? (
              <LoadingScreen progress={loadProgress} />
            ) : (
              <CRTScreenText visibleCount={visibleCount} showPrompt={showPrompt} cursorOn={cursorOn} />
            )}
          </motion.div>

          {/* Interactive procedural dust floating around - story grounded */}
          <DustCanvas />

        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CRTScreenText({ visibleCount, showPrompt, cursorOn, }: { visibleCount: number; showPrompt: boolean; cursorOn: boolean; }) {
  return (
    <div style={{
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
    }} >
      {BOOT_LINES.slice(0, visibleCount).map((line, i) => (
        <div key={i} style={{
          color: line.color,
          marginBottom: "5px",
          opacity: 0,
          animation: "phosphorIn 70ms ease forwards",
          animationDelay: `${i * 40}ms`,
        }} >
          {line.text}
          {i === visibleCount - 1 && cursorOn && (
            <span style={{
              display: "inline-block",
              width: "7px",
              height: "13px",
              background: line.color,
              marginLeft: "4px",
              verticalAlign: "middle",
            }} />
          )}
        </div>
      ))}
      {showPrompt && (
        <div style={{
          marginTop: "18px",
          color: "#ffb000",
          fontSize: "11px",
          letterSpacing: "2.5px",
          textAlign: "center",
          animation: "pulsePrompt 2.2s ease-in-out infinite",
        }} >
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
