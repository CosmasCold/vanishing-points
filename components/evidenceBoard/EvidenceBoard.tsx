'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAtlasStore } from '@/state/atlasStore';
import { useAudioStore } from '@/state/audioStore';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useUIStore } from '@/state/uiStore';
import { colors, typography, microform } from '@/styles/theme';

interface BoardNodeView {
  id: string;
  name: string;
  status: string;
  dangerLevel: number;
  category: string;
  history: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const NODE_WIDTH = 218;
const NODE_HEIGHT = 92;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const MIN_NODE_SPACING = 130;

export const EvidenceBoard: React.FC = () => {
  const { places } = useAtlasStore();
  const { click } = useAudioStore();
  const { activeInvestigationId } = useInvestigationStore();
  const { status } = useUIStore();
  const visited = useMemo(() => new Set(status.investigatedSlugs), [status.investigatedSlugs]);

  const {
    nodePositions,
    selectedNodeId,
    focusNodeId,
    viewMode,
    filterMode,
    discoveredEdges,
    playerEdges,
    zoom,
    pan,
    setNodePosition,
    selectNode,
    setFocusNode,
    setViewMode,
    setFilterMode,
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

  useEffect(() => {
    if (dims.width === 0 || dims.height === 0) return;
    const { nodePositions: existing, setNodePosition: setPos } = useEvidenceBoardStore.getState();
    places.forEach((place, i) => {
      if (!initializedRef.current.has(place.slug) && !existing[place.slug]) {
        initializedRef.current.add(place.slug);
        const radius = MIN_NODE_SPACING * Math.sqrt(i + 1);
        const theta = i * GOLDEN_ANGLE;
        setPos(place.slug, {
          x: dims.width / 2 + radius * Math.cos(theta),
          y: dims.height / 2 + radius * Math.sin(theta),
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

  const filteredPlaces = useMemo(() => {
    const query = search.trim().toLowerCase();
    return places.filter((place) => {
      if (filterMode === 'visited' && !visited.has(place.slug)) return false;
      if (filterMode === 'sealed' && place.status !== 'sealed') return false;
      if (filterMode === 'whispered' && place.status !== 'whispered') return false;
      if (filterMode === 'mirage' && place.status !== 'mirage') return false;
      if (filterMode === 'suspected' && place.dangerLevel < 4 && place.status !== 'pending') return false;
      if (query) {
        const haystack = `${place.name} ${place.slug} ${place.history}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [places, filterMode, search, visited]);

  const placeLookup = useMemo(() => new Map(places.map((place) => [place.slug, place])), [places]);

  const visibleNodeIds = useMemo(() => {
    const ids = new Set<string>();
    const selected = selectedNodeId;
    const focus = focusNodeId ?? selected;

    const addNeighbors = (slug: string | null) => {
      if (!slug) return;
      const place = placeLookup.get(slug);
      if (!place) return;
      place.connectedTo.forEach((neighbor) => ids.add(neighbor));
      ids.add(slug);
    };

    filteredPlaces.forEach((place) => {
      if (viewMode === 'detail') {
        if (selected && (place.slug === selected || place.connectedTo.includes(selected))) {
          ids.add(place.slug);
        }
      } else if (viewMode === 'focus') {
        if (focus && (place.slug === focus || place.connectedTo.includes(focus))) {
          ids.add(place.slug);
        }
        if (visited.has(place.slug) || place.dangerLevel >= 4 || place.status === 'sealed' || place.status === 'whispered') {
          ids.add(place.slug);
        }
      } else {
        if (visited.has(place.slug) || place.dangerLevel >= 4 || place.status === 'sealed' || place.status === 'whispered' || place.status === 'mirage') {
          ids.add(place.slug);
        }
        if (selected) ids.add(selected);
      }
    });

    if (selected) ids.add(selected);
    if (focus) ids.add(focus);

    if (ids.size === 0 && filteredPlaces.length > 0) {
      filteredPlaces.slice(0, 8).forEach((place) => ids.add(place.slug));
    }

    return ids;
  }, [filteredPlaces, selectedNodeId, focusNodeId, placeLookup, viewMode, visited]);

  const renderNodes = useMemo<BoardNodeView[]>(() => {
    const nodes: BoardNodeView[] = [];
    filteredPlaces.forEach((place) => {
      const pos = nodePositions[place.slug];
      if (!pos || !visibleNodeIds.has(place.slug)) return;
      nodes.push({
        id: place.slug,
        name: place.name,
        status: place.status || 'verified',
        dangerLevel: place.dangerLevel || 0,
        category: place.category,
        history: place.history,
        x: pos.x,
        y: pos.y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
    });
    return nodes;
  }, [filteredPlaces, nodePositions, visibleNodeIds]);

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

  const allEdges = useMemo(() => {
    const visibleIds = new Set(visibleNodeIds);
    return [...discoveredEdges, ...playerEdges].filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));
  }, [discoveredEdges, playerEdges, visibleNodeIds]);

  const selectedPlace = useMemo(() => places.find((place) => place.slug === selectedNodeId) ?? null, [places, selectedNodeId]);
  const focusPlace = useMemo(() => places.find((place) => place.slug === (focusNodeId ?? selectedNodeId)) ?? null, [places, focusNodeId, selectedNodeId]);

  const handleNodeSelection = useCallback(
    (nodeId: string) => {
      const currentSelected = useEvidenceBoardStore.getState().selectedNodeId;
      if (currentSelected === null) {
        selectNode(nodeId);
      } else if (currentSelected === nodeId) {
        selectNode(null);
      } else {
        addPlayerEdge({
          id: `player-${currentSelected}-${nodeId}`,
          source: currentSelected,
          target: nodeId,
          type: 'suspected',
          label: 'SUSPECTED',
        });
        selectNode(null);
      }
      setFocusNode(nodeId);
      click();
    },
    [addPlayerEdge, click, selectNode, setFocusNode]
  );

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

  const onContainerMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (dragNodeId) {
        const dx = e.clientX - dragStartClientRef.current.x;
        const dy = e.clientY - dragStartClientRef.current.y;
        const isClick = Math.abs(dx) < 5 && Math.abs(dy) < 5;

        if (isClick) {
          handleNodeSelection(dragNodeId);
        }
        setDragNodeId(null);
      }
      setIsPanning(false);
    },
    [dragNodeId, handleNodeSelection]
  );

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const { zoom: z, pan: p } = useEvidenceBoardStore.getState();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const nextZoom = Math.max(0.3, Math.min(3, z * delta));
    setViewport(nextZoom, p);
  }, [setViewport]);

  const panelStyle = {
    border: `1px solid ${microform.iron}`,
    boxShadow: `0 0 0 1px ${microform.mahogany}, 0 6px 18px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.03)`,
    background: `linear-gradient(180deg, ${microform.mahogany} 0%, ${colors.archive.surface} 100%)`,
  } as const;

  const bounds = useMemo(() => {
    if (renderNodes.length === 0) return { minX: 0, minY: 0, maxX: dims.width, maxY: dims.height };
    const xs = renderNodes.map((n) => n.x);
    const ys = renderNodes.map((n) => n.y);
    return {
      minX: Math.min(...xs) - NODE_WIDTH,
      minY: Math.min(...ys) - NODE_HEIGHT,
      maxX: Math.max(...xs) + NODE_WIDTH,
      maxY: Math.max(...ys) + NODE_HEIGHT,
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
          radial-gradient(ellipse at 50% 28%, rgba(255, 170, 85, 0.035) 0%, transparent 58%),
          url("data:image/svg+xml,%3Csvg width='220' height='220' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")
        `,
      }}
      onMouseDown={onContainerMouseDown}
      onMouseMove={onContainerMouseMove}
      onMouseUp={onContainerMouseUp}
      onMouseLeave={onContainerMouseUp}
      onWheel={onWheel}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 40%, transparent 30%, rgba(10, 8, 6, 0.62) 100%)', mixBlendMode: 'multiply' }} />

      <svg className="absolute inset-0 pointer-events-none" style={{ width: dims.width, height: dims.height, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
        {allEdges.map((edge, index) => {
          const a = renderNodes.find((node) => node.id === edge.source);
          const b = renderNodes.find((node) => node.id === edge.target);
          if (!a || !b) return null;
          const isHighlighted = Boolean(selectedNodeId && (a.id === selectedNodeId || b.id === selectedNodeId));
          const isSuspected = edge.type === 'suspected';
          const isUnstable = edge.type === 'unstable';
          const edgeColor = isUnstable ? 'rgba(168, 93, 93, 0.4)' : isSuspected ? 'rgba(180, 160, 130, 0.5)' : 'rgba(140, 130, 110, 0.55)';
          return (
            <line
              key={edge.id || index}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={edgeColor}
              strokeWidth={isHighlighted ? 1.4 : 0.9}
              strokeDasharray={isSuspected ? '3 4' : isUnstable ? '1 3' : 'none'}
              opacity={isHighlighted ? 0.8 : 0.35}
            />
          );
        })}

        {selectedNodeId && (() => {
          const active = renderNodes.find((node) => node.id === selectedNodeId);
          if (!active) return null;
          return (
            <line
              x1={active.x}
              y1={active.y}
              x2={mouseWorld.x}
              y2={mouseWorld.y}
              stroke="rgba(201, 169, 110, 0.45)"
              strokeWidth={0.7}
              strokeDasharray="4 4"
              opacity={0.35}
            />
          );
        })()}
      </svg>

      <div className="absolute inset-x-0 top-0 z-30 flex items-start justify-between p-4">
        <div className="flex flex-col gap-2" style={{ maxWidth: '24rem' }}>
          <div className="flex items-center gap-2 px-3 py-2" style={{ ...panelStyle, borderColor: microform.mahoganyLight }}>
            <span style={{ color: colors.archive.amber, fontFamily: typography.mono, fontSize: typography.sizes.sm }}>◉</span>
            <span style={{ color: colors.archive.white, fontFamily: typography.mono, fontSize: typography.sizes.xs, letterSpacing: '0.08em' }}>
              EVIDENCE BOARD / {viewMode.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2" style={panelStyle}>
            <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.sm }}>⌕</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search the archive..."
              className="bg-transparent outline-none w-40"
              style={{ color: colors.archive.white, fontFamily: typography.mono, fontSize: typography.sizes.xs }}
            />
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as typeof filterMode)}
              className="bg-transparent outline-none"
              style={{ color: colors.archive.grayLight, fontFamily: typography.mono, fontSize: typography.sizes.xs }}
            >
              <option value="all" style={{ color: '#111' }}>All</option>
              <option value="visited" style={{ color: '#111' }}>Visited</option>
              <option value="sealed" style={{ color: '#111' }}>Sealed</option>
              <option value="whispered" style={{ color: '#111' }}>Whispered</option>
              <option value="mirage" style={{ color: '#111' }}>Mirage</option>
              <option value="suspected" style={{ color: '#111' }}>Suspected</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2" style={{ ...panelStyle, padding: '0.3rem' }}>
            {(['overview', 'focus', 'detail'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setViewMode(mode);
                  if (selectedNodeId) setFocusNode(selectedNodeId);
                }}
                style={{
                  padding: '0.35rem 0.65rem',
                  color: viewMode === mode ? colors.archive.amber : colors.archive.grayLight,
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.xs,
                  border: viewMode === mode ? `1px solid ${colors.archive.amber}` : `1px solid transparent`,
                  background: viewMode === mode ? 'rgba(201, 169, 110, 0.12)' : 'transparent',
                }}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="px-3 py-2" style={panelStyle}>
            <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
              {renderNodes.length} SHADOWS • {allEdges.length} THREADS
            </span>
          </div>
        </div>
      </div>

      {renderNodes.map((node) => {
        const isSelected = selectedNodeId === node.id;
        const isFocused = focusNodeId === node.id || selectedNodeId === node.id;
        const hasVisited = visited.has(node.id);
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
              zIndex: isSelected ? 25 : isActiveInvestigation ? 20 : 10,
            }}
            onMouseDown={(e) => onNodeMouseDown(e, node.id)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setFocusNode(node.id);
              setViewMode('detail');
              click();
            }}
            whileHover={{
              scale: 1,
              boxShadow: isSelected
                ? `0 0 0 1px ${microform.mahoganyLight}, 0 0 22px rgba(255, 170, 85, 0.2), 0 6px 18px rgba(0,0,0,0.6)`
                : `0 3px 12px rgba(0,0,0,0.46), 0 0 0 1px ${microform.mahoganyLight}`,
            }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            animate={{
              boxShadow: isSelected
                ? `0 0 0 1px ${microform.mahoganyLight}, 0 0 20px rgba(255, 170, 85, 0.14), 0 4px 16px rgba(0,0,0,0.55)`
                : `0 2px 10px rgba(0,0,0,0.4), 0 0 0 1px ${microform.iron}`,
            }}
          >
            <div
              className="w-full h-full flex flex-col justify-between px-3 py-2 relative overflow-hidden"
              style={{
                background: hasVisited
                  ? `linear-gradient(135deg, ${microform.mahogany} 0%, ${colors.archive.surfaceRaised} 100%)`
                  : `linear-gradient(135deg, #171411 0%, #11100d 100%)`,
                border: `1px solid ${isSelected ? colors.archive.amber : isFocused ? colors.archive.blue : microform.mahoganyLight}`,
                borderRadius: '2px',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div style={{ color: hasVisited ? colors.archive.white : colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs, lineHeight: 1.2 }}>
                  {node.name}
                </div>
                <span style={{ color: statusColor(node.status), fontFamily: typography.mono, fontSize: '0.55rem', letterSpacing: '0.08em' }}>
                  {node.status.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 mt-2">
                <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: '0.54rem', letterSpacing: '0.06em' }}>
                  {node.category.toUpperCase()}
                </span>
                <span style={{ color: node.dangerLevel >= 4 ? colors.archive.red : colors.archive.blue, fontFamily: typography.mono, fontSize: '0.56rem' }}>
                  D{node.dangerLevel}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}

      <div className="absolute bottom-4 left-4 z-30 flex flex-col gap-1" style={{ ...panelStyle, padding: '0.25rem' }}>
        <button onClick={() => { const { zoom: z, pan: p } = useEvidenceBoardStore.getState(); setViewport(Math.min(3, z * 1.15), p); }} className="px-3 py-1 transition-colors hover:bg-white/5" style={{ color: colors.archive.grayLight, fontFamily: typography.mono }}>
          +
        </button>
        <button onClick={() => { const { zoom: z, pan: p } = useEvidenceBoardStore.getState(); setViewport(Math.max(0.3, z / 1.15), p); }} className="px-3 py-1 transition-colors hover:bg-white/5" style={{ color: colors.archive.grayLight, fontFamily: typography.mono }}>
          −
        </button>
        <button onClick={() => setViewport(1, { x: 0, y: 0 })} className="px-3 py-1 transition-colors hover:bg-white/5" style={{ color: colors.archive.grayLight, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
          ⌂
        </button>
      </div>

      <div className="absolute bottom-4 right-4 z-30 border overflow-hidden" style={{ width: 140, height: 100, ...panelStyle }}>
        <svg width={140} height={100} viewBox={`0 0 ${mapWidth * miniScale} ${mapHeight * miniScale}`}>
          {renderNodes.map((node) => (
            <rect key={node.id} x={(node.x - bounds.minX - node.width / 2) * miniScale} y={(node.y - bounds.minY - node.height / 2) * miniScale} width={Math.max(2, node.width * miniScale)} height={Math.max(2, node.height * miniScale)} fill={statusColor(node.status)} opacity={visited.has(node.id) ? 0.55 : 0.22} rx={0.5} />
          ))}
          <rect x={viewX} y={viewY} width={viewW} height={viewH} fill="none" stroke="rgba(255, 170, 85, 0.45)" strokeWidth={0.6} />
        </svg>
      </div>

      <div className="absolute inset-y-0 right-0 z-30 flex w-[24rem] max-w-[32vw] items-stretch p-4">
        <div className="w-full rounded-sm border border-[#2c2925] bg-[#161412]/90 p-4 backdrop-blur-sm" style={{ boxShadow: '0 12px 28px rgba(0,0,0,0.48)' }}>
          <div className="flex items-center justify-between">
            <div>
              <div style={{ color: colors.archive.amber, fontFamily: typography.mono, fontSize: '0.55rem', letterSpacing: '0.12em' }}>INSPECTOR</div>
              <div style={{ color: colors.archive.white, fontFamily: typography.mono, fontSize: typography.sizes.lg, marginTop: '0.2rem' }}>
                {focusPlace?.name ?? 'No focus yet'}
              </div>
            </div>
            <div style={{ color: statusColor(focusPlace?.status ?? 'verified'), fontFamily: typography.mono, fontSize: '0.7rem' }}>
              {focusPlace?.status?.toUpperCase() ?? 'STANDBY'}
            </div>
          </div>

          <div className="mt-4 border-t border-[#2c2925] pt-3">
            <div style={{ color: colors.archive.grayLight, fontFamily: typography.mono, fontSize: typography.sizes.xs, lineHeight: 1.6 }}>
              {focusPlace?.history ?? 'Select a node to read the case summary, its current state, and the links that keep it alive.'}
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            <div className="flex items-center justify-between rounded-sm border border-[#2c2925] px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span style={{ color: colors.archive.grayLight, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>Threat</span>
              <span style={{ color: colors.archive.amber, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>D{focusPlace?.dangerLevel ?? 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-sm border border-[#2c2925] px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span style={{ color: colors.archive.grayLight, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>Connections</span>
              <span style={{ color: colors.archive.white, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>{focusPlace?.connectedTo.length ?? 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-sm border border-[#2c2925] px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span style={{ color: colors.archive.grayLight, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>State</span>
              <span style={{ color: colors.archive.blueBright, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>{selectedPlace ? 'Active case' : 'Awaiting selection'}</span>
            </div>
          </div>

          <div className="mt-4">
            <div style={{ color: colors.archive.amber, fontFamily: typography.mono, fontSize: '0.55rem', letterSpacing: '0.12em' }}>NEARBY CASES</div>
            <div className="mt-2 flex flex-col gap-2">
              {(focusPlace?.connectedTo.length ? focusPlace.connectedTo : ['no-neighbors']).map((slug) => {
                const place = slug === 'no-neighbors' ? null : places.find((candidate) => candidate.slug === slug);
                if (!place) {
                  return (
                    <div key={slug} className="rounded-sm border border-[#2c2925] px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', color: colors.archive.gray }}>
                      No linked cases yet. Create one by selecting a second node.
                    </div>
                  );
                }
                return (
                  <button
                    key={place.slug}
                    className="rounded-sm border border-[#2c2925] px-3 py-2 text-left"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                    onClick={() => {
                      setFocusNode(place.slug);
                      selectNode(place.slug);
                      setViewMode('detail');
                    }}
                  >
                    <div style={{ color: colors.archive.white, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>{place.name}</div>
                    <div style={{ color: colors.archive.grayLight, fontFamily: typography.mono, fontSize: '0.56rem', marginTop: '0.2rem' }}>
                      {place.status.toUpperCase()} • D{place.dangerLevel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
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
