'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAtlasStore } from '@/state/atlasStore';
import { useAudioStore } from '@/state/audioStore';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useUIStore } from '@/state/uiStore';
import { colors, typography, microform } from '@/styles/theme';

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

const NODE_WIDTH = 220;
const NODE_HEIGHT = 68;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const MIN_NODE_SPACING = 115;

export const EvidenceBoard: React.FC = () => {
  const { places } = useAtlasStore();
  const { click } = useAudioStore();
  const { activeInvestigationId } = useInvestigationStore();
  const { status } = useUIStore();
  const visited = useMemo(() => new Set(status.investigatedSlugs), [status.investigatedSlugs]);

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
  const [hasFitted, setHasFitted] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragStartClientRef = useRef({ x: 0, y: 0 });
  const initializedRef = useRef<Set<string>>(new Set());

  // Initialize positions using phyllotaxis spiral
  useEffect(() => {
    if (dims.width === 0 || dims.height === 0) return;
    const { nodePositions: existing, setNodePosition: setPos } = useEvidenceBoardStore.getState();
    places.forEach((place, i) => {
      if (!initializedRef.current.has(place.slug) && !existing[place.slug]) {
        initializedRef.current.add(place.slug);
        const r = MIN_NODE_SPACING * Math.sqrt(i + 1);
        const theta = i * GOLDEN_ANGLE;
        setPos(place.slug, {
          x: dims.width / 2 + r * Math.cos(theta),
          y: dims.height / 2 + r * Math.sin(theta),
        });
      }
    });
  }, [places, dims.width, dims.height]);

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

  useEffect(() => {
    if (renderNodes.length > 0 && !hasFitted && dims.width > 0 && dims.height > 0) {
      const xs = renderNodes.map((n) => n.x);
      const ys = renderNodes.map((n) => n.y);
      const minX = Math.min(...xs) - NODE_WIDTH;
      const maxX = Math.max(...xs) + NODE_WIDTH;
      const minY = Math.min(...ys) - NODE_HEIGHT;
      const maxY = Math.max(...ys) + NODE_HEIGHT;
      const contentW = maxX - minX;
      const contentH = maxY - minY;
      const nextZoom = Math.min((dims.width / contentW) * 0.9, (dims.height / contentH) * 0.9, 1);
      const nextPanX = (dims.width - contentW * nextZoom) / 2 - minX * nextZoom;
      const nextPanY = (dims.height - contentH * nextZoom) / 2 - minY * nextZoom;
      setViewport(nextZoom, { x: nextPanX, y: nextPanY });
      setHasFitted(true);
    }
  }, [renderNodes, dims, hasFitted, setViewport]);

  const filteredSlugs = useMemo(() => {
    if (!search.trim()) return new Set(renderNodes.map((n) => n.id));
    const q = search.toLowerCase();
    return new Set(renderNodes.filter((n) => n.name.toLowerCase().includes(q)).map((n) => n.id));
  }, [renderNodes, search]);

  const allEdges = useMemo(() => [...discoveredEdges, ...playerEdges], [discoveredEdges, playerEdges]);

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
      style={{
        backgroundColor: '#161412',
        backgroundImage: `
          radial-gradient(ellipse at 50% 30%, rgba(255, 170, 85, 0.025) 0%, transparent 60%),
          url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")
        `,
      }}
      onMouseDown={onContainerMouseDown}
      onMouseMove={onContainerMouseMove}
      onMouseUp={onContainerMouseUp}
      onMouseLeave={onContainerMouseUp}
      onWheel={onWheel}
    >
      {/* Felt board texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 40%, transparent 30%, rgba(10, 8, 6, 0.6) 100%)`,
          mixBlendMode: 'multiply',
        }}
      />

      {/* Edges SVG — string and wire aesthetic */}
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
          const isHighlighted = selectedNodeId && (a.id === selectedNodeId || b.id === selectedNodeId);

          // String / wire / thread aesthetic
          const isSuspected = edge.type === 'suspected';
          const isUnstable = edge.type === 'unstable';
          const edgeColor = isUnstable
            ? 'rgba(168, 93, 93, 0.45)'
            : isSuspected
            ? 'rgba(180, 160, 130, 0.5)'
            : 'rgba(140, 130, 110, 0.55)';
          const strokeWidth = isHighlighted ? 1.2 : 0.7;
          const dashArray = isSuspected ? '3 4' : isUnstable ? '1 3' : 'none';

          return (
            <line
              key={edge.id || i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={edgeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              opacity={isDimmed ? 0.06 : isHighlighted ? 0.7 : 0.35}
              style={{
                filter: isHighlighted
                  ? 'drop-shadow(0 0 2px rgba(255, 170, 85, 0.3))'
                  : 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))',
              }}
            />
          );
        })}

        {selectedNodeId && (() => {
          const a = renderNodes.find((n) => n.id === selectedNodeId);
          if (!a) return null;
          return (
            <line
              x1={a.x}
              y1={a.y}
              x2={mouseWorld.x}
              y2={mouseWorld.y}
              stroke="rgba(201, 169, 110, 0.5)"
              strokeWidth={0.6}
              strokeDasharray="4 4"
              opacity={0.35}
              style={{ filter: 'drop-shadow(0 0 2px rgba(201, 169, 110, 0.2))' }}
            />
          );
        })()}
      </svg>

      {/* Nodes — microfiche card aesthetic */}
      {renderNodes.map((node) => {
        const isFiltered = filteredSlugs.has(node.id);
        const isSelected = selectedNodeId === node.id;
        const isActiveInvestigation = activeInvestigationId === node.id;
        const hasVisited = visited.has(node.id);

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
              opacity: isFiltered ? (hasVisited ? 1 : 0.45) : 0.08,
              zIndex: isSelected ? 20 : isActiveInvestigation ? 15 : 10,
            }}
            onMouseDown={(e) => onNodeMouseDown(e, node.id)}
            whileHover={{ scale: 1.04 }}
            animate={{
              boxShadow: isSelected
                ? `0 0 0 1px ${microform.mahoganyLight}, 0 0 20px rgba(255, 170, 85, 0.15), 0 4px 12px rgba(0,0,0,0.5)`
                : `0 2px 6px rgba(0,0,0,0.4), 0 0 0 1px ${microform.iron}`,
            }}
          >
            <div
              className="w-full h-full flex flex-col justify-center px-3 relative overflow-hidden"
              style={{
                background: hasVisited
                  ? `linear-gradient(135deg, ${microform.mahogany} 0%, ${colors.archive.surfaceRaised} 100%)`
                  : `linear-gradient(135deg, #1a1816 0%, #141210 100%)`,
                border: `1px solid ${isSelected ? colors.archive.amber : microform.mahoganyLight}`,
                borderRadius: '1px',
              }}
            >
              {/* Halogen highlight on selected */}
              {isSelected && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,170,85,0.04) 0%, transparent 60%)',
                  }}
                />
              )}

              <div
                className="truncate relative z-10"
                style={{
                  color: hasVisited ? colors.archive.white : colors.archive.gray,
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.xs,
                  letterSpacing: '0.02em',
                  textShadow: hasVisited ? microform.halogenText : 'none',
                }}
              >
                {node.name}
              </div>
              <div className="flex gap-2 mt-1 relative z-10">
                <span
                  style={{
                    color: statusColor(node.status),
                    fontFamily: typography.mono,
                    fontSize: '0.5rem',
                    letterSpacing: '0.06em',
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
                {!hasVisited && (
                  <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: '0.5rem', opacity: 0.6 }}>
                    UNINDEXED
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Search — iron bezel */}
      <div
        className="absolute top-4 left-4 z-30 flex items-center gap-2 px-3 py-2"
        style={{
          border: `1px solid ${microform.iron}`,
          boxShadow: `0 0 0 1px ${microform.mahogany}, 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)`,
          background: `linear-gradient(180deg, ${microform.mahogany} 0%, ${colors.archive.surface} 100%)`,
        }}
      >
        <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.sm }}>
          ⌕
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter index cards..."
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

      {/* Hint — brass plate */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2"
        style={{
          border: `1px solid ${microform.mahoganyLight}`,
          background: `linear-gradient(180deg, ${microform.mahogany} 0%, ${microform.iron} 100%)`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        <span style={{ color: 'rgba(255,170,85,0.6)', fontFamily: typography.mono, fontSize: '0.5625rem', letterSpacing: '0.08em' }}>
          CLICK TO SELECT • CLICK ANOTHER TO CONNECT • DRAG TO MOVE
        </span>
      </div>

      {/* Stats — stamped plate */}
      <div
        className="absolute top-4 right-4 z-30 px-3 py-2"
        style={{
          border: `1px solid ${microform.iron}`,
          background: `linear-gradient(180deg, ${microform.mahogany} 0%, ${colors.archive.surface} 100%)`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
          {renderNodes.length} CARDS • {allEdges.length} THREADS
        </span>
      </div>

      {/* Zoom controls — mechanical switches */}
      <div
        className="absolute bottom-4 left-4 z-30 flex flex-col gap-1"
        style={{
          background: microform.iron,
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          border: `1px solid ${microform.mahogany}`,
        }}
      >
        <button
          onClick={() => {
            const { zoom: z, pan: p } = useEvidenceBoardStore.getState();
            setViewport(Math.min(3, z * 1.2), p);
          }}
          className="px-3 py-1 transition-colors hover:bg-white/5"
          style={{ color: colors.archive.gray, fontFamily: typography.mono, borderBottom: `1px solid ${microform.mahogany}` }}
        >
          +
        </button>
        <button
          onClick={() => {
            const { zoom: z, pan: p } = useEvidenceBoardStore.getState();
            setViewport(Math.max(0.3, z / 1.2), p);
          }}
          className="px-3 py-1 transition-colors hover:bg-white/5"
          style={{ color: colors.archive.gray, fontFamily: typography.mono, borderBottom: `1px solid ${microform.mahogany}` }}
        >
          −
        </button>
        <button
          onClick={() => setViewport(1, { x: 0, y: 0 })}
          className="px-3 py-1 transition-colors hover:bg-white/5"
          style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}
        >
          ⌂
        </button>
      </div>

      {/* Minimap — felt tray */}
      <div
        className="absolute bottom-4 right-4 z-30 border overflow-hidden"
        style={{
          width: 140,
          height: 100,
          border: `1px solid ${microform.iron}`,
          boxShadow: `0 0 0 1px ${microform.mahogany}, 0 4px 12px rgba(0,0,0,0.4)`,
          backgroundColor: '#141210',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
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
              opacity={visited.has(n.id) ? 0.5 : 0.2}
              rx={0.5}
            />
          ))}
          <rect
            x={viewX}
            y={viewY}
            width={viewW}
            height={viewH}
            fill="none"
            stroke="rgba(255, 170, 85, 0.4)"
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