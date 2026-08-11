"use client";

import React, { useEffect, useRef, useState } from "react";
import { useGeigerStore } from "@/hooks/useGeigerCounter";
import { colors, microform } from "@/styles/theme";

/**
 * HIGH-PERFORMANCE PROCEDURAL CRT OVERLAY COMPONENT // SYSTEM-7B CHASSIS
 * Implements:
 * 1. Physical glass curvature (3D barrel & pincushion distortion via CSS/SVG)
 * 2. Dynamic phosphor scanlines and shadow mask crawling
 * 3. Electromagnetic radiation-induced screen flicker, jitter, and vertical sync slips
 * 4. Procedural Web Audio horizontal flyback sweep whistle & 60Hz mains transformer hum
 *    that experiences audible pitch-warping "sync slips" under high radioactive CPM load.
 */
export const CRTOverlay: React.FC = () => {
  const { currentCpm, isActive } = useGeigerStore();

  const [flickerClass, setFlickerClass] = useState("");
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Audio Nodes Refs
  const humOscRef = useRef<OscillatorNode | null>(null);
  const humGainRef = useRef<GainNode | null>(null);
  const flybackOscRef = useRef<OscillatorNode | null>(null);
  const flybackGainRef = useRef<GainNode | null>(null);
  const slipLfoRef = useRef<OscillatorNode | null>(null);
  const slipGainRef = useRef<GainNode | null>(null);

  // 1. Calculate active electromagnetic interference (EMI) ratio from live CPM
  // Background = 12 CPM, Overload = 1200 CPM, mapped between [0..1]
  const emiRatio = Math.min(1.0, Math.max(0, (currentCpm - 12) / 1188));

  // 2. Synthesize diegetic CRT electrical tones (Transformer Hum & Sweep Whistle)
  const initCrtAudio = () => {
    if (audioCtxRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const now = ctx.currentTime;

      // A. Main 60Hz Transformer Ground Hum (Warm triangle with even harmonics)
      const humOsc = ctx.createOscillator();
      humOsc.type = "triangle";
      humOsc.frequency.setValueAtTime(60.0, now);

      const humFilter = ctx.createBiquadFilter();
      humFilter.type = "lowpass";
      humFilter.frequency.setValueAtTime(150, now); // Retain deep heavy magnetic cabinet growl

      const humGain = ctx.createGain();
      humGain.gain.setValueAtTime(0.001, now); // Mixed low-volume baseline hum // Faint baseline hum

      humOsc.connect(humFilter);
      humFilter.connect(humGain);
      humGain.connect(ctx.destination);
      humOsc.start(now);

      humOscRef.current = humOsc;
      humGainRef.current = humGain;

      // B. Horizontal Sync Flyback whistle (Sub-harmonic 7812.0Hz for high-voltage electrostatic pressure)
      const flybackOsc = ctx.createOscillator();
      flybackOsc.type = "sine";
      flybackOsc.frequency.setValueAtTime(7812.0, now); // Calibrated to perfect high-voltage sub-harmonic for lingering anxiety

      const flybackGain = ctx.createGain();
      flybackGain.gain.setValueAtTime(0.0001, now); // Super-subtle high frequency pressure whistle // Microscopic background whistle

      flybackOsc.connect(flybackGain);
      flybackGain.connect(ctx.destination);
      flybackOsc.start(now);

      flybackOscRef.current = flybackOsc;
      flybackGainRef.current = flybackGain;

      // C. Electromagnetic Slip LFO (Modulates sweep frequency to simulate sync sags)
      const slipLfo = ctx.createOscillator();
      slipLfo.type = "sawtooth";
      slipLfo.frequency.setValueAtTime(0.85, now); // Low frequency pulse

      const slipGain = ctx.createGain();
      slipGain.gain.setValueAtTime(0.0, now); // Starts at zero

      slipLfo.connect(slipGain);
      // Connect LFO directly to flyback and hum frequencies for pitch-slippage warp!
      slipGain.connect(flybackOsc.frequency);
      slipGain.connect(humOsc.frequency);
      slipLfo.start(now);

      slipLfoRef.current = slipLfo;
      slipGainRef.current = slipGain;

    } catch (e) {
      console.warn("[CRT Audio] Failed to initialize synthesized hum:", e);
    }
  };

  // 3. Dynamically modulate audio parameters based on radiation load (currentCpm)
  useEffect(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const now = ctx.currentTime;

    // Scale gains and slip modulations with EMI levels
    const targetHumVol = 0.001 + emiRatio * 0.015; // Balanced low-frequency growl       // Transformer hum growls louder
    const targetFlybackVol = 0.0001 + emiRatio * 0.002; // Balanced flyback whistle   // Flyback whistle cuts through
    const targetSlipDepth = emiRatio * 32.0;            // Up to 32Hz of raw pitch drift & click slips
    const targetSlipSpeed = 0.85 + emiRatio * 18.0;     // Jitter increases under load

    humGainRef.current?.gain.setTargetAtTime(targetHumVol, now, 0.2);
    flybackGainRef.current?.gain.setTargetAtTime(targetFlybackVol, now, 0.15);
    slipGainRef.current?.gain.setTargetAtTime(targetSlipDepth, now, 0.1);
    slipLfoRef.current?.frequency.setTargetAtTime(targetSlipSpeed, now, 0.25);

  }, [emiRatio]);

  // 4. Visual Jitter & Sync-Slip animation triggers
  useEffect(() => {
    if (emiRatio < 0.1) {
      setFlickerClass("");
      return;
    }

    const interval = setInterval(() => {
      // Procedurally trigger severe chromatic sync sags as radiation rises
      const rand = Math.random();
      if (rand > 0.985 - emiRatio * 0.15) {
        setFlickerClass("sync-slipping");
        setTimeout(() => setFlickerClass(""), 350);
      } else if (rand > 0.94 - emiRatio * 0.1) {
        setFlickerClass("micro-glitch");
        setTimeout(() => setFlickerClass(""), 120);
      } else if (Math.random() < emiRatio * 0.08) {
        setFlickerClass("deflection-sag");
        setTimeout(() => setFlickerClass(""), 80);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [emiRatio]);

  // 5. Audio Context lifecycle tracking and click-to-activate initializer
  useEffect(() => {
    const handleActivate = () => {
      initCrtAudio();
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
    };

    window.addEventListener("click", handleActivate);
    window.addEventListener("keydown", handleActivate);

    return () => {
      window.removeEventListener("click", handleActivate);
      window.removeEventListener("keydown", handleActivate);
      
      // Tear down synthesized oscillators safely on unmount
      try {
        humOscRef.current?.stop();
        flybackOscRef.current?.stop();
        slipLfoRef.current?.stop();
      } catch (e) {}

      humOscRef.current?.disconnect();
      humGainRef.current?.disconnect();
      flybackOscRef.current?.disconnect();
      flybackGainRef.current?.disconnect();
      slipLfoRef.current?.disconnect();
      slipGainRef.current?.disconnect();
      
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <>
      {/* 1. Global CRT Screen Container featuring SVG Pincushion Distortion Filter */}
      <div
        className={`pointer-events-none fixed inset-0 z-50 overflow-hidden ${flickerClass}`}
        style={{
          boxShadow: "inset 0 0 80px rgba(0,0,0,0.85), inset 0 0 20px rgba(0,0,0,0.95)",
          // CSS spherical lens overlay & desklamp reflection grid
          backgroundImage: `
            radial-gradient(circle at 50% 50%, transparent 40%, rgba(5,4,3,0.3) 100%),
            linear-gradient(135deg, rgba(255,170,85,0.015) 0%, rgba(255,170,85,0.005) 50%, transparent 50.1%)
          `,
          filter: "url(#crt-lens-curvature)", // Drives structural barrel distortion
        }}
      >
        {/* 2. Scanning Phosphor lines (Dynamic alpha scales with CPM load) */}
        <div
          className="absolute inset-0 scanline-crawl"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(20, 18, 15, ${0.11 + emiRatio * 0.18}) 2px,
              rgba(20, 18, 15, ${0.11 + emiRatio * 0.18}) 4px
            )`,
            backgroundSize: "100% 4px",
            animationDuration: `${30 - emiRatio * 18}s`, // Crawls faster under high EMI
          }}
        />

        {/* 3. Shadow Mask grid layout (Representing the raw physical phosphor triad structure) */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(90deg, #ff0000 0px, #ff0000 1px, transparent 1px, transparent 3px),
              repeating-linear-gradient(90deg, #00ff00 1px, #00ff00 2px, transparent 2px, transparent 3px),
              repeating-linear-gradient(90deg, #0000ff 2px, #0000ff 3px, transparent 3px, transparent 3px)
            `,
            backgroundSize: "3px 100%",
          }}
        />

        {/* 4. Constant Phosphorus Decay Flicker */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.98]"
          style={{
            animation: `crt-ambient-flicker ${0.18 + (1 - emiRatio) * 0.12}s infinite alternate ease-in-out`,
          }}
        />
      </div>

      {/* 5. Custom SVG Displacement Filter to Render Real Glass curvature */}
      <svg className="absolute w-0 h-0 pointer-events-none" style={{ visibility: "hidden" }} aria-hidden="true">
        <defs>
          <filter id="crt-lens-curvature">
            {/* Standard barrel pincushion displacement map */}
            <feTurbulence type="fractalNoise" baseFrequency="0.005" numOctaves="1" result="noise" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={2.2 + emiRatio * 4.8} // Screen warps physically as radiation saturates
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* 6. Embedded Style Sheet for CRT electromagnetic animation sags & slips */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes crt-ambient-flicker {
          0% { opacity: 0.982; }
          100% { opacity: ${0.994 - emiRatio * 0.05}; }
        }
        
        .sync-slipping {
          transform: translateY(var(--crt-jitter-y, 4px)) scaleY(1.01) skewX(1.5deg) !important;
          filter: contrast(1.4) brightness(1.2) hue-rotate(15deg) !important;
          animation: h-sync-slip 150ms infinite alternate !important;
        }

        .micro-glitch {
          transform: translate(2px, -1px) skewX(-1deg) !important;
          filter: saturate(1.8) contrast(1.1) !important;
        }

        .deflection-sag {
          filter: contrast(0.85) brightness(0.9) !important;
          transform: scaleY(0.995) !important;
        }

        @keyframes h-sync-slip {
          0% { filter: drop-shadow(-3px 0 0 rgba(255,0,0,0.6)) drop-shadow(3px 0 0 rgba(0,255,255,0.6)); }
          100% { filter: drop-shadow(3px 0 0 rgba(255,0,0,0.6)) drop-shadow(-3px 0 0 rgba(0,255,255,0.6)); }
        }

        .scanline-crawl {
          animation: scanline-crawl-anim linear infinite;
        }

        @keyframes scanline-crawl-anim {
          from { background-position: 0 0; }
          to { background-position: 0 100%; }
        }
        `
      }} />
    </>
  );
};

export default CRTOverlay;
