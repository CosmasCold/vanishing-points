'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAtlasStore } from '@/state/atlasStore';
import { useAudioStore } from '@/state/audioStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { colors, typography } from '@/styles/theme';

interface BoardNode {
  id: string;
  name: string;
  status: string;
  dangerLevel: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
}

interface BoardEdge {
  source: string;
  target: string;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 56;
const REPULSION = 8000;
const SPRING_LENGTH = 220;
const SPRING_STRENGTH = 0.03;
const DAMPING = 0.88;
const CENTER_FORCE = 0.008;

export const EvidenceBoard: React.FC = () => {
  const { places, selectPlace } = useAtlasStore();
  const { click } = useAudioStore();
  const { activeInvestigationId } = useInvestigationStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 1200, height: 800 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const animRef = useRef<number>(0);

  // Build nodes and edges
  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map<string, BoardNode>();
    const edgeList: BoardEdge[] = [];

    places.forEach((place, i) => {
      const angle = (i / places.length) * Math.PI * 2;
      const radius = Math.min(dims.width, dims.height) * 0.35;
      nodeMap.set(place.slug, {
        id: place.slug,
        name: place.name,
        status: place.status || 'verified',
        dangerLevel: place.dangerLevel || 0,
        x: dims.width / 2 + Math.cos(angle) * radius,
        y: dims.height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });

      place.connectedTo?.forEach((targetSlug) => {
        if (places.find((p) => p.slug === targetSlug)) {
          edgeList.push({ source: place.slug, target: targetSlug });
        }
      });
    });

    return { nodes: Array.from(nodeMap.values()), edges: edgeList };
  }, [places, dims.width, dims.height]);

  const [simNodes, setSimNodes] = useState<BoardNode[]>(nodes);

  // Sync nodes when places change
  useEffect(() => {
    setSimNodes((prev) => {
      const map = new Map(prev.map((n) => [n.id, n]));
      return nodes.map((n) => map.get(n.id) || n);
    });
  }, [nodes]);

  // Force simulation
  useEffect(() => {
    let running = true;

    const step = () => {
      if (!running) return;

      setSimNodes((prev) => {
        const next = prev.map((n) => ({ ...n }));

        // Repulsion
        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const a = next[i];
            const b = next[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = REPULSION / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            a.vx += fx;
            a.vy += fy;
            b.vx -= fx;
            b.vy -= fy;
          }
        }

        // Spring attraction along edges
        edges.forEach((edge) => {
          const a = next.find((n) => n.id === edge.source);
          const b = next.find((n) => n.id === edge.target);
          if (!a || !b) return;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - SPRING_LENGTH) * SPRING_STRENGTH;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        });

        // Center gravity
        next.forEach((n) => {
          n.vx += (dims.width / 2 - n.x) * CENTER_FORCE;
          n.vy += (dims.height / 2 - n.y) * CENTER_FORCE;
          n.vx *= DAMPING;
          n.vy *= DAMPING;
          n.x += n.vx;
          n.y += n.vy;
        });

        return next;
      });

      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [edges, dims.width, dims.height]);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDims({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Pan handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.board-node')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [isDragging, dragStart]);

  const onMouseUp = useCallback(() => setIsDragging(false), []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.3, Math.min(3, z * delta)));
  }, []);

  const filteredNodes = useMemo(() => {
    if (!search.trim()) return simNodes;
    const q = search.toLowerCase();
    return simNodes.filter((n) => n.name.toLowerCase().includes(q));
  }, [simNodes, search]);

  const filteredIds = new Set(filteredNodes.map((n) => n.id));

  const handleNodeClick = (id: string) => {
    click();
    setSelectedId(id);
    selectPlace(id);
  };

  // Minimap
  const bounds = useMemo(() => {
    if (simNodes.length === 0) return { minX: 0, minY: 0, maxX: dims.width, maxY: dims.height };
    const xs = simNodes.map((n) => n.x);
    const ys = simNodes.map((n) => n.y);
    return {
      minX: Math.min(...xs) - 100,
      minY: Math.min(...ys) - 100,
      maxX: Math.max(...xs) + 100,
      maxY: Math.max(...ys) + 100,
    };
  }, [simNodes, dims]);

  const mapWidth = bounds.maxX - bounds.minX;
  const mapHeight = bounds.maxY - bounds.minY;

  const miniScale = Math.min(120 / mapWidth, 80 / mapHeight);

  const viewX = (-pan.x / zoom - bounds.minX) * miniScale;
  const viewY = (-pan.y / zoom - bounds.minY) * miniScale;
  const viewW = (dims.width / zoom) * miniScale;
  const viewH = (dims.height / zoom) * miniScale;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ backgroundColor: colors.archive.black }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, ${colors.archive.grayDark} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      />

      {/* Edges SVG */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{
          width: dims.width,
          height: dims.height,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {edges.map((edge, i) => {
          const a = simNodes.find((n) => n.id === edge.source);
          const b = simNodes.find((n) => n.id === edge.target);
          if (!a || !b) return null;
          const isDimmed = !filteredIds.has(a.id) || !filteredIds.has(b.id);
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={colors.archive.blue}
              strokeWidth={selectedId && (a.id === selectedId || b.id === selectedId) ? 1.5 : 0.5}
              opacity={isDimmed ? 0.05 : selectedId && (a.id === selectedId || b.id === selectedId) ? 0.6 : 0.15}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {simNodes.map((node) => {
        const isFiltered = filteredIds.has(node.id);
        const isSelected = selectedId === node.id;
        const isActiveInvestigation = activeInvestigationId === node.id;

        return (
          <motion.div
            key={node.id}
            className="board-node absolute cursor-pointer select-none"
            style={{
              left: node.x - node.width / 2,
              top: node.y - node.height / 2,
              width: node.width,
              height: node.height,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: `${node.width / 2}px ${node.height / 2}px`,
              opacity: isFiltered ? 1 : 0.15,
              zIndex: isSelected ? 20 : isActiveInvestigation ? 15 : 10,
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleNodeClick(node.id);
            }}
            whileHover={{ scale: 1.05 }}
            animate={{
              borderColor: isSelected ? colors.archive.amber : statusColor(node.status),
              boxShadow: isSelected ? `0 0 12px ${colors.archive.amber}40` : 'none',
            }}
          >
            <div
              className="w-full h-full border flex flex-col justify-center px-3"
              style={{
                borderColor: isSelected ? colors.archive.amber : statusColor(node.status),
                backgroundColor: isSelected ? 'rgba(201, 169, 110, 0.12)' : 'rgba(20, 20, 18, 0.95)',
              }}
            >
              <div
                className="truncate"
                style={{
                  color: colors.archive.white,
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.xs,
                  letterSpacing: '0.02em',
                }}
              >
                {node.name}
              </div>
              <div className="flex gap-2 mt-1">
                <span
                  style={{
                    color: statusColor(node.status),
                    fontFamily: typography.mono,
                    fontSize: '0.5rem',
                    letterSpacing: '0.05em',
                  }}
                >
                  {(node.status).toUpperCase()}
                </span>
                <span
                  style={{
                    color: node.dangerLevel >= 4 ? colors.archive.red : colors.archive.gray,
                    fontFamily: typography.mono,
                    fontSize: '0.5rem',
                  }}
                >
                  D{node.dangerLevel}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Search */}
      <div
        className="absolute top-4 left-4 z-30 flex items-center gap-2 border px-3 py-2"
        style={{ borderColor: colors.archive.grayDark, backgroundColor: 'rgba(20, 20, 18, 0.9)' }}
      >
        <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.sm }}>
          ⌕
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter nodes..."
          className="bg-transparent outline-none w-48"
          style={{ color: colors.archive.white, fontFamily: typography.mono, fontSize: typography.sizes.xs }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}
          >
            ×
          </button>
        )}
      </div>

      {/* Stats */}
      <div
        className="absolute top-4 right-4 z-30 px-3 py-2 border"
        style={{ borderColor: colors.archive.grayDark, backgroundColor: 'rgba(20, 20, 18, 0.9)' }}
      >
        <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
          {places.length} NODES • {edges.length} CONNECTIONS
        </span>
      </div>

      {/* Zoom controls */}
      <div
        className="absolute bottom-4 left-4 z-30 flex flex-col gap-1"
        style={{ backgroundColor: 'rgba(20, 20, 18, 0.9)' }}
      >
        <button
          onClick={() => setZoom((z) => Math.min(3, z * 1.2))}
          className="px-3 py-1 border hover:border-amber-700 transition-colors"
          style={{ borderColor: colors.archive.grayDark, color: colors.archive.gray, fontFamily: typography.mono }}
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.3, z / 1.2))}
          className="px-3 py-1 border hover:border-amber-700 transition-colors"
          style={{ borderColor: colors.archive.grayDark, color: colors.archive.gray, fontFamily: typography.mono }}
        >
          −
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="px-3 py-1 border hover:border-amber-700 transition-colors"
          style={{ borderColor: colors.archive.grayDark, color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}
        >
          ⌂
        </button>
      </div>

      {/* Minimap */}
      <div
        className="absolute bottom-4 right-4 z-30 border overflow-hidden"
        style={{
          width: 140,
          height: 100,
          borderColor: colors.archive.grayDark,
          backgroundColor: 'rgba(20, 20, 18, 0.95)',
        }}
      >
        <svg width={140} height={100} viewBox={`0 0 ${mapWidth * miniScale} ${mapHeight * miniScale}`}>
          {/* Nodes as tiny rects */}
          {simNodes.map((n) => (
            <rect
              key={n.id}
              x={(n.x - bounds.minX - n.width / 2) * miniScale}
              y={(n.y - bounds.minY - n.height / 2) * miniScale}
              width={Math.max(2, n.width * miniScale)}
              height={Math.max(2, n.height * miniScale)}
              fill={statusColor(n.status)}
              opacity={0.6}
            />
          ))}
          {/* Viewport rect */}
          <rect
            x={viewX}
            y={viewY}
            width={viewW}
            height={viewH}
            fill="none"
            stroke={colors.archive.amber}
            strokeWidth={0.5}
          />
        </svg>
      </div>
    </div>
  );
};

function statusColor(status: string): string {
  switch (status) {
    case 'sealed': return colors.archive.red;
    case 'whispered': return colors.archive.blue;
    case 'mirage': return colors.archive.grayLight;
    default: return colors.archive.green;
  }
}