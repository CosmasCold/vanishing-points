"use client";

import { useEffect, useRef, useState } from "react";
import { useUIStore } from "@/state/uiStore";
import { useGeigerStore } from "@/hooks/useGeigerCounter";

interface JitterStyles {
  "--crt-flicker": string;
  "--crt-jitter-x": string;
  "--crt-jitter-y": string;
  "--crt-chromatic-shift": string;
  "--crt-scanline-opacity": number;
  transition: string;
}

/**
 * Custom hook to procedurally calculate and inject retro CRT electromagnetic drift,
 * screen scanline jitter, phosphor decay flicker, and chromatic aberration splits.
 * Binds directly to global Zustand state metrics (observerStability & dustIndex) AND
 * the unified Geiger Counter CPM (currentCpm) to warp typography during radiation spikes [6, 191].
 * Leverages high-performance CSS Custom Properties to offload all high-frequency animation 
 * recalculations directly to the GPU compositor thread, preventing expensive React DOM paint loops.
 */
export function useTerminalJitter() {
  const { status } = useUIStore();
  const observerStability = status?.observerStability ?? 100; // [0..100] [191]
  const dustIndex = status?.dustIndex ?? 0; // [0..100] [191]
  const { currentCpm } = useGeigerStore(); // Live Poisson radiation count

  const [cssVars, setCssVars] = useState<JitterStyles>({
    "--crt-flicker": "1",
    "--crt-jitter-x": "0px",
    "--crt-jitter-y": "0px",
    "--crt-chromatic-shift": "0px",
    "--crt-scanline-opacity": 0.12,
    transition: "transform 150ms ease, opacity 200ms ease",
  });

  const frameRef = useRef<number | null>(null);
  const cycleRef = useRef<number>(0);

  useEffect(() => {
    const updateDrift = () => {
      cycleRef.current += 0.05;
      const t = cycleRef.current;

      // Base threat calculations from state [6, 191]
      const instability = (100 - observerStability) / 100; // Normalized instability [0..1]
      const dustRatio = dustIndex / 100; // Normalized dust load [0..1]
      
      // Normalized radiation ratio: maps CPM from background (12) to overload (1200) as [0..1]
      const radiationRatio = Math.min(1.0, Math.max(0, (currentCpm - 12) / 1188));

      // ── 1. PROCEDURAL PHOSPHOR FLICKER (Slow LFO + micro-noise + radiation ionization) ──
      // Simulates unstable high-voltage power supplies and gas discharge under radioactive exposure
      const slowLfo = Math.sin(t * 0.4) * 0.04 * instability;
      const microNoise = (Math.random() - 0.5) * 0.015 * dustRatio;
      const radFlicker = (Math.random() - 0.5) * 0.08 * radiationRatio; // Heavy ionization chatter
      const baseFlicker = 1.0 - (instability * 0.06) - (radiationRatio * 0.04); 
      const crtFlicker = Math.max(0.55, Math.min(1.2, baseFlicker + slowLfo + microNoise + radFlicker));

      // ── 2. GEODETIC SYNC SLIPPAGE (CRT Horizontal/Vertical Jitter) ──
      // Screen shakes violently on high instability and heavy radioactive electromagnetic interference (EMI)
      let jitterX = 0;
      let jitterY = 0;

      if (instability > 0.15 || radiationRatio > 0.08) {
        // Continuous high-frequency shiver
        const jitterIntensity = (instability * 1.4) + (radiationRatio * 2.8); // High radiation adds violent vibration
        jitterX = (Math.random() - 0.5) * jitterIntensity;
        
        // Rare horizontal tear sync-slip spikes
        if (Math.random() > 0.982 - (instability * 0.05) - (radiationRatio * 0.08)) {
          jitterX += (Math.random() - 0.5) * (instability * 12 + radiationRatio * 24);
        }

        // Vertical hold drift (Y jitter) representing static magnetic deflection warping
        if (Math.random() > 0.991 - (radiationRatio * 0.03)) {
          jitterY = (Math.random() - 0.5) * (instability * 8 + radiationRatio * 14);
        }
      }

      // ── 3. CHROMATIC RGB SEPARATION ABERRATION ──
      // Simulates deflection yoke convergence errors causing color splitting
      let chromaticShift = 0;
      if (dustRatio > 0.2 || instability > 0.3 || radiationRatio > 0.1) {
        const baseShift = (dustRatio * 1.5) + (instability * 1.2) + (radiationRatio * 4.5);
        const shiftOsc = Math.sin(t * 2.1) * Math.cos(t * 0.7);
        chromaticShift = baseShift * (0.6 + shiftOsc * 0.4);

        // Instant electrostatic deflection yoke alignment "pop"
        if (Math.random() > 0.993 - (radiationRatio * 0.02)) {
          chromaticShift *= (4.5 + radiationRatio * 3.0);
        }
      }

      // ── 4. PHYSICAL SCANLINE CONCENTRATION ──
      // Static scanline grids thicken and darken under high particulate (dust) or radiation EMI saturation
      const scanlineOpacity = Math.max(0.08, Math.min(0.55, 0.12 + (dustRatio * 0.28) + (radiationRatio * 0.15)));

      // Direct GPU updates via CSS Custom Variables
      setCssVars({
        "--crt-flicker": crtFlicker.toFixed(4),
        "--crt-jitter-x": `${jitterX.toFixed(2)}px`,
        "--crt-jitter-y": `${jitterY.toFixed(2)}px`,
        "--crt-chromatic-shift": `${chromaticShift.toFixed(2)}px`,
        "--crt-scanline-opacity": parseFloat(scanlineOpacity.toFixed(3)),
        // Fast transition for high-frequency jitters, smooth transition for flicker
        transition: isNaN(jitterX) ? "none" : "transform 0.01s ease, filter 0.05s ease",
      });

      frameRef.current = requestAnimationFrame(updateDrift);
    };

    frameRef.current = requestAnimationFrame(updateDrift);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [observerStability, dustIndex, currentCpm]);

  // CSS variables can be bound directly to the container style attribute
  return {
    jitterStyles: cssVars,
    observerStability,
    dustIndex,
    currentCpm,
  };
}
