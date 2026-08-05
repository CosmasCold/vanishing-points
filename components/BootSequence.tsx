'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useBootStore } from '@/state/bootStore';
import { useUIStore } from '@/state/uiStore';
import { BootScene } from './BootScene';
import { useBootAudio } from '@/hooks/useBootAudio';

// ─── BOOT LINES ───
const LINES = [
  { text: 'POWER RESTORED', type: 'system', delay: 800, audio: 'power' },
  { text: '', type: 'spacer', delay: 400 },
  { text: 'Loading Archive Kernel...', type: 'info', delay: 1000, audio: 'relay' },
  { text: '  [OK]  Kernel v4.2.1-stable', type: 'ok', delay: 280, audio: 'relay' },
  { text: '  [OK]  Memory banks 1–16', type: 'ok', delay: 220, audio: 'relay' },
  { text: '  [OK]  Magnetic drum array', type: 'ok', delay: 380, audio: 'relay' },
  { text: '', type: 'spacer', delay: 400 },
  { text: 'Initializing Atlas...', type: 'info', delay: 1100, audio: 'relay' },
  { text: '  [OK]  Geodetic reference frame loaded', type: 'ok', delay: 280, audio: 'relay' },
  { text: '  [OK]  159 locations indexed', type: 'ok', delay: 220, audio: 'relay' },
  { text: '  [WARN]  Coordinate drift in sector 7-B', type: 'warn', delay: 600, audio: 'relay' },
  { text: '', type: 'spacer', delay: 400 },
  { text: 'Checking Integrity...', type: 'info', delay: 900, audio: 'relay' },
  { text: '  [OK]  Document repository', type: 'ok', delay: 250, audio: 'relay' },
  { text: '  [OK]  Evidence chain verified', type: 'ok', delay: 250, audio: 'relay' },
  { text: '  [OK]  BUNKER_7 relay stable', type: 'ok', delay: 400, audio: 'relay' },
  { text: '', type: 'spacer', delay: 400 },
  { text: 'Loading Investigations...', type: 'info', delay: 800, audio: 'relay' },
  { text: '  [OK]  3 active cases', type: 'ok', delay: 250, audio: 'relay' },
  { text: '  [OK]  1 pending review', type: 'ok', delay: 250, audio: 'relay' },
  { text: '', type: 'spacer', delay: 400 },
  { text: 'Synchronizing Evidence...', type: 'info', delay: 900, audio: 'relay' },
  { text: '  [OK]  Cross-reference matrix built', type: 'ok', delay: 350, audio: 'relay' },
  { text: '', type: 'spacer', delay: 400 },
  { text: 'Loading Local Cache...', type: 'info', delay: 700, audio: 'relay' },
  { text: '  [OK]  847 artifacts recovered', type: 'ok', delay: 250, audio: 'relay' },
  { text: '', type: 'spacer', delay: 500 },
  { text: 'Dust Index: STABLE', type: 'ok', delay: 800, audio: 'relay' },
  { text: '', type: 'spacer', delay: 800 },
  { text: 'Good evening, Investigator.', type: 'final', delay: 2500 },
];

export const BootSequence: React.FC = () => {
  const { isComplete, markComplete } = useBootStore();
  const { setBooted } = useUIStore();
  const { playPowerClick, startCrtWarmup, playRelayClick, fadeOutAll } = useBootAudio();

  const [visibleCount, setVisibleCount] = useState(0);
  const [cursorOn, setCursorOn] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [started, setStarted] = useState(false);

  const timeoutsRef = useRef<number[]>([]);

  // ── AUTO-START SEQUENCE ──
  useEffect(() => {
    if (isComplete || started) return;
    setStarted(true);

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    const push = (fn: () => void, ms: number) => {
      timeoutsRef.current.push(window.setTimeout(fn, ms));
    };

    let accumulated = 500;

    // Start CRT warmup at 1.5s
    push(() => startCrtWarmup(), 1500);

    LINES.forEach((line, i) => {
      accumulated += line.delay;
      push(() => {
        setVisibleCount(i + 1);
        if (line.audio === 'power') playPowerClick();
        if (line.audio === 'relay') playRelayClick();
      }, accumulated);
    });

    accumulated += 2000;
    push(() => setShowPrompt(true), accumulated);

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [isComplete, started, playPowerClick, startCrtWarmup, playRelayClick]);

  // cursor blink
  useEffect(() => {
    const id = setInterval(() => setCursorOn((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  // skip key
  useEffect(() => {
    const onKey = () => {
      if (showPrompt || exiting || isComplete) return;
      timeoutsRef.current.forEach(clearTimeout);
      setVisibleCount(LINES.length);
      setShowPrompt(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showPrompt, exiting, isComplete]);

  const handleEnter = useCallback(() => {
    if (exiting || isComplete) return;
    setExiting(true);
    timeoutsRef.current.forEach(clearTimeout);
    fadeOutAll();
    setTimeout(() => {
      markComplete();
      setBooted(true);
    }, 2500);
  }, [exiting, isComplete, markComplete, setBooted, fadeOutAll]);

  if (isComplete) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2.5, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ background: '#0a0806' }}
    >
      <BootScene
        visibleCount={visibleCount}
        showPrompt={showPrompt}
        cursorOn={cursorOn}
      />

      {showPrompt && (
        <button
          onClick={handleEnter}
          className="absolute inset-0 z-40 cursor-pointer"
          style={{ background: 'transparent', border: 'none' }}
          aria-label="Enter Archive"
        />
      )}
    </motion.div>
  );
};