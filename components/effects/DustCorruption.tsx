'use client';

import React, { useMemo } from 'react';
import { useUIStore, BUNKER7_THRESHOLDS } from '@/state/uiStore';
import { microform } from '@/styles/theme';

export const DustCorruption: React.FC = () => {
  const { status } = useUIStore();
  const dust = status.dustIndex;

  const corruption = useMemo(() => {
    if (dust >= BUNKER7_THRESHOLDS.UNSTABLE) {
      return {
        blur: 1.2,
        warmth: 0.1,
        bulbFlicker: 0.07,
        vignette: 0.55,
        dustMotes: 0.35,
        focusShift: 1.5,
      };
    }
    if (dust >= BUNKER7_THRESHOLDS.STABLE) {
      return {
        blur: 0.4,
        warmth: 0.04,
        bulbFlicker: 0.025,
        vignette: 0.28,
        dustMotes: 0.15,
        focusShift: 0.6,
      };
    }
    return {
      blur: 0,
      warmth: 0,
      bulbFlicker: 0,
      vignette: 0.06,
      dustMotes: 0,
      focusShift: 0,
    };
  }, [dust]);

  const flickerDuration = useMemo(() => 0.15 + Math.random() * 0.25, [dust]);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[60]"
      style={{
        opacity: corruption.bulbFlicker > 0 ? undefined : 1,
        animation: corruption.bulbFlicker > 0
          ? `bulbFlicker ${flickerDuration}s infinite alternate ease-in-out`
          : undefined,
      }}
    >
      {/* Optical defocus blur */}
      {corruption.blur > 0 && (
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: `blur(${corruption.blur}px)`,
            WebkitBackdropFilter: `blur(${corruption.blur}px)`,
          }}
        />
      )}

      {/* Halogen warmth drift */}
      {corruption.warmth > 0 && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: `rgba(255, 170, 85, ${corruption.warmth})`,
            mixBlendMode: 'overlay',
          }}
        />
      )}

      {/* Dust motes — organic floating particles */}
      {corruption.dustMotes > 0 && (
        <>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 30%, rgba(212, 197, 169, ${corruption.dustMotes * 0.6}) 0%, transparent 50%),
                                 radial-gradient(circle at 70% 60%, rgba(212, 197, 169, ${corruption.dustMotes * 0.4}) 0%, transparent 40%),
                                 radial-gradient(circle at 40% 80%, rgba(212, 197, 169, ${corruption.dustMotes * 0.5}) 0%, transparent 45%)`,
              animation: 'dustMoteDrift 8s ease-in-out infinite alternate',
            }}
          />
          <style>{`
            @keyframes dustMoteDrift {
              0% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(12px, -8px) scale(1.05); }
              66% { transform: translate(-6px, 10px) scale(0.95); }
              100% { transform: translate(4px, 4px) scale(1); }
            }
          `}</style>
        </>
      )}

      {/* Light falloff vignette (warm, optical) */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(26, 22, 18, ${corruption.vignette}) 100%)`,
          mixBlendMode: 'multiply',
        }}
      />

      {/* Halogen bulb flicker keyframes */}
      {corruption.bulbFlicker > 0 && (
        <style>{`
          @keyframes bulbFlicker {
            0% { opacity: 1; }
            10% { opacity: ${1 - corruption.bulbFlicker * 0.3}; }
            20% { opacity: 1; }
            55% { opacity: ${1 - corruption.bulbFlicker}; }
            60% { opacity: ${1 - corruption.bulbFlicker * 0.5}; }
            100% { opacity: 1; }
          }
        `}</style>
      )}
    </div>
  );
};