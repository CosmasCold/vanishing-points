// components/archive/ArchiveShell.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { useGameState } from '@/logic/gameState';
import { eventBus } from '@/logic/eventBus';
import { initPersistence } from '@/logic/persistence';
import { useWitchingHour } from '@/hooks/useWitchingHour';
import { DustStorm } from '@/components/effects/DustStorm';

interface ArchiveShellProps {
  children: React.ReactNode;
  className?: string;
}

export function ArchiveShell({ children, className = '' }: ArchiveShellProps) {
  const state = useGameState();
  const shellRef = useRef<HTMLDivElement>(null);
  const isWitching = useWitchingHour();

  // Initialize persistence on mount
  useEffect(() => {
    const cleanup = initPersistence();
    return cleanup;
  }, []);

  // Phosphor pulse on corruption threshold crossing
  useEffect(() => {
    const unsub = eventBus.on('corruption:threshold', () => {
      if (!shellRef.current) return;
      shellRef.current.style.setProperty('--phosphor-scale-x', '1.004');
      shellRef.current.style.setProperty('--phosphor-brightness', '1.02');
      setTimeout(() => {
        if (!shellRef.current) return;
        shellRef.current.style.setProperty('--phosphor-scale-x', '1');
        shellRef.current.style.setProperty('--phosphor-brightness', '1');
      }, 800);
    });
    return unsub;
  }, []);

  // Time-of-day ambient tint
  const ambientTint = {
    dawn: '#181410',
    day: '#0c0a08',
    dusk: '#14100c',
    night: '#0a0806',
  }[state.timeOfDay];

  const corruptionIntensity = state.corruptionStage / 4;

  return (
    <div
      ref={shellRef}
      className={`relative min-h-screen overflow-hidden ${className}`}
      style={{
        backgroundColor: '#0c0a08',
        color: '#ddd0bc',
        fontFamily: "'Crimson Text', Georgia, serif",
        '--vp-ink': '#0c0a08',
        '--vp-ink-soft': '#14100c',
        '--vp-ink-warm': '#1a1510',
        '--vp-parchment': '#ddd0bc',
        '--vp-parchment-dim': '#b8a88c',
        '--vp-sepia': '#9a8a72',
        '--vp-sepia-dim': '#7a6e5e',
        '--vp-ember': '#c4785a',
        '--vp-mold': '#5a6b5a',
        '--vp-silver': '#8a9a9a',
        '--vp-blood': '#8a3a2a',
        '--vp-cursor': '#c4b8a4',
        '--phosphor-scale-x': '1',
        '--phosphor-brightness': '1',
        transform: 'scaleX(var(--phosphor-scale-x))',
        filter: 'brightness(var(--phosphor-brightness))',
        transition: 'transform 800ms ease, filter 800ms ease',
      } as React.CSSProperties}
    >
      {/* Layer 1: Time-of-day ambient tint */}
      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          backgroundColor: ambientTint,
          transition: 'background-color 2000ms ease',
        }}
      />

      {/* Layer 2: Content */}
      <main className="relative z-20 min-h-screen">{children}</main>

      {/* Layer 3: Dust Storm */}
      <DustStorm dustLevel={state.dust} corruptionStage={state.corruptionStage} />

      {/* Layer 4: Corruption Bloom */}
      {state.corruptionStage >= 2 && (
        <div
          className="pointer-events-none fixed inset-0 z-30 mix-blend-screen"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(196, 120, 90, ${0.03 + corruptionIntensity * 0.08}) 0%, transparent 70%)`,
            animation: 'bloomPulse 8s ease-in-out infinite',
          }}
        />
      )}

      {/* Layer 5: Paper Texture */}
      <div
        className="pointer-events-none fixed inset-0 z-40 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

            {/* Layer 6: CRT Characteristics (inline) */}
      <div className="pointer-events-none fixed inset-0 z-45">
        <div className="absolute inset-0" style={{ background: `repeating-linear-gradient(0deg, rgba(0,0,0,0.06), rgba(0,0,0,0.06) 1px, transparent 1px, transparent 4px)` }} />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.01)', transition: 'opacity 0.05s' }} />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(196, 120, 90, 0.005)', mixBlendMode: 'screen' }} />
      </div>

      {/* Layer 7: Edge Vignette */}
      <div
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(8, 6, 4, ${0.4 + corruptionIntensity * 0.3}) 100%)`,
        }}
      />

      {/* Layer 8: Witching Hour Banner */}
      {isWitching && (
        <div className="pointer-events-none fixed inset-0 z-[60] flex items-start justify-center pt-8">
          <div
            className="border border-[#c4785a40] bg-[#0c0a08e6] px-6 py-3"
            style={{
              animation: 'witchingFade 4s ease-in-out infinite',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#c4785a',
            }}
          >
            ⚠ The grid resonates. Coordinates shift. 03:14
          </div>
        </div>
      )}

      {/* Layer 9: UI Chrome corruption jitter */}
      {state.corruptionStage >= 4 && (
        <style>{`
          @keyframes uiJitter {
            0%, 100% { transform: translate(0, 0); }
            0.3% { transform: translate(1px, 0); }
            0.6% { transform: translate(-1px, 1px); }
          }
          .corruption-jitter {
            animation: uiJitter 3.33s steps(1) infinite;
          }
        `}</style>
      )}

      <style>{`
        @keyframes bloomPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes witchingFade {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}