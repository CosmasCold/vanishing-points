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
interface CountryGeo { name: string; code: string; path: string; }

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
  const mapContentRef = useRef<SVGGElement>(null); // DOM-direct ref to completely eliminate React re-render lag
  const dragStart = useRef({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Transform state: x/y pan in pixels, k is scale factor (zoom level)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 0.15 });
  const transformRef = useRef({ x: 0, y: 0, k: 0.15 }); // Mutable ref for 60 FPS DOM updates without state trigger
  
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

  // Synchronize mutable ref with React state
  useEffect(() => {
    transformRef.current = transform;
    if (mapContentRef.current) {
      mapContentRef.current.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`;
    }
  }, [transform]);

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
    const { x: projX, y: projY } = project(longitude, latitude);

    // Target scale for zoom focusing on active coordinate
    const targetK = 0.85;
    const targetX = dimensions.width / 2 - projX * targetK;
    const targetY = dimensions.height / 2 - projY * targetK;

    setTransform({ x: targetX, y: targetY, k: targetK });
  }, [selectedPlaceSlug, places, dimensions.width, dimensions.height]);

  // 4. Drag and Pan Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAnimating) return;
    setIsDragging(true);
    dragStart.current = { 
      x: e.clientX - transformRef.current.x, 
      y: e.clientY - transformRef.current.y 
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    // Calculate world position of cursor for radar intersection scanner
    const bounds = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - bounds.left;
    const mouseY = e.clientY - bounds.top;

    const currentX = transformRef.current.x;
    const currentY = transformRef.current.y;
    const currentK = transformRef.current.k;

    mouseWorldPosRef.current = {
      x: (mouseX - currentX) / currentK,
      y: (mouseY - currentY) / currentK,
    };

    if (!isDragging) return;

    // Apply high-performance DOM-direct translation (0ms React lag!)
    const dragX = e.clientX - dragStart.current.x;
    const dragY = e.clientY - dragStart.current.y;

    transformRef.current.x = dragX;
    transformRef.current.y = dragY;

    if (mapContentRef.current) {
      mapContentRef.current.style.transform = `translate(${dragX}px, ${dragY}px) scale(${currentK})`;
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    // Write the final transform offset coordinates back to React state ONCE on release!
    setTransform({ x: transformRef.current.x, y: transformRef.current.y, k: transformRef.current.k });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current || isAnimating) return;
    
    const bounds = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - bounds.left;
    const mouseY = e.clientY - bounds.top;

    const currentX = transformRef.current.x;
    const currentY = transformRef.current.y;
    const currentK = transformRef.current.k;

    // Zoom speed clamping
    const zoomFactor = 1.15;
    const nextK = e.deltaY < 0 
      ? Math.min(4.0, currentK * zoomFactor) 
      : Math.max(0.08, currentK / zoomFactor);

    // Zoom centered relative to mouse cursor coordinate
    const nextX = mouseX - ((mouseX - currentX) / currentK) * nextK;
    const nextY = mouseY - ((mouseY - currentY) / currentK) * nextK;

    setTransform({ x: nextX, y: nextY, k: nextK });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!containerRef.current || isAnimating) return;
    click();
    
    // Smoothly fly back to standard fit-to-viewport bounds
    const fit = getFitTransform();
    setTransform(fit);
  };

  // 6. Procedural Graticules (Latitude & Longitude grid lines) [99]
  const graticules = useMemo(() => {
    const paths: string[] = [];
    const step = 15; // Grid interval in degrees
    
    // Latitude parallels
    for (let lat = -75; lat <= 75; lat += step) {
      let path = "";
      for (let lon = -180; lon <= 180; lon += 5) {
        const { x, y } = project(lon, lat);
        path += `${path === "" ? "M" : "L"} ${x} ${y}`;
      }
      paths.push(path);
    }

    // Longitude meridians
    for (let lon = -180; lon <= 180; lon += step) {
      let path = "";
      for (let lat = -75; lat <= 75; lat += 5) {
        const { x, y } = project(lon, lat);
        path += `${path === "" ? "M" : "L"} ${x} ${y}`;
      }
      paths.push(path);
    }
    return paths;
  }, []);

  // 7. Pre-project and cache places coordinates to completely prevent trig calls on pan frames
  const projectedPlaces = useMemo(() => {
    return places.map((place) => {
      if (!place.coordinates) return null;
      const [longitude, latitude] = place.coordinates;
      const { x, y } = project(longitude, latitude);
      return { ...place, projX: x, projY: y, };
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
    if (typeof window === "undefined") return;
    const ctx = sweepAudioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
    sweepAudioCtxRef.current = ctx;

    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(15, now + 0.08);

    gain.gain.setValueAtTime(0.015, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }, []);

  const playSonarPing = useCallback((placeName: string) => {
    if (typeof window === "undefined") return;
    const ctx = sweepAudioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
    sweepAudioCtxRef.current = ctx;

    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // High, chilling echo ping
    osc.type = "sine";
    osc.frequency.setValueAtTime(1450, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 1.2);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.3);
  }, []);

  /* ═══════════════════════════════════════════════════════════════
     HARDWARE ACCELERATED SWEEPING ENGINE & INTERSECTION CORRELATOR
     ═══════════════════════════════════════════════════════════════ */
  useEffect(() => {
    let frameId: number;
    let lastTime = Date.now();

    const animateSweep = () => {
      const now = Date.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Sweep rotates smoothly at 1.5 rad/sec (approx 85 deg/sec)
      sweepAngleRef.current = (sweepAngleRef.current + delta * 1.5) % (Math.PI * 2);

      // DOM-direct rotation of the SVG radar group (0% React paint overhead!)
      if (sweepGroupRef.current) {
        sweepGroupRef.current.setAttribute("transform", `rotate(${(sweepAngleRef.current * 180) / Math.PI} 50 50)`);
      }

      // Handle geodetic pin intersects in real-time
      if (mouseWorldPosRef.current && sweepOutlineRef.current && sweepLensRef.current) {
        const mx = mouseWorldPosRef.current.x;
        const my = mouseWorldPosRef.current.y;

        // Position sweep outline and translucent lens around coordinates
        sweepOutlineRef.current.setAttribute("cx", mx.toString());
        sweepOutlineRef.current.setAttribute("cy", my.toString());
        sweepLensRef.current.setAttribute("cx", mx.toString());
        sweepLensRef.current.setAttribute("cy", my.toString());

        // Scan all pins for proximity intersection
        projectedPlaces.forEach((place) => {
          const dx = place.projX - mx;
          const dy = place.projY - my;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Radar active beam radius = 280 units in projected coordinates
          if (dist < 280) {
            const angleToPin = Math.atan2(dy, dx);
            const normAngleToPin = angleToPin < 0 ? angleToPin + Math.PI * 2 : angleToPin;
            const angularDiff = Math.abs(sweepAngleRef.current - normAngleToPin);

            // If swept beam intersects pin's angular wedge (within 4 degrees tolerance)
            if (angularDiff < 0.07) {
              const lastPlayed = clickedPinsRef.current[place.slug] || 0;
              if (now - lastPlayed > 2200) { // Squelch threshold limit
                clickedPinsRef.current[place.slug] = now;
                
                // Play geophone sweep click audio
                playSweepClick();

                // If hovered, sound the deep sonar ping!
                if (hoveredPlaceSlug === place.slug || selectedPlaceSlug === place.slug) {
                  playSonarPing(place.name);
                }

                // Procedurally trigger vector flare animations
                const pinEl = document.getElementById(`pin-${place.slug}`);
                if (pinEl) {
                  pinEl.classList.remove("radar-pinged");
                  // Trigger DOM reflow to re-fire SVG keyframe
                  void pinEl.offsetWidth; 
                  pinEl.classList.add("radar-pinged");
                }
              }
            }
          }
        });
      }

      frameId = requestAnimationFrame(animateSweep);
    };

    frameId = requestAnimationFrame(animateSweep);
    return () => cancelAnimationFrame(frameId);
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
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes radar-flare {
            0% { transform: scale(1); filter: brightness(1.8); }
            50% { transform: scale(1.35); filter: brightness(2.6) drop-shadow(0 0 6px currentColor); }
            100% { transform: scale(1); filter: brightness(1); }
          }
          .radar-pinged {
            animation: radar-flare 0.6s cubic-bezier(0.25, 1, 0.5, 1);
          }
        `
      }} />

      {/* SVG Canvas Root */}
      <svg className="w-full h-full" style={{ imageRendering: "pixelated" }}>
        {/* Dynamic content layer grouped under optimized transform ref */}
        <g ref={mapContentRef} style={{ transformOrigin: "0px 0px" }}>
          
          {/* Static Country Boundaries Base Layer */}
          <CountryBaseLayer />

          {/* Graticules Grid lines */}
          <GraticulesLayer graticules={graticules} />

          {/* Geodetic Coaxial Thread connections */}
          <g>
            {projectedConnections.map((line) => (
              <line
                key={line.key}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={colors.archive.amberDim}
                strokeWidth={0.85}
                opacity={0.35}
                strokeDasharray="2, 6"
              />
            ))}
          </g>

          {/* Map Pins and Labels Layer */}
          <g>
            {projectedPlaces.map((place) => {
              const color = getStatusColor(place);
              const isSelected = selectedPlaceSlug === place.slug;
              const isHovered = hoveredPlaceSlug === place.slug;
              
              return (
                <g 
                  key={`group-${place.slug}`}
                  onMouseEnter={() => setHoveredPlaceSlug(place.slug)}
                  onMouseLeave={() => setHoveredPlaceSlug(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    click();
                    selectPlace(place.slug);
                  }}
                  className="cursor-pointer"
                >
                  {/* Coaxial focus concentric circle guides */}
                  {(isSelected || isHovered) && (
                    <>
                      <circle
                        cx={place.projX}
                        cy={place.projY}
                        r={22 / transformRef.current.k}
                        fill="none"
                        stroke={color}
                        strokeWidth={0.5}
                        opacity={0.3}
                        strokeDasharray="2, 2"
                      />
                      <circle
                        cx={place.projX}
                        cy={place.projY}
                        r={45 / transformRef.current.k}
                        fill="none"
                        stroke={color}
                        strokeWidth={0.3}
                        opacity={0.15}
                      />
                    </>
                  )}

                  {/* Physical Radar Scanner Pin Core */}
                  <g 
                    id={`pin-${place.slug}`} 
                    transformOrigin={`${place.projX}px ${place.projY}px`}
                  >
                    <circle
                      cx={place.projX}
                      cy={place.projY}
                      r={isSelected ? 6 / transformRef.current.k : 3.5 / transformRef.current.k}
                      fill={color}
                      stroke={isSelected ? "#fff" : "none"}
                      strokeWidth={isSelected ? 1.2 / transformRef.current.k : 0}
                      style={{
                        filter: isSelected || isHovered ? `drop-shadow(0 0 4px ${color})` : "none",
                        transition: "r 120ms ease, fill 120ms ease",
                      }}
                    />
                  </g>

                  {/* Monospace coordinate name labeling text (scaled procedurally to lock sizes) */}
                  {(isSelected || isHovered || transformRef.current.k > 0.45) && (
                    <text
                      x={place.projX}
                      y={place.projY - (isSelected ? 10 / transformRef.current.k : 7 / transformRef.current.k)}
                      textAnchor="middle"
                      fill={isSelected ? colors.archive.white : isHovered ? colors.archive.white : colors.archive.grayLight}
                      style={{
                        fontFamily: typography.mono,
                        fontSize: `${Math.max(6.5, Math.min(14, 10 / transformRef.current.k))}px`,
                        letterSpacing: "0.08em",
                        fontWeight: isSelected ? "bold" : "normal",
                        textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                        pointerEvents: "none",
                      }}
                    >
                      {place.name.toUpperCase()}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* Active sweeping lens indicator group overlay */}
          <g>
            <circle
              ref={sweepOutlineRef}
              cx="0"
              cy="0"
              r={280}
              fill="none"
              stroke={colors.archive.amber}
              strokeWidth={0.8}
              opacity={0.06}
              pointerEvents="none"
            />
            <circle
              ref={sweepLensRef}
              cx="0"
              cy="0"
              r={280}
              fill="url(#radar-sweeper-radial)"
              pointerEvents="none"
              opacity={0.4}
              style={{ mixBlendMode: "screen" }}
            />
            <g ref={sweepGroupRef} pointerEvents="none">
              {/* Pie-shaped swept beam sector path */}
              <path
                d="M 0 0 L 280 0 A 280 280 0 0 1 242.4 140 Z"
                fill="url(#radar-sweeper-beam)"
                opacity={0.12}
                style={{ mixBlendMode: "screen" }}
              />
              {/* Sharp flyback leading line */}
              <line
                x1="0"
                y1="0"
                x2="280"
                y2="0"
                stroke={microform.halogen}
                strokeWidth={1.2}
                opacity={0.45}
              />
            </g>
          </g>

        </g>
      </svg>

      {/* SVG Definitions mapping filters and sweeping gradients */}
      <svg className="w-0 h-0 absolute">
        <defs>
          <linearGradient id="radar-sweeper-beam" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={microform.halogen} stopOpacity="1" />
            <stop offset="35%" stopColor={microform.halogen} stopOpacity="0.3" />
            <stop offset="100%" stopColor={microform.halogen} stopOpacity="0" />
          </linearGradient>
          <radialGradient id="radar-sweeper-radial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="85%" stopColor="transparent" stopOpacity="0" />
            <stop offset="97%" stopColor={colors.archive.amber} stopOpacity="0.08" />
            <stop offset="100%" stopColor={microform.halogen} stopOpacity="0.22" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
};

export default AtlasMap;
