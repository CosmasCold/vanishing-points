'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBootStore } from '@/state/bootStore';
import { useUIStore } from '@/state/uiStore';

// ─── CONFIG ───

const PHOSPHOR_AMBER = '#ffb000';
const PHOSPHOR_DIM = '#8a6000';
const PHOSPHOR_GHOST = '#4a3500';
const WALNUT_DARK = '#1e1610';
const WALNUT_MID = '#2a2018';
const WALNUT_LIGHT = '#3a2e22';
const GUNMETAL = '#1a1a1e';
const TUNGSTEN_WARM = '#ffecd2';
const IVORY_AGED = '#e8e0d0';

interface BootLine {
  text: string;
  delay: number;
  type: 'info' | 'ok' | 'warn' | 'system' | 'final';
}

const BOOT_SEQUENCE: BootLine[] = [
  { text: '', delay: 800, type: 'system' }, // Initial pause — room darkness
  { text: 'POWER RESTORED', delay: 600, type: 'system' },
  { text: 'Loading Archive Kernel...', delay: 900, type: 'info' },
  { text: '  [OK]  Kernel v4.2.1-stable', delay: 400, type: 'ok' },
  { text: '  [OK]  Memory banks 1–16', delay: 300, type: 'ok' },
  { text: '  [OK]  Magnetic drum array', delay: 500, type: 'ok' },
  { text: '', delay: 400, type: 'system' },
  { text: 'Initializing Atlas...', delay: 1200, type: 'info' },
  { text: '  [OK]  Geodetic reference frame loaded', delay: 400, type: 'ok' },
  { text: '  [OK]  159 locations indexed', delay: 300, type: 'ok' },
  { text: '  [WARN]  Coordinate drift detected in sector 7-B', delay: 600, type: 'warn' },
  { text: '', delay: 400, type: 'system' },
  { text: 'Checking Integrity...', delay: 1000, type: 'info' },
  { text: '  [OK]  Document repository', delay: 300, type: 'ok' },
  { text: '  [OK]  Evidence chain verified', delay: 300, type: 'ok' },
  { text: '  [OK]  BUNKER_7 relay stable', delay: 500, type: 'ok' },
  { text: '', delay: 400, type: 'system' },
  { text: 'Loading Investigations...', delay: 800, type: 'info' },
  { text: '  [OK]  3 active cases', delay: 300, type: 'ok' },
  { text: '  [OK]  1 pending review', delay: 300, type: 'ok' },
  { text: '', delay: 400, type: 'system' },
  { text: 'Synchronizing Evidence...', delay: 900, type: 'info' },
  { text: '  [OK]  Cross-reference matrix built', delay: 400, type: 'ok' },
  { text: '', delay: 400, type: 'system' },
  { text: 'Loading Local Cache...', delay: 700, type: 'info' },
  { text: '  [OK]  847 artifacts recovered', delay: 300, type: 'ok' },
  { text: '', delay: 600, type: 'system' },
  { text: 'Dust Index: STABLE', delay: 800, type: 'ok' },
  { text: '', delay: 1000, type: 'system' },
  { text: 'Good evening, Investigator.', delay: 1500, type: 'final' },
];

// ─── DUST PARTICLE SYSTEM ───

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  type: 'fiber' | 'dust' | 'ash';
  life: number;
  maxLife: number;
}

