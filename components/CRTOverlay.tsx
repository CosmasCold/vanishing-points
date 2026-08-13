"use client";

import React, { useEffect, useRef, useState } from "react";
import { useGeigerStore } from "@/hooks/useGeigerCounter";
import { useUIStore } from "@/state/uiStore";
import { colors, microform } from "@/styles/theme";

/**
 * HIGH-PERFORMANCE PROCEDURAL CRT OVERLAY COMPONENT // SYSTEM-7B CHASSIS
 * Implements:
 * 1. Physical glass curvature (3D barrel & pincushion distortion via CSS/SVG)
 * 2. Dynamic phosphor scanlines and shadow mask crawling
 * 3. Electromagnetic radiation-induced screen flicker, jitter, and vertical sync slips
 * 4. Procedural Web Audio horizontal flyback sweep whistle & 60Hz mains transformer hum
 *    that experiences audible pitch-warping "sync slips" under high radioactive CPM load.
 * 5. Integrated Story-Grounded Particulate Dust Layer (Canvas 2D):
 *    Spawns thin, organic ashen fibers and microscopic jagged ash specks that catch 
 *    the phosphor screen's co-axial ultraviolet flare. Density and flutter scale dynamically 
 *    with the investigator's active Dust Index.
 */
export const CRTOverlay: React.FC = () => {
  const { currentCpm } = useGeigerStore();
  const { status } = useUIStore();
  const dust = status?.dustIndex ?? 0;

  const [flickerClass, setFlickerClass] = useState("");
  const audioCtxRef = useRef<AudioContext | null>(null);
  // Centralized AudioContext registration on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const { getSharedAudioContext } = require("@/lib/sharedAudioContext");
      audioCtxRef.current = getSharedAudioContext();
    }
  }, []);
  const dustCanvasRef = useRef<HTMLCanvasElement>(null);

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
      humGain.gain.setValueAtTime(0.001, now); // Baseline ground hum

      humOsc.connect(humFilter);
      humFilter.connect(humGain);
      humGain.connect(ctx.destination);
      humOsc.start(now);

      humOscRef.current = humOsc;
      humGainRef.current = humGain;

      // B. Horizontal Sync Flyback whistle (Sub-harmonic 7812.0Hz for high-voltage electrostatic pressure)
      const flybackOsc = ctx.createOscillator();
      flybackOsc.type = "sine";
      flybackOsc.frequency.setValueAtTime(7812.0, now);

      const flybackGain = ctx.createGain();
      flybackGain.gain.setValueAtTime(0.0001, now); // Subtle background whistle

      flybackOsc.connect(flybackGain);
      flybackGain.connect(ctx.destination);
      flybackOsc.start(now);

      flybackOscRef.current = flybackOsc;
      flybackGainRef.current = flybackGain;

      // C. Electromagnetic Slip LFO (Modulates sweep frequency to simulate sync sags)
      const slipLfo = ctx.createOscillator();
      slipLfo.type = "sawtooth";
      slipLfo.frequency.setValueAtTime(0.85, now);

      const slipGain = ctx.createGain();
      slipGain.gain.setValueAtTime(0.0, now);

      slipLfo.connect(slipGain);
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

    const targetHumVol = 0.001 + emiRatio * 0.015; 
    const targetFlybackVol = 0.0001 + emiRatio * 0.002; 
    const targetSlipDepth = emiRatio * 32.0;            
    const targetSlipSpeed = 0.85 + emiRatio * 18.0;     

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

  // 6. Real-Time Electrostatic Dust Particulates Loop (Modulated by active Dust Index)
  useEffect(() => {
    const canvas = dustCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    interface Particulate {
      x: number;
      y: number;
      vx: number;
      vy: number;
      length: number;
      thickness: number;
      angle: number;
      angularSpeed: number;
      opacity: number;
      type: "fiber" | "ash";
      points?: { dx: number; dy: number }[];
    }

    const particulates: Particulate[] = [];
    // Base 15 particles, scaling up to 100 as Dust Index climbs to 100%
    const particleCount = 15 + Math.floor(dust * 0.85);

    for (let i = 0; i < particleCount; i++) {
      const type = Math.random() > 0.45 ? "ash" : "fiber";
      const p: Particulate = {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() * 0.08) + 0.03, // Weighted lazy falling
        length: type === "fiber" ? 5 + Math.random() * 10 : 1 + Math.random() * 2.5,
        thickness: type === "fiber" ? 0.45 : 1.3,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (Math.random() - 0.5) * 0.005,
        opacity: 0.18 + Math.random() * 0.32, // High contrast visible dust
        type,
      };

      if (type === "ash") {
        const sides = 3 + Math.floor(Math.random() * 3);
        p.points = [];
        for (let s = 0; s < sides; s++) {
          const a = (s / sides) * Math.PI * 2;
          const r = 0.5 + Math.random() * 1.5;
          p.points.push({ dx: Math.cos(a) * r, dy: Math.sin(a) * r });
        }
      }
      particulates.push(p);
    }

    const renderDust = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particulates.forEach((p) => {
        // Particles drift and flutter, influenced by electromagnetic static level
        const wobbleFactor = 0.06 + (dust / 100) * 0.12;
        p.y += p.vy * (1 + (dust / 100) * 0.5); // Fall slightly faster as timeline sags
        p.x += p.vx + Math.sin(Date.now() * 0.0008 + p.angle) * wobbleFactor;
        p.angle += p.angularSpeed * (1 + emiRatio * 2.0); // Spin faster under EMI spikes

        // Wrap around boundaries
        if (p.y > canvas.height) {
          p.y = -15;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -15) p.x = canvas.width + 15;
        if (p.x > canvas.width + 15) p.x = -15;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        // Render co-axial UV neon phosphor glows
        ctx.strokeStyle = `rgba(129, 140, 248, ${p.opacity})`;
        ctx.fillStyle = `rgba(129, 140, 248, ${p.opacity * 0.65})`;
        ctx.lineWidth = p.thickness;

        if (p.type === "fiber") {
          ctx.beginPath();
          ctx.moveTo(-p.length / 2, 0);
          ctx.quadraticCurveTo(0, Math.sin(p.angle) * 2.2, p.length / 2, 0);
          ctx.stroke();
        } else if (p.points) {
          ctx.beginPath();
          ctx.moveTo(p.points[0].dx, p.points[0].dy);
          for (let s = 1; s < p.points.length; s++) {
            ctx.lineTo(p.points[s].dx, p.points[s].dy);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(renderDust);
    };

    renderDust();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [dust, emiRatio]);

  return (
    <>
      {/* 1. Global CRT Screen Container featuring SVG Pincushion Distortion Filter */}
      <div
        className={`pointer-events-none fixed inset-0 z-50 overflow-hidden ${flickerClass}`}
        style={{
          boxShadow: "inset 0 0 80px rgba(0,0,0,0.85), inset 0 0 20px rgba(0,0,0,0.95)",
          backgroundImage: `
            radial-gradient(circle at 50% 50%, transparent 40%, rgba(5,4,3,0.3) 100%),
            linear-gradient(135deg, rgba(255,170,85,0.015) 0%, rgba(255,170,85,0.005) 50%, transparent 50.1%)
          `,
          filter: "url(#crt-lens-curvature)", // Drives structural barrel distortion
        }}
      >
        {/* Scanlines removed per user request */}

        {/* Shadow Mask removed per user request */}

        {/* 4. Constant Phosphorus Decay Flicker */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.98]"
          style={{
            animation: `crt-ambient-flicker ${0.18 + (1 - emiRatio) * 0.12}s infinite alternate ease-in-out`,
          }}
        />

        {/* 5. Procedural Information Dust Canvas (Overlaid on scanline raster grid) */}
        <canvas
          ref={dustCanvasRef}
          className="pointer-events-none absolute inset-0 z-30 opacity-70"
          style={{ mixBlendMode: "screen" }}
        />
      </div>

      {/* 6. Custom SVG Displacement Filter to Render Real Glass curvature */}
      <svg className="absolute pointer-events-none w-0 h-0 opacity-0 overflow-hidden" width="0" height="0" style={{ position: "absolute", zIndex: -9999 }}  className="absolute w-0 h-0 pointer-events-none" style={{ visibility: "hidden" }} aria-hidden="true">
        <defs>
          <filter id="crt-lens-curvature" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.005" numOctaves="1" result="noise" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={2.2 + emiRatio * 4.8} 
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* 7. Embedded Style Sheet for CRT electromagnetic sags, slips, and scanlines */}
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
