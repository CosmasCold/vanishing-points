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
   MASTER COMPONENT (PERFORMANCE OPTIMIZED, RADAR SCANNER DELETED)
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
    if (!isDragging) return;

    // Apply high-performance DOM-direct translation (0ms React lag!)
    const dragX = e.clientX - dragStart.current.x;
    const dragY = e.clientY - dragStart.current.y;
    const currentK = transformRef.current.k;

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

  // 5. Procedural Graticules (Latitude & Longitude grid lines) [99]
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

  // 6. Pre-project and cache places coordinates to prevent trig calls on pan frames
  const projectedPlaces = useMemo(() => {
    return places.map((place) => {
      if (!place.coordinates) return null;
      const [longitude, latitude] = place.coordinates;
      const { x, y } = project(longitude, latitude);
      return { ...place, projX: x, projY: y, };
    }).filter((p): p is NonNullable<typeof p> => p !== null);
  }, [places]);

  // 7. Pre-project static geodetic thread connections
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

  // 8. Map Place status colors to theme
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

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
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

                  {/* Physical Map Pin Core */}
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

        </g>
      </svg>
    </div>
  );
};

export default AtlasMap;