function initParticles(width: number, height: number, count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const typeRoll = Math.random();
    const type: Particle['type'] = typeRoll < 0.5 ? 'dust' : typeRoll < 0.8 ? 'fiber' : 'ash';
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.08 - 0.02,
      size: type === 'fiber' ? 0.5 + Math.random() * 1.5 : type === 'ash' ? 0.3 + Math.random() * 0.8 : 0.8 + Math.random() * 2,
      alpha: 0.1 + Math.random() * 0.25,
      type,
      life: 0,
      maxLife: 300 + Math.random() * 600,
    });
  }
  return particles;
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], width: number, height: number, lampX: number, lampY: number) {
  ctx.clearRect(0, 0, width, height);

  for (const p of particles) {
    p.life++;
    if (p.life > p.maxLife) {
      p.x = Math.random() * width;
      p.y = height + 5;
      p.life = 0;
      p.vx = (Math.random() - 0.5) * 0.15;
      p.vy = -(0.01 + Math.random() * 0.04);
    }

    // Gentle air current toward lamp warmth
    const dx = lampX - p.x;
    const dy = lampY - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 300) {
      p.vx += (dx / dist) * 0.0003;
      p.vy += (dy / dist) * 0.0002;
    }

    p.x += p.vx;
    p.y += p.vy;

    // Wrap horizontal
    if (p.x < -10) p.x = width + 10;
    if (p.x > width + 10) p.x = -10;

    const lifeRatio = p.life / p.maxLife;
    const fade = lifeRatio < 0.1 ? lifeRatio / 0.1 : lifeRatio > 0.9 ? (1 - lifeRatio) / 0.1 : 1;
    const alpha = p.alpha * fade;

    // Illumination by lamp
    const lampDist = Math.sqrt((p.x - lampX) ** 2 + (p.y - lampY) ** 2);
    const illumination = Math.max(0.3, 1 - lampDist / 400);

    ctx.beginPath();
    if (p.type === 'fiber') {
      // Elongated paper fiber
      const angle = Math.atan2(p.vy, p.vx);
      ctx.moveTo(p.x - Math.cos(angle) * p.size * 2, p.y - Math.sin(angle) * p.size * 2);
      ctx.lineTo(p.x + Math.cos(angle) * p.size * 2, p.y + Math.sin(angle) * p.size * 2);
      ctx.strokeStyle = `rgba(200, 185, 160, ${alpha * illumination})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    } else if (p.type === 'ash') {
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(120, 110, 100, ${alpha * illumination})`;
      ctx.fill();
    } else {
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 165, 140, ${alpha * illumination})`;
      ctx.fill();
    }
  }
}

// ─── COMPONENT ───

export const BootSequence: React.FC = () => {
  const { booted } = useUIStore();
  const { isComplete, markComplete } = useBootStore();
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [phase, setPhase] = useState<'darkness' | 'power' | 'warmup' | 'ready' | 'done'>('darkness');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse parallax for seated perspective
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Dust particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      particlesRef.current = initParticles(canvas.offsetWidth, canvas.offsetHeight, 120);
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      const lampX = canvas.offsetWidth * (0.3 + mousePos.x * 0.1);
      const lampY = canvas.offsetHeight * (0.2 + mousePos.y * 0.05);
      drawParticles(ctx, particlesRef.current, canvas.offsetWidth, canvas.offsetHeight, lampX, lampY);
      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [mousePos]);

  // Boot sequence timing
  useEffect(() => {
    if (!booted || isComplete) return;

    let cancelled = false;
    let lineIndex = 0;

    const runSequence = async () => {
      setPhase('darkness');
      await sleep(BOOT_SEQUENCE[0].delay);
      if (cancelled) return;

      setPhase('power');
      await sleep(400);
      if (cancelled) return;

      setPhase('warmup');

      for (let i = 1; i < BOOT_SEQUENCE.length; i++) {
        if (cancelled) return;
        await sleep(BOOT_SEQUENCE[i].delay);
        if (cancelled) return;
        setVisibleLines(i + 1);
        lineIndex = i;
      }

      setPhase('ready');
      await sleep(2000);
      if (cancelled) return;

      setPhase('done');
      await sleep(800);
      if (cancelled) return;

      markComplete();
      useUIStore.getState().setBooted(true);
    };

    runSequence();

    return () => { cancelled = true; };
  }, [booted, isComplete, markComplete]);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(interval);
  }, []);

  // Skip on keypress
  useEffect(() => {
    const handleKey = () => {
      if (phase !== 'done' && phase !== 'darkness') {
        setVisibleLines(BOOT_SEQUENCE.length);
        setPhase('ready');
        setTimeout(() => {
          markComplete();
          useUIStore.getState().setBooted(true);
        }, 600);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, markComplete]);

  if (!booted) return null;

  const parallaxX = (mousePos.x - 0.5) * 12;
  const parallaxY = (mousePos.y - 0.5) * 8;

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 overflow-hidden"
          style={{ backgroundColor: WALNUT_DARK }}
        >
          {/* ─── ROOM ENVIRONMENT ─── */}

          {/* Walnut desk surface */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 80% 60% at 50% 100%, ${WALNUT_MID} 0%, ${WALNUT_DARK} 70%),
                linear-gradient(180deg, ${WALNUT_DARK} 0%, ${WALNUT_MID} 100%)
              `,
              transform: `translate(${parallaxX * 0.3}px, ${parallaxY * 0.3}px)`,
            }}
          />

          {/* Desk grain texture */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04 0.008' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.3'/%3E%3C/svg%3E")`,
              backgroundSize: '400px 400px',
              mixBlendMode: 'overlay',
            }}
          />

          {/* Tungsten desk lamp glow (warm, directional) */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: '-10%',
              left: '20%',
              width: '60%',
              height: '80%',
              background: `radial-gradient(ellipse at 30% 20%, rgba(255, 220, 160, 0.08) 0%, transparent 55%)`,
              transform: `translate(${parallaxX * 0.5}px, ${parallaxY * 0.5}px)`,
            }}
          />

          {/* ─── MONITOR BEZEL ─── */}

          <div
            className="absolute"
            style={{
              top: '50%',
              left: '50%',
              width: 'min(900px, 85vw)',
              height: 'min(680px, 75vh)',
              transform: `translate(-50%, -50%) translate(${parallaxX}px, ${parallaxY}px)`,
            }}
          >
            {/* Outer gunmetal bezel */}
            <div
              className="absolute inset-0 rounded-sm"
              style={{
                background: `
                  linear-gradient(145deg, #2a2a2e 0%, ${GUNMETAL} 40%, #151518 100%)
                `,
                boxShadow: `
                  0 40px 120px rgba(0,0,0,0.9),
                  0 8px 24px rgba(0,0,0,0.6),
                  inset 0 1px 0 rgba(255,255,255,0.04),
                  inset 0 -1px 0 rgba(0,0,0,0.5)
                `,
                padding: 'clamp(12px, 2vw, 24px)',
              }}
            >
              {/* Inner bezel — slightly recessed */}
              <div
                className="w-full h-full relative overflow-hidden"
                style={{
                  background: '#0a0a08',
                  boxShadow: `
                    inset 0 2px 8px rgba(0,0,0,0.8),
                    inset 0 0 40px rgba(0,0,0,0.6)
                  `,
                  borderRadius: '2px',
                }}
              >
                {/* CRT glass curvature simulation */}
                <div
                  className="absolute inset-0 pointer-events-none z-20"
                  style={{
                    background: `
                      radial-gradient(ellipse 90% 80% at 50% 50%, transparent 50%, rgba(0,0,0,0.25) 100%)
                    `,
                    boxShadow: 'inset 0 0 60px rgba(0,0,0,0.4)',
                  }}
                />

                {/* Glass reflection — subtle lamp bounce */}
                <div
                  className="absolute pointer-events-none z-20"
                  style={{
                    top: '5%',
                    left: '15%',
                    width: '30%',
                    height: '25%',
                    background: 'linear-gradient(135deg, rgba(255,245,220,0.03) 0%, transparent 60%)',
                    borderRadius: '50%',
                    filter: 'blur(20px)',
                  }}
                />

                {/* Scanlines */}
                <div
                  className="absolute inset-0 pointer-events-none z-10 opacity-[0.07]"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
                    backgroundSize: '100% 4px',
                  }}
                />

                {/* Subtle chromatic aberration at edges */}
                <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    boxShadow: 'inset 0 0 30px rgba(255, 60, 0, 0.02), inset 0 0 50px rgba(0, 40, 255, 0.02)',
                  }}
                />

                {/* ─── PHOSPHOR SCREEN CONTENT ─── */}
                <div
                  className="absolute inset-0 z-0 flex flex-col justify-center px-8 py-10"
                  style={{
                    fontFamily: '"Courier New", "Courier", monospace',
                    fontSize: 'clamp(11px, 1.4vw, 14px)',
                    lineHeight: 1.7,
                    letterSpacing: '0.04em',
                    color: PHOSPHOR_AMBER,
                    textShadow: `
                      0 0 8px ${PHOSPHOR_AMBER}40,
                      0 0 20px ${PHOSPHOR_AMBER}20
                    `,
                  }}
                >
                  {/* Screen glow bloom */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse 60% 50% at 50% 45%, ${PHOSPHOR_AMBER}08 0%, transparent 70%)`,
                    }}
                  />

                  {BOOT_SEQUENCE.slice(0, visibleLines).map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.08, ease: 'linear' }}
                      className="whitespace-pre-wrap"
                      style={{
                        color:
                          line.type === 'ok'
                            ? '#6a9a5a'
                            : line.type === 'warn'
                            ? '#b8943a'
                            : line.type === 'final'
                            ? IVORY_AGED
                            : line.type === 'system'
                            ? PHOSPHOR_DIM
                            : PHOSPHOR_AMBER,
                        textShadow:
                          line.type === 'final'
                            ? `0 0 12px ${IVORY_AGED}60, 0 0 30px ${IVORY_AGED}30`
                            : undefined,
                        fontWeight: line.type === 'final' ? 400 : 400,
                        letterSpacing: line.type === 'final' ? '0.08em' : '0.04em',
                      }}
                    >
                      {line.text}
                      {i === visibleLines - 1 && cursorVisible && phase !== 'done' && (
                        <span
                          className="inline-block ml-0.5"
                          style={{
                            width: '8px',
                            height: '1.1em',
                            backgroundColor:
                              line.type === 'final' ? IVORY_AGED : PHOSPHOR_AMBER,
                            opacity: 0.8,
                            verticalAlign: 'text-bottom',
                          }}
                        />
                      )}
                    </motion.div>
                  ))}

                  {phase === 'ready' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5, duration: 1 }}
                      className="mt-6"
                      style={{ color: PHOSPHOR_DIM, fontSize: '0.85em' }}
                    >
                      Press any key to enter the Archive...
                    </motion.div>
                  )}
                </div>

                {/* ─── DUST PARTICLE LAYER ─── */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 z-30 pointer-events-none"
                  style={{ width: '100%', height: '100%' }}
                />

                {/* ─── VIGNETTE ─── */}
                <div
                  className="absolute inset-0 pointer-events-none z-20"
                  style={{
                    boxShadow: 'inset 0 0 120px rgba(0,0,0,0.6)',
                  }}
                />
              </div>
            </div>

            {/* Monitor brand plate */}
            <div
              className="absolute pointer-events-none"
              style={{
                bottom: '-28px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#3a3a3e',
                fontFamily: 'monospace',
                fontSize: '9px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}
            >
              Archive Terminal — Model 7-B
            </div>
          </div>

          {/* ─── ROOM FOREGROUND ─── */}

          {/* Desk edge shadow */}
          <div
            className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
            }}
          />

          {/* Ambient occlusion — monitor casts shadow on desk */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: '50%',
              left: '50%',
              width: 'min(920px, 88vw)',
              height: 'min(700px, 78vh)',
              transform: `translate(-50%, -45%) translate(${parallaxX * 1.2}px, ${parallaxY * 1.2}px)`,
              boxShadow: '0 80px 160px rgba(0,0,0,0.95), 0 30px 60px rgba(0,0,0,0.7)',
              borderRadius: '4px',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}