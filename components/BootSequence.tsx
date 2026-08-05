'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBootStore } from '@/state/bootStore';
import { useUIStore } from '@/state/uiStore';

// ─── PALETTE ───
const PHOSPHOR = '#ffb000';
const PHOSPHOR_DIM = '#8a6000';
const PHOSPHOR_GHOST = 'rgba(255, 176, 0, 0.06)';
const GREEN_OK = '#5a8a4a';
const AMBER_WARN = '#b8943a';
const IVORY = '#e8e0d0';
const WALNUT = '#2a2018';
const WALNUT_DEEP = '#1a1410';
const GUNMETAL = '#2e2e32';
const GUNMETAL_DARK = '#1e1e22';
const BEZEL_HIGHLIGHT = '#3e3e42';

// ─── BOOT LINES ───
const LINES = [
  { text: 'POWER RESTORED', type: 'system', delay: 400 },
  { text: '', type: 'spacer', delay: 200 },
  { text: 'Loading Archive Kernel...', type: 'info', delay: 800 },
  { text: '  [OK]  Kernel v4.2.1-stable', type: 'ok', delay: 250 },
  { text: '  [OK]  Memory banks 1–16', type: 'ok', delay: 200 },
  { text: '  [OK]  Magnetic drum array', type: 'ok', delay: 350 },
  { text: '', type: 'spacer', delay: 300 },
  { text: 'Initializing Atlas...', type: 'info', delay: 900 },
  { text: '  [OK]  Geodetic reference frame loaded', type: 'ok', delay: 250 },
  { text: '  [OK]  159 locations indexed', type: 'ok', delay: 200 },
  { text: '  [WARN]  Coordinate drift in sector 7-B', type: 'warn', delay: 500 },
  { text: '', type: 'spacer', delay: 300 },
  { text: 'Checking Integrity...', type: 'info', delay: 700 },
  { text: '  [OK]  Document repository', type: 'ok', delay: 200 },
  { text: '  [OK]  Evidence chain verified', type: 'ok', delay: 200 },
  { text: '  [OK]  BUNKER_7 relay stable', type: 'ok', delay: 300 },
  { text: '', type: 'spacer', delay: 300 },
  { text: 'Loading Investigations...', type: 'info', delay: 600 },
  { text: '  [OK]  3 active cases', type: 'ok', delay: 200 },
  { text: '  [OK]  1 pending review', type: 'ok', delay: 200 },
  { text: '', type: 'spacer', delay: 300 },
  { text: 'Synchronizing Evidence...', type: 'info', delay: 700 },
  { text: '  [OK]  Cross-reference matrix built', type: 'ok', delay: 300 },
  { text: '', type: 'spacer', delay: 300 },
  { text: 'Loading Local Cache...', type: 'info', delay: 500 },
  { text: '  [OK]  847 artifacts recovered', type: 'ok', delay: 200 },
  { text: '', type: 'spacer', delay: 400 },
  { text: 'Dust Index: STABLE', type: 'ok', delay: 600 },
  { text: '', type: 'spacer', delay: 600 },
  { text: 'Good evening, Investigator.', type: 'final', delay: 2000 },
];

// ─── PARTICLES ───
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  alpha: number;
  life: number; maxLife: number;
  kind: 'dust' | 'fiber';
}

