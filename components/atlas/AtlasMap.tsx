"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAtlasStore } from "@/state/atlasStore";
import { useAudioStore } from "@/state/audioStore";
import { useEvidenceBoardStore } from "@/state/evidenceBoardStore";
import { colors, microform, typography, shadows } from "@/styles/theme";
import { Place } from "@/types/places";
import { project, WORLD_SIZE } from "./mercator";
import worldMapData from "./world-map.json";

// Typed representation of the pre-projected geographic data
interface CountryGeo {
  name: string;
  code: string;
  path: string;
}

/* ═══════════════════════════════════════════════════════════════
   OPTIMIZED SUB-COMPONENTS (Memoized to prevent React paint cost)
   ═══════════════════════════════════════════════════════════════ */

// 1. Static Country Base Layer
// Natively scales with vectorEffect to prevent parent transform redraw calculations
const CountryBaseLayer: React.FC = React.memo(() => {
  return (
    <g>
      {(worldMapData as CountryGeo[]).map((country) => (
        <path
          key={country.code}
          d={country.path}
          fill="#161310" // Dark brown/charcoal [99]
          stroke="#2a221a" // Very faint borders
          strokeWidth={1.2}
          className="transition-colors duration-200 hover:fill-[#1e1915]"
          style={{ vectorEffect: "non-scaling-stroke" }}
        />
      ))}
    </g>
  );
});
CountryBaseLayer.displayName = "CountryBaseLayer";

// 2. Graticules (Grid Lines) Layer
const GraticulesLayer: React.FC<{ graticules: string[] }> = React.memo(({ graticules }) => {
  return (
    <g>
      {graticules.map((path, idx) => (
        <path
          key={`graticule-${idx}`}
          d={path}
          fill="none"
          stroke={microform.halogen}
          strokeWidth={1}
          strokeDasharray="4, 12"
          opacity={0.05}
          style={{ vectorEffect: "non-scaling-stroke" }}
        />
      ))}
    </g>
  );
});
GraticulesLayer.displayName = "GraticulesLayer";

/* ═══════════════════════════════════════════════════════════════
   MASTER COMPONENT WITH RADAR PROBE SCANNER
   ═══════════════════════════════════════════════════════════════ */

