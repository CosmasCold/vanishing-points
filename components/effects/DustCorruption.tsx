'use client';

import React, { useMemo } from 'react';
import { useUIStore, BUNKER7_THRESHOLDS } from '@/state/uiStore';

export const DustCorruption: React.FC = () => {
  const { status } = useUIStore();
  const dust = status.dustIndex;

  const corruption = useMemo(() => {
    if (dust >= BUNKER7_THRESHOLDS.UNSTABLE) {
      return {
        scanlineOpacity: 0.35,
        flickerIntensity: 0.08,
        chromaticShift: 3,
        textJitter: 0.4,
        vignetteStrength: 0.6,
        hueRotate: 15,
      };
    }
    if (dust >= BUNKER7_THRESHOLDS.STABLE) {
      return {
        scanlineOpacity: 0.2,
        flickerIntensity: 0.03,
        chromaticShift: 1.5,
        textJitter: 0.15,
        vignetteStrength: 0.3,
        hueRotate: 5,
      };
    }
    return {
      scanlineOpacity: 0.08,
      flickerIntensity: 0,
      chromaticShift: 0,
      textJitter: 0,
      vignetteStrength: 0.1,
      hueRotate: 0,
    };
  }, [dust]);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[60]"
      style={{
        mixBlendMode: 'screen',
        opacity: corruption.flickerIntensity > 0 ? undefined : 1,
        animation: corruption.flickerIntensity > 0
          ? `dustFlicker ${0.1 + Math.random() * 0.2}s infinite alternate`
          : undefined,
      }}
    >
      {/* Scanlines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)',
          backgroundSize: '100% 4px',
          opacity: corruption.scanlineOpacity,
        }}
      />

      {/* Chromatic aberration layers */}
      {corruption.chromaticShift > 0 && (
        <>
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: 'rgba(255, 0, 0, 0.03)',
              transform: `translateX(${corruption.chromaticShift}px)`,
              mixBlendMode: 'screen',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: 'rgba(0, 255, 255, 0.03)',
              transform: `translateX(-${corruption.chromaticShift}px)`,
              mixBlendMode: 'screen',
            }}
          />
        </>
      )}

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle, transparent 50%, rgba(20, 20, 18, ${corruption.vignetteStrength}) 100%)`,
        }}
      />

      {/* Hue rotation */}
      {corruption.hueRotate > 0 && (
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: `hue-rotate(${corruption.hueRotate}deg)`,
            WebkitBackdropFilter: `hue-rotate(${corruption.hueRotate}deg)`,
          }}
        />
      )}

      {/* Global text jitter injection */}
      {corruption.textJitter > 0 && (
        <style>{`
          .dust-jitter {
            animation: textJitter ${0.3 + Math.random() * 0.5}s infinite steps(2);
          }
          @keyframes textJitter {
            0% { transform: translate(0, 0); }
            25% { transform: translate(${corruption.textJitter}px, -${corruption.textJitter}px); }
            50% { transform: translate(-${corruption.textJitter}px, ${corruption.textJitter}px); }
            75% { transform: translate(${corruption.textJitter}px, ${corruption.textJitter}px); }
            100% { transform: translate(0, 0); }
          }
          @keyframes dustFlicker {
            0% { opacity: 1; }
            100% { opacity: ${1 - corruption.flickerIntensity}; }
          }
        `}</style>
      )}
    </div>
  );
};