function createParticles(w: number, h: number): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < 80; i++) {
    out.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.12,
      vy: -(0.01 + Math.random() * 0.03),
      size: 0.5 + Math.random() * 2,
      alpha: 0.08 + Math.random() * 0.2,
      life: Math.random() * 500,
      maxLife: 400 + Math.random() * 600,
      kind: Math.random() > 0.6 ? 'fiber' : 'dust',
    });
  }
  return out;
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  w: number,
  h: number,
  lampX: number,
  lampY: number
) {
  ctx.clearRect(0, 0, w, h);
  for (const p of particles) {
    p.life++;
    if (p.life > p.maxLife) {
      p.x = Math.random() * w;
      p.y = h + 2;
      p.life = 0;
      p.vx = (Math.random() - 0.5) * 0.12;
      p.vy = -(0.01 + Math.random() * 0.03);
    }
    // drift toward lamp warmth
    const dx = lampX - p.x;
    const dy = lampY - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 350 && dist > 0) {
      p.vx += (dx / dist) * 0.0002;
      p.vy += (dy / dist) * 0.0001;
    }
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < -5) p.x = w + 5;
    if (p.x > w + 5) p.x = -5;

    const lifeRatio = p.life / p.maxLife;
    const fade = lifeRatio < 0.08 ? lifeRatio / 0.08 : lifeRatio > 0.92 ? (1 - lifeRatio) / 0.08 : 1;
    const illum = Math.max(0.25, 1 - dist / 400);
    const a = p.alpha * fade * illum;

    if (p.kind === 'fiber') {
      const ang = Math.atan2(p.vy, p.vx);
      ctx.beginPath();
      ctx.moveTo(p.x - Math.cos(ang) * p.size * 2.5, p.y - Math.sin(ang) * p.size * 2.5);
      ctx.lineTo(p.x + Math.cos(ang) * p.size * 2.5, p.y + Math.sin(ang) * p.size * 2.5);
      ctx.strokeStyle = `rgba(200, 185, 155, ${a})`;
      ctx.lineWidth = 0.4;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 165, 135, ${a})`;
      ctx.fill();
    }
  }
}

// ─── COMPONENT ───
export const BootSequence: React.FC = () => {
  const { isComplete, markComplete } = useBootStore();
  const { booted } = useUIStore();

  const [visibleCount, setVisibleCount] = useState(0);
  const [cursorOn, setCursorOn] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [showPrompt, setShowPrompt] = useState(false);
  const [exiting, setExiting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const timeoutsRef = useRef<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // mouse parallax
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      setMousePos({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // particles
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const resize = () => {
      c.width = c.offsetWidth * window.devicePixelRatio;
      c.height = c.offsetHeight * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      particlesRef.current = createParticles(c.offsetWidth, c.offsetHeight);
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const lampX = c.offsetWidth * (0.25 + mousePos.x * 0.08);
      const lampY = c.offsetHeight * (0.15 + mousePos.y * 0.05);
      drawParticles(ctx, particlesRef.current, c.offsetWidth, c.offsetHeight, lampX, lampY);
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [mousePos]);

  // boot sequence timing
  useEffect(() => {
    if (!booted || isComplete || exiting) return;

    // clear any old timeouts
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    const push = (fn: () => void, ms: number) => {
      timeoutsRef.current.push(window.setTimeout(fn, ms));
    };

    let accumulated = 300; // small initial pause

    LINES.forEach((line, i) => {
      accumulated += line.delay;
      push(() => setVisibleCount(i + 1), accumulated);
    });

    accumulated += 1800;
    push(() => setShowPrompt(true), accumulated);

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [booted, isComplete, exiting]);

  // cursor blink
  useEffect(() => {
    const id = setInterval(() => setCursorOn((v) => !v), 520);
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
      useUIStore.getState().setBooted(true);
    }, 2200);
  }, [exiting, isComplete, markComplete]);

  if (!booted) return null;

  const px = (mousePos.x - 0.5) * 14;
  const py = (mousePos.y - 0.5) * 10;

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.2, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 overflow-hidden select-none"
          style={{ backgroundColor: WALNUT_DEEP }}
        >
          {/* ── ROOM ── */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 70% 55% at 50% 100%, ${WALNUT} 0%, ${WALNUT_DEEP} 65%),
                linear-gradient(180deg, ${WALNUT_DEEP} 0%, ${WALNUT} 100%)
              `,
              transform: `translate(${px * 0.25}px, ${py * 0.25}px)`,
            }}
          />

          {/* wood grain */}
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='300' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.035 0.006' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.25'/%3E%3C/svg%3E")`,
              backgroundSize: '500px 500px',
              mixBlendMode: 'overlay',
            }}
          />

          {/* desk lamp glow */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: '-5%',
              left: '15%',
              width: '55%',
              height: '70%',
              background: `radial-gradient(ellipse at 25% 15%, rgba(255, 230, 180, 0.07) 0%, transparent 50%)`,
              transform: `translate(${px * 0.4}px, ${py * 0.4}px)`,
            }}
          />

          {/* ── MONITOR ASSEMBLY ── */}
          <div
            className="absolute"
            style={{
              top: '50%',
              left: '50%',
              width: 'min(860px, 88vw)',
              height: 'min(640px, 72vh)',
              transform: `translate(-50%, -50%) translate(${px}px, ${py}px)`,
            }}
          >
            {/* ambient shadow on desk */}
            <div
              className="absolute pointer-events-none"
              style={{
                inset: '-4%',
                boxShadow: `
                  0 60px 140px rgba(0,0,0,0.95),
                  0 25px 50px rgba(0,0,0,0.7),
                  inset 0 0 0 1px rgba(255,255,255,0.03)
                `,
                borderRadius: '6px',
              }}
            />

            {/* outer bezel */}
            <div
              className="absolute inset-0 rounded-sm"
              style={{
                background: `
                  linear-gradient(165deg, ${BEZEL_HIGHLIGHT} 0%, ${GUNMETAL} 30%, ${GUNMETAL_DARK} 70%, #151518 100%)
                `,
                padding: 'clamp(10px, 1.8vw, 20px)',
                boxShadow: `
                  inset 0 1px 0 rgba(255,255,255,0.06),
                  inset 0 -1px 0 rgba(0,0,0,0.6),
                  0 4px 12px rgba(0,0,0,0.5)
                `,
              }}
            >
              {/* inner recess */}
              <div
                className="w-full h-full relative overflow-hidden"
                style={{
                  background: '#080805',
                  boxShadow: 'inset 0 3px 12px rgba(0,0,0,0.9), inset 0 0 30px rgba(0,0,0,0.7)',
                  borderRadius: '3px',
                }}
              >
                {/* CRT glass curvature */}
                <div
                  className="absolute inset-0 pointer-events-none z-20"
                  style={{
                    background: `radial-gradient(ellipse 92% 85% at 50% 50%, transparent 40%, rgba(0,0,0,0.35) 100%)`,
                    boxShadow: 'inset 0 0 80px rgba(0,0,0,0.5)',
                  }}
                />

                {/* glass reflection */}
                <div
                  className="absolute pointer-events-none z-20"
                  style={{
                    top: '4%',
                    left: '10%',
                    width: '35%',
                    height: '28%',
                    background: 'linear-gradient(145deg, rgba(255,245,220,0.035) 0%, transparent 55%)',
                    borderRadius: '50%',
                    filter: 'blur(24px)',
                  }}
                />

                {/* scanlines */}
                <div
                  className="absolute inset-0 pointer-events-none z-10 opacity-[0.06]"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0.2) 6px)',
                    backgroundSize: '100% 6px',
                  }}
                />

                {/* chromatic edge */}
                <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    boxShadow: 'inset 0 0 40px rgba(255, 40, 0, 0.015), inset 0 0 60px rgba(0, 30, 255, 0.015)',
                  }}
                />

                {/* ── SCREEN CONTENT ── */}
                <div
                  className="absolute inset-0 z-0 flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-12"
                  style={{
                    fontFamily: '"Courier New", Courier, monospace',
                    fontSize: 'clamp(10px, 1.3vw, 13px)',
                    lineHeight: 1.65,
                    letterSpacing: '0.035em',
                    color: PHOSPHOR,
                  }}
                >
                  {/* ambient phosphor glow behind text */}
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      top: '15%',
                      left: '10%',
                      width: '80%',
                      height: '70%',
                      background: `radial-gradient(ellipse 55% 45% at 50% 50%, ${PHOSPHOR_GHOST} 0%, transparent 70%)`,
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
                        initial={{ opacity: 0, x: -3 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.06 }}
                        className="whitespace-pre-wrap"
                        style={{
                          color,
                          textShadow: isFinal
                            ? `0 0 14px ${IVORY}50, 0 0 32px ${IVORY}25`
                            : line.type === 'ok'
                            ? `0 0 6px ${GREEN_OK}30`
                            : `0 0 8px ${PHOSPHOR}25, 0 0 18px ${PHOSPHOR}12`,
                          fontWeight: isFinal ? 400 : 400,
                          letterSpacing: isFinal ? '0.07em' : '0.035em',
                          minHeight: line.type === 'spacer' ? '0.6em' : '1.65em',
                        }}
                      >
                        {line.text}
                        {isLast && !showPrompt && cursorOn && (
                          <span
                            className="inline-block ml-0.5"
                            style={{
                              width: '7px',
                              height: '1.15em',
                              backgroundColor: isFinal ? IVORY : PHOSPHOR,
                              opacity: 0.75,
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
                      transition={{ delay: 0.4, duration: 0.8 }}
                      className="mt-5"
                    >
                      <button
                        onClick={handleEnter}
                        className="text-left bg-transparent border-0 p-0 cursor-pointer"
                        style={{
                          fontFamily: 'inherit',
                          fontSize: 'inherit',
                          color: PHOSPHOR_DIM,
                          letterSpacing: '0.04em',
                        }}
                      >
                        Press ENTER to access the Archive
                        {cursorOn && (
                          <span
                            className="inline-block ml-0.5"
                            style={{
                              width: '7px',
                              height: '1.15em',
                              backgroundColor: PHOSPHOR_DIM,
                              opacity: 0.6,
                              verticalAlign: 'text-bottom',
                            }}
                          />
                        )}
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* dust canvas */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 z-30 pointer-events-none"
                  style={{ width: '100%', height: '100%' }}
                />

                {/* heavy vignette */}
                <div
                  className="absolute inset-0 pointer-events-none z-20"
                  style={{ boxShadow: 'inset 0 0 100px rgba(0,0,0,0.55)' }}
                />
              </div>
            </div>

            {/* model plate */}
            <div
              className="absolute pointer-events-none"
              style={{
                bottom: '-26px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#3a3a3e',
                fontFamily: 'monospace',
                fontSize: '8px',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              Archive Terminal — Model 7-B
            </div>
          </div>

          {/* foreground desk edge */}
          <div
            className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};