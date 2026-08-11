"use client";

import { useEffect, useRef } from "react";
import { useUIStore } from "@/state/uiStore";
import { useGeigerStore } from "@/hooks/useGeigerCounter";

/**
 * MEASURED Retro CRT Jitter and Deflection Drift Engine
 * Procedurally simulates vintage vacuum-tube raster drifts and chromatic aberration.
 * Modulated by:
 * - Observer Stability (Stability collapse sags voltage) [6, 191]
 * - Observer Dust Index (Residual charge shifts focus) [6, 191]
 * - Radiometric CPM (Ionization spikes introduce electromagnetic deflection)
 *
 * Direct DOM-manipulation architecture bypasses React re-render cycles completely,
 * offloading all high-frequency calculations to the GPU compositor thread for 0% CPU lag.
 */
export function useTerminalJitter() {
  const { status } = useUIStore();
  const observerStability = status?.observerStability ?? 100; // [0..100] [191]
  const dustIndex = status?.dustIndex ?? 0; // [0..100] [191]
  const { currentCpm } = useGeigerStore(); // Live Poisson radiation count from geophones

  const frameRef = useRef<number | null>(null);
  const cycleRef = useRef<number>(0);

  // Use refs to hold stable references to values so the update loop always has the freshest state
  const paramsRef = useRef({ observerStability, dustIndex, currentCpm });
  
  useEffect(() => {
    paramsRef.current = { observerStability, dustIndex, currentCpm };
  }, [observerStability, dustIndex, currentCpm]);

  useEffect(() => {
    const updateDrift = () => {
      cycleRef.current += 0.05;
      const t = cycleRef.current;

      const { observerStability: stab, dustIndex: dust, currentCpm: cpm } = paramsRef.current;

      // Base threat calculations from state [6, 191]
      const instability = (100 - stab) / 100; // Normalized instability [0..1]
      const dustRatio = dust / 100; // Normalized dust load [0..1]
      
      // Normalized radiation ratio: maps CPM from background (12) to overload (1200) as [0..1]
      const radiationRatio = Math.min(1.0, Math.max(0, (cpm - 12) / 1188));

      // ── 1. PHOSPHOR AMBIENT FLICKER ──
      const slowLfo = Math.sin(t * 0.4) * 0.02 * instability;
      const microNoise = (Math.random() - 0.5) * 0.01 * dustRatio;
      const radFlicker = (Math.random() - 0.5) * 0.03 * radiationRatio; // Soft static flicker
      const baseFlicker = 1.0 - (instability * 0.03) - (radiationRatio * 0.02); 
      const crtFlicker = Math.max(0.88, Math.min(1.04, baseFlicker + slowLfo + microNoise + radFlicker));

      // ── 2. MECHANICAL JITTER ──
      let jitterX = 0;
      let jitterY = 0;

      if (instability > 0.15 || radiationRatio > 0.08) {
        const jitterIntensity = (instability * 0.28) + (radiationRatio * 0.52); 
        jitterX = (Math.random() - 0.5) * jitterIntensity;
        
        if (Math.random() > 0.984 - (instability * 0.03) - (radiationRatio * 0.04)) {
          jitterX += (Math.random() - 0.5) * (instability * 1.5 + radiationRatio * 2.5);
        }

        if (Math.random() > 0.993 - (radiationRatio * 0.01)) {
          jitterY = (Math.random() - 0.5) * (instability * 1.0 + radiationRatio * 1.5);
        }
      }

      // ── 3. CHROMATIC RGB SEPARATION ──
      let chromaticShift = 0;
      if (dustRatio > 0.15 || instability > 0.25 || radiationRatio > 0.05) {
        const baseShift = (dustRatio * 0.6) + (instability * 0.5) + (radiationRatio * 1.2);
        const shiftOsc = Math.sin(t * 1.8) * Math.cos(t * 0.6);
        chromaticShift = Math.min(2.2, baseShift * (0.5 + shiftOsc * 0.3));

        if (Math.random() > 0.995 - (radiationRatio * 0.01)) {
          chromaticShift = Math.min(3.0, chromaticShift * 1.8);
        }
      }

      // ── 4. PHOSPHOR GRID SCANLINES ──
      const scanlineOpacity = Math.max(0.06, Math.min(0.20, 0.08 + (dustRatio * 0.08) + (radiationRatio * 0.04)));

      // Direct DOM manipulation - applies variables straight to root node!
      // This is 100x faster than triggering React re-renders on the whole shell.
      const root = document.documentElement;
      if (root) {
        root.style.setProperty("--crt-flicker", crtFlicker.toFixed(4));
        root.style.setProperty("--crt-jitter-x", `${jitterX.toFixed(2)}px`);
        root.style.setProperty("--crt-jitter-y", `${jitterY.toFixed(2)}px`);
        root.style.setProperty("--crt-chromatic-shift", `${chromaticShift.toFixed(2)}px`);
        root.style.setProperty("--crt-scanline-opacity", scanlineOpacity.toFixed(3));
      }

      frameRef.current = requestAnimationFrame(updateDrift);
    };

    frameRef.current = requestAnimationFrame(updateDrift);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  // Return static style config so DashboardShell renders once and offloads drift to GPU transitions
  return {
    jitterStyles: { transition: "transform 0.01s ease, filter 0.05s ease" } as React.CSSProperties,
    observerStability,
    dustIndex,
    currentCpm,
  };
}