export const AtlasMap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  // Transform state: x/y pan in pixels, k is scale factor (zoom level)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 0.15 });
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredPlaceSlug, setHoveredPlaceSlug] = useState<string | null>(null);

  const { places, selectPlace, selectedPlaceSlug } = useAtlasStore();
  const { click } = useAudioStore();
  const { selectNode, setFocusNode, setViewMode } = useEvidenceBoardStore();

  // Radar refs for DOM-direct hardware-accelerated animations
  const sweepAngleRef = useRef(0);
  const mouseWorldPosRef = useRef<{ x: number; y: number } | null>(null);
  const sweepOutlineRef = useRef<SVGCircleElement>(null);
  const sweepLensRef = useRef<SVGCircleElement>(null);
  const sweepGroupRef = useRef<SVGGElement>(null);
  const sweepAudioCtxRef = useRef<AudioContext | null>(null);
  const clickedPinsRef = useRef<Record<string, number>>({});

  // 1. Measure and track container size dynamically (using ResizeObserver)
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width || 800,
          height: entry.contentRect.height || 600,
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 2. Initial fit-to-viewport transform calculation
  const getFitTransform = useCallback(() => {
    const scale = Math.min(dimensions.width / WORLD_SIZE, dimensions.height / WORLD_SIZE);
    const x = (dimensions.width - WORLD_SIZE * scale) / 2;
    const y = (dimensions.height - WORLD_SIZE * scale) / 2;
    return { x, y, k: scale };
  }, [dimensions]);

  // Apply initial fit once on dimensions ready and selectedPlaceSlug is null
  useEffect(() => {
    if (!selectedPlaceSlug) {
      setTransform(getFitTransform());
    }
  }, [dimensions, selectedPlaceSlug, getFitTransform]);

  // 3. Smooth Fly-to selection trigger
  useEffect(() => {
    if (!selectedPlaceSlug) return;
    const place = places.find((p) => p.slug === selectedPlaceSlug);
    if (!place || !place.coordinates) return;

    const [longitude, latitude] = place.coordinates;
    const { x: targetX, y: targetY } = project(longitude, latitude);

    // Zoom level 4.5 gives deep focus with context intact [97]
    const targetK = 4.5;
    const targetXPixel = dimensions.width / 2 - targetX * targetK;
    const targetYPixel = dimensions.height / 2 - targetY * targetK;

    setIsAnimating(true);
    setTransform({ x: targetXPixel, y: targetYPixel, k: targetK });

    const timer = setTimeout(() => setIsAnimating(false), 800);
    return () => clearTimeout(timer);
  }, [selectedPlaceSlug, places, dimensions.width, dimensions.height]);

  // 4. Drag and Pan Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAnimating) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Map to world coordinates (under current map pan/zoom!)
      const worldX = (mouseX - transform.x) / transform.k;
      const worldY = (mouseY - transform.y) / transform.k;
      mouseWorldPosRef.current = { x: worldX, y: worldY };
    }

    if (!isDragging) return;
    const x = e.clientX - dragStart.current.x;
    const y = e.clientY - dragStart.current.y;
    setTransform((prev) => ({ ...prev, x, y }));
  };

  const handleMouseUp = () => setIsDragging(false);

  // 5. Wheel Zoom Event Handler (Zoom toward cursor) [94]
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (isAnimating) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = 1.15;
    const direction = e.deltaY < 0 ? 1 : -1;
    const nextScale = direction > 0
      ? Math.min(30, transform.k * zoomFactor)
      : Math.max(dimensions.width / WORLD_SIZE * 0.8, transform.k / zoomFactor);

    // Zooming toward the mouse cursor rather than always toward the center [94]
    const mouseWorldX = (mouseX - transform.x) / transform.k;
    const mouseWorldY = (mouseY - transform.y) / transform.k;

    const nextX = mouseX - mouseWorldX * nextScale;
    const nextY = mouseY - mouseWorldY * nextScale;

    setTransform({ x: nextX, y: nextY, k: nextScale });
  };

  // Double click to reset world view
  const handleDoubleClick = () => {
    setIsAnimating(true);
    setTransform(getFitTransform());
    selectPlace(null);
    setTimeout(() => setIsAnimating(false), 800);
  };

  // 6. Procedural Graticules (Latitude & Longitude grid lines) [99]
  const graticules = useMemo(() => {
    const paths: string[] = [];
    
    // Longitude lines (every 30 degrees)
    for (let lng = -180; lng <= 180; lng += 30) {
      const coords: string[] = [];
      for (let lat = -80; lat <= 80; lat += 10) {
        const { x, y } = project(lng, lat);
        coords.push(`${coords.length === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
      }
      paths.push(coords.join(" "));
    }
    
    // Latitude lines (every 20 degrees)
    for (let lat = -80; lat <= 80; lat += 20) {
      const coords: string[] = [];
      for (let lng = -180; lng <= 180; lng += 10) {
        const { x, y } = project(lng, lat);
        coords.push(`${coords.length === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
      }
      paths.push(coords.join(" "));
    }
    return paths;
  }, []);

  // 7. Pre-project and cache places coordinates to completely prevent trig calls on pan frames
  const projectedPlaces = useMemo(() => {
    return places.map((place) => {
      if (!place.coordinates) return null;
      const [longitude, latitude] = place.coordinates;
      const { x, y } = project(longitude, latitude);
      return {
        ...place,
        projX: x,
        projY: y,
      };
    }).filter((p): p is NonNullable<typeof p> => p !== null);
  }, [places]);

  // 8. Pre-project static geodetic thread connections
  const projectedConnections = useMemo(() => {
    const lines: { key: string; x1: number; y1: number; x2: number; y2: number }[] = [];
    projectedPlaces.forEach((place) => {
      if (!place.connectedTo) return;
      place.connectedTo.forEach((targetSlug) => {
        const target = projectedPlaces.find((p) => p.slug === targetSlug);
        if (!target) return;
        lines.push({
          key: `conn-${place.slug}-${targetSlug}`,
          x1: place.projX,
          y1: place.projY,
          x2: target.projX,
          y2: target.projY,
        });
      });
    });
    return lines;
  }, [projectedPlaces]);

  // 9. Map Place status colors to theme
  const getStatusColor = useCallback((place: Place): string => {
    switch (place.status) {
      case "sealed":
        return colors.archive.red;
      case "whispered":
        return colors.archive.blue;
      case "mirage":
        return microform.halogen;
      case "pending":
        return colors.archive.grayLight;
      case "rejected":
        return "#4a4740";
      default:
        return colors.archive.green;
    }
  }, []);

  /* ═══════════════════════════════════════════════════════════════
     RADAR AUDIO SYNTHESIZERS (Self-Contained Web Audio Pipeline)
     ═══════════════════════════════════════════════════════════════ */

  const playSweepClick = useCallback(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    if (!sweepAudioCtxRef.current) {
      sweepAudioCtxRef.current = new AudioContextClass();
    }
    const ctx = sweepAudioCtxRef.current;
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    const now = ctx.currentTime;
    const bufferSize = 0.004 * ctx.sampleRate; // ~4ms click
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(2000, now);
    
    const gain = ctx.createGain();
    // Procedural volume variation for authentic physical scatter
    gain.gain.setValueAtTime(0.08 * (0.7 + Math.random() * 0.3), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.003);
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    source.start(now);
  }, []);

    const playSonarPing = useCallback((volumeMultiplier = 1.0) => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!sweepAudioCtxRef.current) {
      sweepAudioCtxRef.current = new AudioContextClass();
    }
    const ctx = sweepAudioCtxRef.current;
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    
    osc.type = "square"; // Mismatch to the generic sine, matches ancient Edinburgh vaults 110Hz resonance
    osc.frequency.setValueAtTime(110.0, now);
    
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(220, now); // Low-pass filter to keep it deep, warm, and ominous
    
    gain.gain.setValueAtTime(0.04 * volumeMultiplier, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85); // Lingers longer for lingering terror
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.9);
  }, []);

  const playGeophoneThud = useCallback(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!sweepAudioCtxRef.current) {
      sweepAudioCtxRef.current = new AudioContextClass();
    }
    const ctx = sweepAudioCtxRef.current;
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    const now = ctx.currentTime;
    
    // 1. Deep 55 Hz thump oscillator
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(55.0, now);
    osc.frequency.exponentialRampToValueAtTime(15, now + 0.4);
    
    oscGain.gain.setValueAtTime(0.38, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.55);
    
    // 2. Cold trail of low-frequency static decay (Geophone resonance)
    const bufferSize = ctx.sampleRate * 1.5; // 1.5 second static trail
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const lpFilter = ctx.createBiquadFilter();
    lpFilter.type = "lowpass";
    lpFilter.frequency.setValueAtTime(80, now); // Super deep sub-80Hz static
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    
    noise.connect(lpFilter);
    lpFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noise.start(now);
    noise.stop(now + 1.3);
  }, []);

  const playInfrasound = useCallback((slug: string) => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!sweepAudioCtxRef.current) {
      sweepAudioCtxRef.current = new AudioContextClass();
    }
    const ctx = sweepAudioCtxRef.current;
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    // Determine infrasound frequency [doc-mwe-4.5hz, doc-bor-001]
    let freq = 0;
    if (slug.includes("weather") || slug.includes("cheyenne") || slug.includes("raven") || slug.includes("null-point") || slug.includes("lebanon")) {
      freq = 4.5;
    } else if (slug.includes("borovsko")) {
      freq = 18.0;
    } else if (slug.includes("danvers")) {
      freq = 19.0;
    }
    
    if (freq === 0) return;
    
    const now = ctx.currentTime;
    
    // Create triangle wave oscillator for deep low sub-bass vibration (bone-vibrator)
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);
    
    gainNode.gain.setValueAtTime(0.0, now);
    gainNode.gain.linearRampToValueAtTime(0.45, now + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.8); // Lingering rumble for 2.8s
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 3.0);
  }, []);

  /* ═══════════════════════════════════════════════════════════════
     HARDWARE ACCELERATED SWEPING ENGINE & INTERSECTION CORRELATOR
     ═══════════════════════════════════════════════════════════════ */

  useEffect(() => {
    let frameId: number;
    let lastTime = Date.now();

    const animateSweep = () => {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // 1. Advance sweep angle
      // Standard rotation: 1 full rotation (2 * PI) every 3.5 seconds
      const speed = (2 * Math.PI) / 3.5;
      const prevAngle = sweepAngleRef.current;
      sweepAngleRef.current = (sweepAngleRef.current + speed * dt) % (2 * Math.PI);

      // Track full cycle sonar ping at 0 degrees crossing
      if (prevAngle > sweepAngleRef.current) {
        playSonarPing(0.6);
      }

      // 2. Resolve active sweep center (Only visible around selected pin, otherwise hidden)
      let hasTarget = false;
      let center = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };
      
      if (selectedPlaceSlug) {
        const activePlace = projectedPlaces.find((p) => p.slug === selectedPlaceSlug);
        if (activePlace) {
          center = { x: activePlace.projX, y: activePlace.projY };
          hasTarget = true;
        }
      }

      const opacityMultiplier = hasTarget ? 1 : 0;

      // Update screen SVG DOM elements directly to avoid any React draw cost!
      if (sweepGroupRef.current) {
        const degrees = (sweepAngleRef.current * 180) / Math.PI;
        sweepGroupRef.current.setAttribute(
          "transform",
          `translate(${center.x}, ${center.y}) rotate(${degrees})`
        );
        sweepGroupRef.current.setAttribute("opacity", (0.65 * opacityMultiplier).toString());
      }
      if (sweepOutlineRef.current) {
        sweepOutlineRef.current.setAttribute("cx", center.x.toString());
        sweepOutlineRef.current.setAttribute("cy", center.y.toString());
        sweepOutlineRef.current.setAttribute("opacity", (0.22 * opacityMultiplier).toString());
      }
      if (sweepLensRef.current) {
        sweepLensRef.current.setAttribute("cx", center.x.toString());
        sweepLensRef.current.setAttribute("cy", center.y.toString());
        sweepLensRef.current.setAttribute("opacity", opacityMultiplier.toString());
      }

      // 3. Collision checks against nearby pins inside sensor scanning bounds
      if (hasTarget) {
        const R_SENSOR = 600;
        projectedPlaces.forEach((place) => {
        const dx = place.projX - center.x;
        const dy = place.projY - center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= R_SENSOR) {
          // Calculate polar coordinates of pin relative to scan origin
          let pinAngle = Math.atan2(dy, dx);
          if (pinAngle < 0) pinAngle += 2 * Math.PI;

          // Normalize relative angular offset to detect sweep crossover
          let diff = pinAngle - prevAngle;
          while (diff < -Math.PI) diff += 2 * Math.PI;
          while (diff > Math.PI) diff -= 2 * Math.PI;

          const step = speed * dt;
          const isCrossing = diff >= 0 && diff <= step + 0.01;

          if (isCrossing) {
            const clickTime = clickedPinsRef.current[place.slug] || 0;
            // Prevent rapid multi-ticks on the exact same frame step
            if (now - clickTime > 800) {
              clickedPinsRef.current[place.slug] = now;
              
              // Synthesize geophone tectonic strike!
              playGeophoneThud();
              playSweepClick();
              
              // Apply native DOM visual flare class
              const markerEl = containerRef.current?.querySelector(`[data-slug="${place.slug}"]`);
              if (markerEl) {
                markerEl.classList.add("radar-pinged");
                setTimeout(() => {
                  markerEl.classList.remove("radar-pinged");
                }, 600);
              }
            }
          }
        }
      });
      }

      frameId = requestAnimationFrame(animateSweep);
    };

    frameId = requestAnimationFrame(animateSweep);
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [projectedPlaces, selectedPlaceSlug, hoveredPlaceSlug, playSweepClick, playSonarPing]);

  // Clean up audio on hook unmount
  useEffect(() => {
    return () => {
      if (sweepAudioCtxRef.current) {
        sweepAudioCtxRef.current.close();
        sweepAudioCtxRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        handleMouseUp();
        mouseWorldPosRef.current = null;
      }}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      className={`absolute inset-0 select-none overflow-hidden ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{
        backgroundColor: colors.archive.black,
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {/* CSS stylesheet embedding for procedural non-React phosphor flaring */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes radar-flare {
          0% { transform: scale(1); filter: brightness(1.8); }
          50% { transform: scale(1.35); filter: brightness(2.6) drop-shadow(0 0 6px currentColor); }
          100% { transform: scale(1); filter: brightness(1); }
        }
        .radar-pinged {
          animation: radar-flare 0.6s cubic-bezier(0.25, 1, 0.5, 1);
        }
      `}} />

      {/* Visual Overlay: Vignette & Desklamp lighting glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(255, 170, 85, 0.05) 0%, transparent 60%),
            radial-gradient(circle at center, transparent 35%, rgba(10, 8, 6, 0.8) 100%)
          `,
          zIndex: 4,
        }}
      />

      {/* Main SVG Map Canvas */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "auto" }}
      >
        <g
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
            transition: isAnimating ? "transform 800ms cubic-bezier(0.25, 1, 0.5, 1)" : "none",
          }}
        >
          {/* Subtle ocean grid lines (graticules Layer - fully cached) */}
          <GraticulesLayer graticules={graticules} />

          {/* Map Base Layer: High-fidelity simplified country paths (natively memoized) */}
          <CountryBaseLayer />

          {/* Radar Scanner Probe Layer */}
          <circle
            ref={sweepLensRef}
            r={600}
            fill="rgba(255, 170, 85, 0.015)" // Warm ambient scan field lens
            stroke="none"
            opacity={0}
          />
          <circle
            ref={sweepOutlineRef}
            r={600}
            fill="none"
            stroke={microform.halogen}
            strokeWidth={1}
            strokeDasharray="3, 9"
            opacity={0}
            style={{ vectorEffect: "non-scaling-stroke" }}
          />
          <g ref={sweepGroupRef}>
            {/* Stepped Phosphor segments trailing clockwise */}
            {/* 1. Primary phosphor sweep lead line */}
            <line x1={0} y1={0} x2={600} y2={0} stroke={microform.halogen} strokeWidth={1.8} opacity={0.65} style={{ vectorEffect: "non-scaling-stroke" }} />
            {/* 2. Secondary trail lines */}
            <line x1={0} y1={0} x2={600 * Math.cos(-4 * Math.PI / 180)} y2={600 * Math.sin(-4 * Math.PI / 180)} stroke={microform.halogen} strokeWidth={1.4} opacity={0.4} style={{ vectorEffect: "non-scaling-stroke" }} />
            <line x1={0} y1={0} x2={600 * Math.cos(-9 * Math.PI / 180)} y2={600 * Math.sin(-9 * Math.PI / 180)} stroke={microform.halogen} strokeWidth={1.1} opacity={0.25} style={{ vectorEffect: "non-scaling-stroke" }} />
            <line x1={0} y1={0} x2={600 * Math.cos(-15 * Math.PI / 180)} y2={600 * Math.sin(-15 * Math.PI / 180)} stroke={microform.halogen} strokeWidth={0.8} opacity={0.12} style={{ vectorEffect: "non-scaling-stroke" }} />
            <line x1={0} y1={0} x2={600 * Math.cos(-22 * Math.PI / 180)} y2={600 * Math.sin(-22 * Math.PI / 180)} stroke={microform.halogen} strokeWidth={0.6} opacity={0.05} style={{ vectorEffect: "non-scaling-stroke" }} />
          </g>

          {/* Connection Lines (Geodetic grids/threads) - uses hardware vectorEffect */}
          <g>
            {projectedConnections.map((conn) => (
              <line
                key={conn.key}
                x1={conn.x1}
                y1={conn.y1}
                x2={conn.x2}
                y2={conn.y2}
                stroke={microform.halogen}
                strokeWidth={1}
                opacity={0.06}
                strokeDasharray="5, 5"
                style={{ vectorEffect: "non-scaling-stroke" }}
              />
            ))}
          </g>

          {/* Place Markers Layer [95] */}
          <g>
            {projectedPlaces.map((place) => {
              const isSelected = selectedPlaceSlug === place.slug;
              const isHovered = hoveredPlaceSlug === place.slug;
              const statusColor = getStatusColor(place);

              // Responsive scaling: keeps pixel dimensions crisp at any scale [95]
              const baseScale = isSelected ? 1.4 : isHovered ? 1.25 : 1.0;
              const markerScale = baseScale / transform.k;

              const handleMarkerClick = (e: React.MouseEvent) => {
                e.stopPropagation();
                click();
                playInfrasound(place.slug);
                selectPlace(place.slug);
                selectNode(place.slug);
                setFocusNode(place.slug);
                setViewMode("focus");
              };

              return (
                <g
                  key={`marker-${place.slug}`}
                  data-slug={place.slug} // Anchors the DOM-Direct visual flare lookup!
                  transform={`translate(${place.projX}, ${place.projY}) scale(${markerScale})`}
                  onClick={handleMarkerClick}
                  onMouseEnter={() => setHoveredPlaceSlug(place.slug)}
                  onMouseLeave={() => setHoveredPlaceSlug(null)}
                  className="cursor-pointer"
                  style={{
                    transition: isAnimating ? "none" : "transform 0.15s ease",
                  }}
                >
                  {/* Outer glow ring (larger for selected) */}
                  <circle
                    r={isSelected ? 10 : 8}
                    fill="rgba(10, 8, 6, 0.85)"
                    stroke={microform.halogen}
                    strokeWidth={1.1}
                    style={{
                      filter: `drop-shadow(0 0 ${isSelected ? "6px" : "3px"} ${statusColor})`,
                    }}
                  />
                  {/* Status core center dot */}
                  <circle
                    r={isSelected ? 4 : 3}
                    fill={statusColor}
                    style={{
                      filter: `drop-shadow(0 0 3px ${statusColor})`,
                    }}
                  />

                  {/* Floating tooltip on hover (scaled down so it reads correctly) */}
                  {isHovered && (
                    <g transform={`translate(0, -18) scale(${1 / baseScale})`}>
                      <rect
                        x={-55}
                        y={-14}
                        width={110}
                        height={18}
                        fill="rgba(15, 12, 10, 0.95)"
                        stroke={microform.halogen}
                        strokeWidth={0.8}
                        rx={1}
                      />
                      <text
                        x={0}
                        y={-2}
                        textAnchor="middle"
                        fill={colors.archive.white}
                        style={{
                          fontFamily: typography.mono,
                          fontSize: "7.5px",
                          letterSpacing: "0.03em",
                        }}
                      >
                        {place.name.length > 20
                          ? `${place.name.substring(0, 18)}...`
                          : place.name}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Decorative Corner Brackets & Outbox framing [100] */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          border: `1px solid ${microform.mahogany}`,
          boxShadow: `inset 0 0 0 4px rgba(26, 17, 10, 0.05)`,
          zIndex: 5,
        }}
      >
        {/* Top-Left Bracket */}
        <div
          className="absolute top-3 left-3 w-4 h-4 border-t border-l pointer-events-none"
          style={{ borderColor: microform.halogen, opacity: 0.3 }}
        />
        {/* Top-Right Bracket */}
        <div
          className="absolute top-3 right-3 w-4 h-4 border-t border-r pointer-events-none"
          style={{ borderColor: microform.halogen, opacity: 0.3 }}
        />
        {/* Bottom-Left Bracket */}
        <div
          className="absolute bottom-3 left-3 w-4 h-4 border-b border-l pointer-events-none"
          style={{ borderColor: microform.halogen, opacity: 0.3 }}
        />
        {/* Bottom-Right Bracket */}
        <div
          className="absolute bottom-3 right-3 w-4 h-4 border-b border-r pointer-events-none"
          style={{ borderColor: microform.halogen, opacity: 0.3 }}
        />

        {/* Legend Panel (Classified Overlay style) */}
        <div
          className="absolute bottom-5 right-5 p-3 border font-mono text-[9px] tracking-wider pointer-events-auto"
          style={{
            borderColor: colors.archive.grayDark,
            backgroundColor: "rgba(10, 8, 6, 0.95)",
            boxShadow: shadows.paper,
            color: colors.archive.grayLight,
          }}
        >
          <div style={{ color: microform.halogen, fontWeight: "bold", marginBottom: "4px" }}>
            GEODETIC ATLAS INDEX
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50% ", background: colors.archive.green }} />
            VERIFIED NO-DRIFT
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50% ", background: colors.archive.red }} />
            SEALED SECTOR
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50% ", background: colors.archive.blue }} />
            WHISPERED ECHO
          </div>
          <div className="flex items-center gap-2">
            <span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50% ", background: microform.halogen }} />
            MIRAGE CORRELATION
          </div>
        </div>
      </div>
    </div>
  );
};

export default AtlasMap;
