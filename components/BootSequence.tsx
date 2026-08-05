'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Howl } from 'howler';
import { useBootStore } from '@/state/bootStore';
import { useUIStore } from '@/state/uiStore';
import BootScene from './BootScene';

/* ───────────────────────────────────────────
   AUDIO CONFIGURATION
   ─────────────────────────────────────────── */
const AUDIO_PATHS = {
  powerClick: '/audio/boot/power_click.mp3',
  crtWarmup: '/audio/boot/crt_warmup.wav',
  relayClick: '/audio/boot/relay_click.wav',
  roomTone: '/audio/boot/room_tone.mp3',
  rain: '/audio/boot/rain.mp3',
};

/* ───────────────────────────────────────────
   BOOT SEQUENCE COMPONENT
   ─────────────────────────────────────────── */
export function BootSequence() {
  const markComplete = useBootStore((s) => s.markComplete);
  const setBooted = useUIStore((s) => s.setBooted);

  const [visibleCount, setVisibleCount] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const [cursorOn, setCursorOn] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [skipReady, setSkipReady] = useState(false);

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
      volume: 0.15,
      autoplay: false,
    });

    a.rain = new Howl({
      src: [AUDIO_PATHS.rain],
      loop: true,
      volume: 0.2,
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
      volume: 0.6,
    });

    a.relayClick = new Howl({
      src: [AUDIO_PATHS.relayClick],
      volume: 0.35,
    });

    // Start ambient immediately
    a.roomTone?.play();
    a.rain?.play();

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

  /* ── Boot Timing Sequence ── */
  useEffect(() => {
    const a = audioRef.current;
    const t = timersRef.current;

    // 0.8s — Power relay click + first line
    t.push(window.setTimeout(() => {
      a.powerClick?.play();
      setVisibleCount(1);
      setCameraActive(true);
    }, 800));

    // 1.5s — CRT warmup fades in
    t.push(window.setTimeout(() => {
      a.crtWarmup?.fade(0, 0.4, 3000);
      a.crtWarmup?.play();
    }, 1500));

    // 2.5s–14s — Boot lines type out
    const lineTimes = [2500, 3500, 4700, 5900, 7100, 8300, 9500, 11200, 14000];
    lineTimes.forEach((time, idx) => {
      if (idx === 0) return; // Already handled at 800ms
      t.push(window.setTimeout(() => {
        a.relayClick?.rate(0.95 + Math.random() * 0.1);
        a.relayClick?.play();
        setVisibleCount(idx + 1);
      }, time));
    });

    // 16s — Show prompt
    t.push(window.setTimeout(() => {
      setShowPrompt(true);
      setSkipReady(true);
    }, 16000));

    return () => {
      t.forEach((id) => clearTimeout(id));
    };
  }, []);

  /* ── Keyboard Handler ── */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (exiting) return;

      if (e.key === 'Enter' && showPrompt) {
        setExiting(true);
        // Fade audio
        const a = audioRef.current;
        a.roomTone?.fade(a.roomTone?.volume() ?? 0, 0, 2500);
        a.rain?.fade(a.rain?.volume() ?? 0, 0, 2500);
        a.crtWarmup?.fade(a.crtWarmup?.volume() ?? 0, 0, 2500);

        window.setTimeout(() => {
          markComplete();
          setBooted(true);
        }, 2500);
        return;
      }

      // Skip to prompt on any key after 2s
      if (!showPrompt && skipReady && e.key !== 'Enter') {
        timersRef.current.forEach((id) => clearTimeout(id));
        timersRef.current = [];
        setVisibleCount(BOOT_LINES);
        setShowPrompt(true);
        setCameraActive(true);
      }
    },
    [exiting, showPrompt, skipReady, markComplete, setBooted]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  /* ── Enable skip after 2s ── */
  useEffect(() => {
    const id = window.setTimeout(() => setSkipReady(true), 2000);
    return () => clearTimeout(id);
  }, []);

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="boot"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-50"
          style={{ background: '#0a0908' }}
        >
          {/* 3D Scene */}
          <BootScene
            visibleCount={visibleCount}
            showPrompt={showPrompt}
            cursorOn={cursorOn}
            cameraActive={cameraActive}
          />

          {/* CRT overlay scanlines (subtle CSS) */}
          <div
            className="pointer-events-none fixed inset-0 z-10"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
              mixBlendMode: 'multiply',
            }}
          />

          {/* Vignette overlay */}
          <div
            className="pointer-events-none fixed inset-0 z-20"
            style={{
              background: 'radial-gradient(circle at 50% 50%, transparent 50%, rgba(10,9,8,0.6) 100%)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}