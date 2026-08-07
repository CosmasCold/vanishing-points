'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAtlasStore } from '@/state/atlasStore';
import { useAudioStore } from '@/state/audioStore';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { colors, typography } from '@/styles/theme';

interface BoardNode {
  id: string;
  name: string;
  status: string;
  dangerLevel: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 56;

export const EvidenceBoard: React.FC = () => {
  const { places, selectPlace } = useAtlasStore();
  const { click } = useAudioStore();
  const { activeInvestigationId } = useInvestigationStore();
  const {
    nodePositions,
    selectedNodeId,
    discoveredEdges,
    playerEdges,
    zoom,
    pan,
    setNodePosition,
    selectNode,
    addPlayerEdge,
    setViewport,
  } = useEvidenceBoardStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 1200, height: 800 });
  const [search, setSearch] = useState('');
  const [mouseWorld, setMouseWorld] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragStartClientRef = useRef({ x: 0, y: 0 });
  const initializedRef = useRef<Set<string>>(new Set());

  // Initialize positions for new places once
  useEffect(() => {
    const { nodePositions: existing, setNodePosition: setPos } = useEvidenceBoardStore.getState();
    places.forEach((place, i) => {
      if (!initializedRef.current.has(place.slug) && !existing[place.slug]) {
        initializedRef.current.add(place.slug);
        const angle = (i / Math.max(places.length, 1)) * Math.PI * 2 + (Math.random() - 0.5);
        const radius = 80 + Math.random() * 120;
        setPos(place.slug, {
          x: dims.width / 2 + Math.cos(angle) * radius,
          y: dims.height / 2 + Math.sin(angle) * radius,
        });
      }
    });
  }, [places, dims.width, dims.height]);

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

  // Build renderable nodes from places + persisted positions
  const renderNodes = useMemo(() => {
    const nodes: BoardNode[] = [];
    places.forEach((place) => {
      const pos = nodePositions[place.slug];
      if (!pos) return;
      nodes.push({
        id: place.slug,
        name: place.name,
        status: place.status || 'verified',
        dangerLevel: place.dangerLevel || 0,
        x: pos.x,
        y: pos.y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
    });
    return nodes;
  }, [places, nodePositions]);

  // Search filter
  const filteredSlugs = useMemo(() => {
    if (!search.trim()) return new Set(renderNodes.map((n) => n.id));
    const q = search.toLowerCase();
    return new Set(renderNodes.filter((n) => n.name.toLowerCase().includes(q)).map((n) => n.id));
  }, [renderNodes, search]);

  // All edges (discovered + player-drawn)
  const allEdges = useMemo(() => [...discoveredEdges, ...playerEdges], [discoveredEdges, playerEdges]);

  // Event handlers
  const onContainerMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.board-node')) return;
    const { pan: currentPan } = useEvidenceBoardStore.getState();
    setIsPanning(true);
    setPanStart({ x: e.clientX - currentPan.x, y: e.clientY - currentPan.y });
  }, []);

  const onNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const { zoom: z, pan: p, nodePositions: positions } = useEvidenceBoardStore.getState();
    const world = { x: (e.clientX - p.x) / z, y: (e.clientY - p.y) / z };
    const pos = positions[nodeId] || { x: 0, y: 0 };
    dragOffsetRef.current = { x: world.x - pos.x, y: world.y - pos.y };
    dragStartClientRef.current = { x: e.clientX, y: e.clientY };
    setDragNodeId(nodeId);
  }, []);

  const onContainerMouseMove = useCallback((e: React.MouseEvent) => {
    const { zoom: z, pan: p } = useEvidenceBoardStore.getState();
    const world = { x: (e.clientX - p.x) / z, y: (e.clientY - p.y) / z };
    setMouseWorld(world);

    if (dragNodeId) {
      setNodePosition(dragNodeId, {
        x: world.x - dragOffsetRef.current.x,
        y: world.y - dragOffsetRef.current.y,
      });
    } else if (isPanning) {
      setViewport(z, { x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  }, [dragNodeId, isPanning, panStart, setNodePosition, setViewport]);

  const onContainerMouseUp = useCallback((e: React.MouseEvent) => {
    if (dragNodeId) {
      const dx = e.clientX - dragStartClientRef.current.x;
      const dy = e.clientY - dragStartClientRef.current.y;
      const isClick = Math.abs(dx) < 5 && Math.abs(dy) < 5;

      if (isClick) {
        const currentSelected = useEvidenceBoardStore.getState().selectedNodeId;
        if (currentSelected === null) {
          selectNode(dragNodeId);
        } else if (currentSelected === dragNodeId) {
          selectNode(null);
        } else {
          addPlayerEdge({
            id: `player-${currentSelected}-${dragNodeId}`,
            source: currentSelected,
            target: dragNodeId,
            type: 'suspected',
            label: 'SUSPECTED',
          });
          selectNode(null);
        }
        click();
      }
      setDragNodeId(null);
    }
    setIsPanning(false);
  }, [dragNodeId, selectNode, addPlayerEdge, click]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const { zoom: z, pan: p } = useEvidenceBoardStore.getState();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const nextZoom = Math.max(0.3, Math.min(3, z * delta));
    setViewport(nextZoom, p);
  }, [setViewport]);

  // Minimap bounds
  const bounds = useMemo(() => {
    if (renderNodes.length === 0) return { minX: 0, minY: 0, maxX: dims.width, maxY: dims.height };
    const xs = renderNodes.map((n) => n.x);
    const ys = renderNodes.map((n) => n.y);
    return {
      minX: Math.min(...xs) - 100,
      minY: Math.min(...ys) - 100,
      maxX: Math.max(...xs) + 100,
      maxY: Math.max(...ys) + 100,
    };
  }, [renderNodes, dims]);

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
      onMouseDown={onContainerMouseDown}
      onMouseMove={onContainerMouseMove}
      onMouseUp={onContainerMouseUp}
      onMouseLeave={onContainerMouseUp}
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
        {allEdges.map((edge, i) => {
          const a = renderNodes.find((n) => n.id === edge.source);
          const b = renderNodes.find((n) => n.id === edge.target);
          if (!a || !b) return null;
          const isDimmed = !filteredSlugs.has(a.id) || !filteredSlugs.has(b.id);
          const edgeColor =
            edge.type === 'confirmed' ? colors.archive.green :
            edge.type === 'unstable' ? colors.archive.red :
            colors.archive.amber;
          return (
            <line
              key={edge.id || i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={edgeColor}
              strokeWidth={selectedNodeId && (a.id === selectedNodeId || b.id === selectedNodeId) ? 1.5 : 0.5}
              opacity={isDimmed ? 0.05 : selectedNodeId && (a.id === selectedNodeId || b.id === selectedNodeId) ? 0.6 : 0.15}
            />
          );
        })}

        {/* Pending connection line */}
        {selectedNodeId && (() => {
          const a = renderNodes.find((n) => n.id === selectedNodeId);
          if (!a) return null;
          return (
            <line
              x1={a.x}
              y1={a.y}
              x2={mouseWorld.x}
              y2={mouseWorld.y}
              stroke={colors.archive.amber}
              strokeWidth={0.5}
              strokeDasharray="4 4"
              opacity={0.4}
            />
          );
        })()}
      </svg>

      {/* Nodes */}
      {renderNodes.map((node) => {
        const isFiltered = filteredSlugs.has(node.id);
        const isSelected = selectedNodeId === node.id;
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
            onMouseDown={(e) => onNodeMouseDown(e, node.id)}
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
                  {node.status.toUpperCase()}
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

      {/* Hint */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3 py-1 border pointer-events-none"
        style={{ borderColor: colors.archive.grayDark, backgroundColor: 'rgba(20, 20, 18, 0.9)' }}
      >
        <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: '0.625rem' }}>
          CLICK TO SELECT • CLICK ANOTHER TO CONNECT • DRAG TO MOVE
        </span>
      </div>

      {/* Stats */}
      <div
        className="absolute top-4 right-4 z-30 px-3 py-2 border"
        style={{ borderColor: colors.archive.grayDark, backgroundColor: 'rgba(20, 20, 18, 0.9)' }}
      >
        <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
          {renderNodes.length} NODES • {allEdges.length} CONNECTIONS
        </span>
      </div>

      {/* Zoom controls */}
      <div
        className="absolute bottom-4 left-4 z-30 flex flex-col gap-1"
        style={{ backgroundColor: 'rgba(20, 20, 18, 0.9)' }}
      >
        <button
          onClick={() => {
            const { zoom: z, pan: p } = useEvidenceBoardStore.getState();
            setViewport(Math.min(3, z * 1.2), p);
          }}
          className="px-3 py-1 border hover:border-amber-700 transition-colors"
          style={{ borderColor: colors.archive.grayDark, color: colors.archive.gray, fontFamily: typography.mono }}
        >
          +
        </button>
        <button
          onClick={() => {
            const { zoom: z, pan: p } = useEvidenceBoardStore.getState();
            setViewport(Math.max(0.3, z / 1.2), p);
          }}
          className="px-3 py-1 border hover:border-amber-700 transition-colors"
          style={{ borderColor: colors.archive.grayDark, color: colors.archive.gray, fontFamily: typography.mono }}
        >
          −
        </button>
        <button
          onClick={() => setViewport(1, { x: 0, y: 0 })}
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
          {renderNodes.map((n) => (
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