'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBootStore } from '@/state/bootStore';
import { useUIStore } from '@/state/uiStore';
import { BootScene } from './BootScene';

// ─── PALETTE ───
const PHOSPHOR = '#ffb000';
const PHOSPHOR_DIM = '#8a6000';
const GREEN_OK = '#5a8a4a';
const AMBER_WARN = '#b8943a';
const IVORY = '#e8e0d0';

// ─── BOOT LINES ───
const LINES = [
  { text: 'POWER RESTORED', type: 'system', delay: 800 },
  { text: '', type: 'spacer', delay: 400 },
  { text: 'Loading Archive Kernel...', type: 'info', delay: 1000 },
  { text: '  [OK]  Kernel v4.2.1-stable', type: 'ok', delay: 300 },
  { text: '  [OK]  Memory banks 1–16', type: 'ok', delay: 250 },
  { text: '  [OK]  Magnetic drum array', type: 'ok', delay: 400 },
  { text: '', type: 'spacer', delay: 400 },
  { text: 'Initializing Atlas...', type: 'info', delay: 1100 },
  { text: '  [OK]  Geodetic reference frame loaded', type: 'ok', delay: 300 },
  { text: '  [OK]  159 locations indexed', type: 'ok', delay: 250 },
  { text: '  [WARN]  Coordinate drift in sector 7-B', type: 'warn', delay: 600 },
  { text: '', type: 'spacer', delay: 400 },
  { text: 'Checking Integrity...', type: 'info', delay: 900 },
  { text: '  [OK]  Document repository', type: 'ok', delay: 250 },
  { text: '  [OK]  Evidence chain verified', type: 'ok', delay: 250 },
  { text: '  [OK]  BUNKER_7 relay stable', type: 'ok', delay: 400 },
  { text: '', type: 'spacer', delay: 400 },
  { text: 'Loading Investigations...', type: 'info', delay: 800 },
  { text: '  [OK]  3 active cases', type: 'ok', delay: 250 },
  { text: '  [OK]  1 pending review', type: 'ok', delay: 250 },
  { text: '', type: 'spacer', delay: 400 },
  { text: 'Synchronizing Evidence...', type: 'info', delay: 900 },
  { text: '  [OK]  Cross-reference matrix built', type: 'ok', delay: 350 },
  { text: '', type: 'spacer', delay: 400 },
  { text: 'Loading Local Cache...', type: 'info', delay: 700 },
  { text: '  [OK]  847 artifacts recovered', type: 'ok', delay: 250 },
  { text: '', type: 'spacer', delay: 500 },
  { text: 'Dust Index: STABLE', type: 'ok', delay: 800 },
  { text: '', type: 'spacer', delay: 800 },
  { text: 'Good evening, Investigator.', type: 'final', delay: 2500 },
];

// ─── COMPONENT ───
export const BootSequence: React.FC = () => {
  const { isComplete, markComplete } = useBootStore();
  const { setBooted } = useUIStore();

  const [visibleCount, setVisibleCount] = useState(0);
  const [cursorOn, setCursorOn] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [showPrompt, setShowPrompt] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [started, setStarted] = useState(false);

  const timeoutsRef = useRef<number[]>([]);

  // mouse tracking for parallax
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // ── AUTO-START SEQUENCE ──
  useEffect(() => {
    if (isComplete || started) return;
    setStarted(true);

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    const push = (fn: () => void, ms: number) => {
      timeoutsRef.current.push(window.setTimeout(fn, ms));
    };

    let accumulated = 600;

    LINES.forEach((line, i) => {
      accumulated += line.delay;
      push(() => setVisibleCount(i + 1), accumulated);
    });

    accumulated += 2000;
    push(() => setShowPrompt(true), accumulated);

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [isComplete, started]);

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
    setTimeout(() => {
      markComplete();
      setBooted(true);
    }, 2500);
  }, [exiting, isComplete, markComplete, setBooted]);

  if (isComplete) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2.5, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ background: '#0a0806' }}
    >
      {/* 3D Scene */}
      <BootScene mousePos={mousePos} />

      {/* ── CRT TEXT OVERLAY ──
          Positioned to align with the 3D monitor screen.
          The monitor is at [0.8, -0.4, -0.3] rotated [0, -0.15, 0] in the scene.
          We project text onto that screen area using absolute positioning.
      */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '22%',
          left: '52%',
          width: '28%',
          height: '38%',
          transform: 'translate(-50%, -50%) perspective(800px) rotateY(-4deg) rotateX(2deg)',
          zIndex: 10,
        }}
      >
        <div
          className="w-full h-full flex flex-col justify-center px-4 py-3 overflow-hidden"
          style={{
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: 'clamp(8px, 0.85vw, 11px)',
            lineHeight: 1.6,
            letterSpacing: '0.03em',
            color: PHOSPHOR,
            textShadow: `0 0 6px ${PHOSPHOR}40, 0 0 14px ${PHOSPHOR}20`,
          }}
        >
          {/* Ambient phosphor glow behind text */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: '10%',
              left: '5%',
              width: '90%',
              height: '80%',
              background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255, 176, 0, 0.04) 0%, transparent 70%)`,
            }}
          />

          {LINES.slice(0, visibleCount).map((line, i) => {
            const isLast = i === visibleCount - 1;
            const color =
              line.type === 'ok' ? GREEN_OK :
              line.type === 'warn' ? AMBER_WARN :
              line.type === 'final' ? IVORY :
              line.type === 'spacer' ? 'transparent' :
              PHOSPHOR;
            const isFinal = line.type === 'final';

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -2 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.05 }}
                className="whitespace-pre-wrap"
                style={{
                  color,
                  textShadow: isFinal
                    ? `0 0 10px ${IVORY}40, 0 0 24px ${IVORY}20`
                    : line.type === 'ok'
                    ? `0 0 4px ${GREEN_OK}25`
                    : `0 0 6px ${PHOSPHOR}20, 0 0 12px ${PHOSPHOR}10`,
                  letterSpacing: isFinal ? '0.06em' : '0.03em',
                  minHeight: line.type === 'spacer' ? '0.5em' : '1.6em',
                }}
              >
                {line.text}
                {isLast && !showPrompt && cursorOn && (
                  <span
                    className="inline-block ml-0.5"
                    style={{
                      width: '6px',
                      height: '1.1em',
                      backgroundColor: isFinal ? IVORY : PHOSPHOR,
                      opacity: 0.7,
                      verticalAlign: 'text-bottom',
                    }}
                  />
                )}
              </motion.div>
            );
          })}

          {showPrompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-3"
            >
              <button
                onClick={handleEnter}
                className="text-left bg-transparent border-0 p-0 cursor-pointer pointer-events-auto"
                style={{
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  color: PHOSPHOR_DIM,
                  letterSpacing: '0.03em',
                }}
              >
                Press ENTER to access the Archive
                {cursorOn && (
                  <span
                    className="inline-block ml-0.5"
                    style={{
                      width: '6px',
                      height: '1.1em',
                      backgroundColor: PHOSPHOR_DIM,
                      opacity: 0.5,
                      verticalAlign: 'text-bottom',
                    }}
                  />
                )}
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Scanline overlay (entire screen) */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
          backgroundSize: '100% 4px',
        }}
      />
    </motion.div>
  );
};