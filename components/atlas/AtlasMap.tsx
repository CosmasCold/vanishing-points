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

  // 1. Measure and track container size dynamically
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

  // 7. Map Place status colors to theme
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
          {/* Subtle ocean grid lines (graticules) */}
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
              />
            ))}
          </g>

          {/* Map Base Layer: High-fidelity simplified country paths */}
          <g>
            {(worldMapData as CountryGeo[]).map((country) => (
              <path
                key={country.code}
                d={country.path}
                fill="#161310" // Dark brown/charcoal [99]
                stroke="#2a221a" // Very faint borders
                strokeWidth={1.2 / transform.k} // Border stays crisp
                className="transition-colors duration-200 hover:fill-[#1e1915]"
                style={{ vectorEffect: "non-scaling-stroke" }}
              />
            ))}
          </g>

          {/* Connection Lines (Geodetic grids/threads) [94, 99] */}
          <g>
            {places.map((place) => {
              if (!place.coordinates || !place.connectedTo) return null;
              const { x: x1, y: y1 } = project(place.coordinates[0], place.coordinates[1]);
              
              return place.connectedTo.map((slug) => {
                const target = places.find((p) => p.slug === slug);
                if (!target || !target.coordinates) return null;
                const { x: x2, y: y2 } = project(target.coordinates[0], target.coordinates[1]);

                return (
                  <line
                    key={`conn-${place.slug}-${slug}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={microform.halogen}
                    strokeWidth={0.7 / transform.k}
                    opacity={0.06}
                    strokeDasharray="5, 5"
                  />
                );
              });
            })}
          </g>

          {/* Place Markers Layer [95] */}
          <g>
            {places.map((place) => {
              if (!place.coordinates) return null;
              const [longitude, latitude] = place.coordinates;
              const { x, y } = project(longitude, latitude);
              
              const isSelected = selectedPlaceSlug === place.slug;
              const isHovered = hoveredPlaceSlug === place.slug;
              const statusColor = getStatusColor(place);

              // Responsive scaling: keeps pixel dimensions crisp at any scale [95]
              const baseScale = isSelected ? 1.4 : isHovered ? 1.25 : 1.0;
              const markerScale = baseScale / transform.k;

              const handleMarkerClick = (e: React.MouseEvent) => {
                e.stopPropagation();
                click();
                selectPlace(place.slug);
                selectNode(place.slug);
                setFocusNode(place.slug);
                setViewMode("focus");
              };

              return (
                <g
                  key={`marker-${place.slug}`}
                  transform={`translate(${x}, ${y}) scale(${markerScale})`}
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
            <span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50%", background: colors.archive.green }} />
            VERIFIED NO-DRIFT
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50%", background: colors.archive.red }} />
            SEALED SECTOR
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50%", background: colors.archive.blue }} />
            WHISPERED ECHO
          </div>
          <div className="flex items-center gap-2">
            <span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50%", background: microform.halogen }} />
            MIRAGE CORRELATION
          </div>
        </div>
      </div>
    </div>
  );
};

export default AtlasMap;
