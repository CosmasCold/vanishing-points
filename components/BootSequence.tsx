"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Howl } from "howler";
import { useBootStore } from "@/state/bootStore";
import { useUIStore } from "@/state/uiStore";
import BootScene from "./BootScene";

/* ═══════════════════════════════════════════════════════════════
   AUDIO CONFIGURATION
   ═══════════════════════════════════════════════════════════════ */
const AUDIO_PATHS = {
  powerClick: "/audio/boot/power_click.mp3",
  crtWarmup: "/audio/boot/crt_warmup.wav",
  relayClick: "/audio/boot/relay_click.wav",
  roomTone: "/audio/boot/room_tone.mp3",
  rain: "/audio/boot/rain.mp3",
};

/* ═══════════════════════════════════════════════════════════════
   BOOT SEQUENCE STATE MACHINE
   idle → loading → booting → exiting → done
   ═══════════════════════════════════════════════════════════════ */
type BootPhase = "idle" | "loading" | "booting" | "exiting";

export function BootSequence() {
  const markComplete = useBootStore((s) => s.markComplete);
  const setBooted = useUIStore((s) => s.setBooted);

  const [phase, setPhase] = useState<BootPhase>("idle");
  const [visibleCount, setVisibleCount] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const [cursorOn, setCursorOn] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);

  const audioRef = useRef<{
    roomTone?: Howl;
    rain?: Howl;
    crtWarmup?: Howl;
    powerClick?: Howl;
    relayClick?: Howl;
  }>({});
  const timersRef = useRef<number[]>([]);
  const cursorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const BOOT_LINES = 9;

  /* ── Audio Setup ── */
  useEffect(() => {
    const a = audioRef.current;

    a.roomTone = new Howl({
      src: [AUDIO_PATHS.roomTone],
      loop: true,
      volume: 0.12,
      autoplay: false,
    });

    a.rain = new Howl({
      src: [AUDIO_PATHS.rain],
      loop: true,
      volume: 0.18,
      autoplay: false,
    });

    a.crtWarmup = new Howl({
      src: [AUDIO_PATHS.crtWarmup],
      loop: true,
      volume: 0,
      autoplay: false,
    });

    a.powerClick = new Howl({
      src: [AUDIO_PATHS.powerClick],
      volume: 0.55,
    });

    a.relayClick = new Howl({
      src: [AUDIO_PATHS.relayClick],
      volume: 0.3,
    });

    return () => {
      Object.values(a).forEach((sound) => sound?.unload());
      timersRef.current.forEach((id) => clearTimeout(id));
      if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current);
    };
  }, []);

  /* ── Cursor blink ── */
  useEffect(() => {
    cursorIntervalRef.current = setInterval(() => {
      setCursorOn((p) => !p);
    }, 530);
    return () => {
      if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current);
    };
  }, []);

  /* ── Start handler: click gate ── */
  const handleStart = useCallback(() => {
    if (phase !== "idle") return;

    const a = audioRef.current;
    // Unlock AudioContext and start ambient
    a.roomTone?.play();
    a.rain?.play();

    setPhase("loading");
  }, [phase]);

  /* ── Scene ready callback ── */
  const handleSceneReady = useCallback(() => {
    if (phase !== "loading") return;
    setPhase("booting");

    const a = audioRef.current;
    const t = timersRef.current;

    // 0.6s — Power relay click + first line
    t.push(
      window.setTimeout(() => {
        a.powerClick?.play();
        setVisibleCount(1);
        setCameraActive(true);
      }, 600)
    );

    // 1.2s — CRT warmup fades in
    t.push(
      window.setTimeout(() => {
        a.crtWarmup?.fade(0, 0.35, 3500);
        a.crtWarmup?.play();
      }, 1200)
    );

    // 2.0s–13s — Boot lines type out
    const lineTimes = [2000, 3100, 4300, 5500, 6700, 7900, 9100, 10800, 13500];
    lineTimes.forEach((time, idx) => {
      if (idx === 0) return; // handled at 600ms
      t.push(
        window.setTimeout(() => {
          a.relayClick?.rate(0.94 + Math.random() * 0.12);
          a.relayClick?.play();
          setVisibleCount(idx + 1);
        }, time)
      );
    });

    // 15.5s — Show prompt
    t.push(
      window.setTimeout(() => {
        setShowPrompt(true);
      }, 15500)
    );
  }, [phase]);

  /* ── Keyboard Handler ── */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (phase !== "booting" || showPrompt === false) {
        // Skip to prompt on any key during booting
        if (phase === "booting" && e.key !== "Enter") {
          timersRef.current.forEach((id) => clearTimeout(id));
          timersRef.current = [];
          setVisibleCount(BOOT_LINES);
          setShowPrompt(true);
        }
        return;
      }

      if (e.key === "Enter" && showPrompt) {
        setPhase("exiting");
        const a = audioRef.current;
        a.roomTone?.fade(a.roomTone.volume(), 0, 2200);
        a.rain?.fade(a.rain.volume(), 0, 2200);
        a.crtWarmup?.fade(a.crtWarmup.volume(), 0, 2200);

        window.setTimeout(() => {
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

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  // ── IDLE: Click gate ──
  if (phase === "idle") {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "#0a0908", cursor: "pointer" }}
        onClick={handleStart}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <div
          style={{
            textAlign: "center",
            fontFamily: "'Courier New', Courier, monospace",
            color: "#ffb000",
            letterSpacing: "3px",
            fontSize: "12px",
            userSelect: "none",
          }}
        >
          <motion.div
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            [ CLICK TO INITIALIZE ]
          </motion.div>
          <div
            style={{
              marginTop: "24px",
              fontSize: "10px",
              color: "#5a4a30",
              letterSpacing: "1px",
            }}
          >
            VANISHING POINTS ARCHIVE — SYSTEM 7-B
          </div>
        </div>
      </motion.div>
    );
  }

  // ── LOADING / BOOTING / EXITING ──
  return (
    <AnimatePresence>
      {phase !== "exiting" && (
        <motion.div
          key="boot"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.0, ease: "easeInOut" }}
          className="fixed inset-0 z-50"
          style={{ background: "#0a0908" }}
        >
          {/* 3D Scene */}
          <BootScene
            visibleCount={visibleCount}
            showPrompt={showPrompt}
            cursorOn={cursorOn}
            cameraActive={cameraActive}
            onReady={handleSceneReady}
          />

          {/* CRT scanline overlay */}
          <div
            className="pointer-events-none fixed inset-0 z-10"
            style={{
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.025) 2px, rgba(0,0,0,0.025) 4px)",
              mixBlendMode: "multiply",
            }}
          />

          {/* Vignette overlay */}
          <div
            className="pointer-events-none fixed inset-0 z-20"
            style={{
              background:
                "radial-gradient(circle at 50% 45%, transparent 45%, rgba(10,9,8,0.55) 100%)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}