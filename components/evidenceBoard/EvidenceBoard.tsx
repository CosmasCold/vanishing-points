import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type EdgeProps,
  type OnNodeDrag,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Archive,
  ArrowDownToLine,
  ArrowUpRight,
  ChevronRight,
  FileText,
  Filter,
  Headphones,
  Image as ImageIcon,
  Link2,
  ListFilter,
  Maximize2,
  Minus,
  Network,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  StickyNote,
  Timer,
  X,
} from 'lucide-react';
import { useAtlasStore } from '@/state/atlasStore';
import { useAudioStore } from '@/state/audioStore';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useProgressionStore } from '@/state/progressionStore';
import { useTerminalStore } from '@/state/terminalStore';
import { SignalModal, type SignalArtifact } from '@/components/signals/SignalModal';
import { colors, typography, microform } from '@/styles/theme';
import type { Place } from '@/types/places';
import type { EvidenceItem } from '@/types/investigation';
import type { EdgeProps as XYEdgeProps } from '@xyflow/react';

const STELMO_CASE_SLUG = 'stelmo-light';
const STATION_LAYOUT_VERSION = 'evidence-station-v2';
const layoutKey = (id: string) => `${STATION_LAYOUT_VERSION}:${id}`;

const VANCE_SIGNAL: SignalArtifact = {
  id: 'vance-lighthouse',
  title: "Cassette: Keeper's Final Log",
  source: 'E. Vance, Lighthouse Service (Ret.) — St. Elmo Light',
  length: '2:15',
  dustUnlock: 12,
  description: 'Forty years keeping the light. Then the lamp began lighting itself.',
  mediaUrl: '/audio/vance/vance-lighthouse.mp3',
  transcript: [
    '[00:00] [Ocean. Wind. A kettle whistling.]',
    "VANCE: Testing. This is Edward Vance, St. Elmo Light. Date is... well, the calendar says March, but the gulls haven't left yet.",
    '[00:22] [He chuckles. Paper rustles.]',
    'VANCE: Forty years I kept this light. Never missed a night. Then last Tuesday, I woke up and the lamp was already lit.',
    '[00:52] [Pause. He sips something.]',
    'VANCE: I know what you are thinking. Old man, bad memory. But I remember every ship that passed. I do not remember lighting that lamp.',
    '[01:28] [Wind increases. A door latch rattles.]',
    "VANCE: The light's doing its job without me now. I think maybe it always was.",
    '[02:00] [He sets down the cup.]',
    "VANCE: If someone finds this—tell them the light still works. That's all. That's enough.",
  ],
};

const INITIAL_HYPOTHESIS = {
  id: 'hyp-physical-record-drift',
  title: 'PHYSICAL RECORD DRIFT',
  description:
    'The documented history of a physical process may no longer correspond to the physical state that produced it.',
  confidence: 0,
  completed: false,
  contradictionText:
    'Keeper Edward Vance documented forty years of personally maintaining the light. The lamp nevertheless performed its function without the action that historically caused it.',
};

type StationItem = {
  id: string;
  kind: 'place' | 'evidence' | 'media' | 'hypothesis';
  title: string;
  subtitle: string;
  typeLabel: string;
  description: string;
  status?: string;
  source?: string;
  date?: string;
  image?: string;
  evidence?: EvidenceItem;
  place?: Place;
};

const kindIcon = (kind: StationItem['kind']) => {
  if (kind === 'place') return <ImageIcon size={13} />;
  if (kind === 'media') return <Headphones size={13} />;
  if (kind === 'hypothesis') return <Sparkles size={13} />;
  return <FileText size={13} />;
};

const PaperNode = React.memo(({ data }: { data: any }) => {
  const selected = data.selected;
  const item: StationItem = data.item;
  const place = item.place;

  return (
    <div
      className="relative cursor-pointer select-none"
      onClick={() => data.onSelect(item.id)}
      style={{
        width: item.kind === 'place' ? 245 : item.kind === 'hypothesis' ? 265 : 250,
        transform: `rotate(${item.kind === 'place' ? -1.4 : item.kind === 'hypothesis' ? 0.8 : -0.6}deg)`,
        filter: selected ? 'brightness(1.06)' : undefined,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <div
        className="relative overflow-hidden border"
        style={{
          background:
            item.kind === 'hypothesis'
              ? 'linear-gradient(145deg, rgba(42,35,25,.98), rgba(11,9,7,.99))'
              : 'linear-gradient(145deg, #d5c9ae, #b9aa8b)',
          borderColor: selected ? '#c9a65d' : item.kind === 'hypothesis' ? '#5d4d39' : '#6f614d',
          boxShadow: selected
            ? '0 24px 48px rgba(0,0,0,.82), 0 0 0 1px rgba(201,166,93,.2), inset 0 1px rgba(255,255,255,.28)'
            : '0 15px 30px rgba(0,0,0,.72), 0 3px 6px rgba(0,0,0,.5), inset 0 1px rgba(255,255,255,.24)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-70" style={{ background: 'repeating-linear-gradient(0deg, rgba(65,45,28,.035) 0 1px, transparent 1px 4px)' }} />

        {item.kind === 'place' && place?.photos?.[0] && (
          <div className="m-3 border border-black/30 overflow-hidden" style={{ height: 132, background: '#17130f' }}>
            <img
              src={place.photos[0]}
              alt={place.name}
              className="w-full h-full object-cover"
              style={{ filter: 'sepia(.22) contrast(1.08) brightness(.84) saturate(.82)' }}
            />
          </div>
        )}

        {item.kind === 'place' && !place?.photos?.[0] && (
          <div className="m-3 h-[132px] flex items-center justify-center border border-black/20 bg-black/15 font-mono text-[8px] tracking-[.18em] text-[#5f574c]">
            NO PHOTOGRAPH
          </div>
        )}

        <div className="relative px-4 pb-4 pt-3">
          <div className="font-mono text-[7px] tracking-[.16em] uppercase" style={{ color: item.kind === 'hypothesis' ? '#c9a65d' : '#705b3b' }}>
            {item.typeLabel}
          </div>
          <div className="mt-1 font-serif font-semibold text-[14px] leading-tight" style={{ color: item.kind === 'hypothesis' ? '#d8cbb7' : '#2a2118' }}>
            {item.title}
          </div>
          <div className="mt-2 font-serif text-[9px] leading-[1.5]" style={{ color: item.kind === 'hypothesis' ? '#a69b8d' : '#51483c' }}>
            {item.description}
          </div>
          <div className="mt-3 pt-2 border-t flex items-center justify-between gap-2 font-mono text-[7px] uppercase tracking-[.1em]" style={{ borderColor: item.kind === 'hypothesis' ? 'rgba(201,166,93,.2)' : 'rgba(55,43,28,.2)', color: item.kind === 'hypothesis' ? '#766c60' : '#6a5e4d' }}>
            <span>{item.subtitle}</span>
            {selected && <Maximize2 size={9} />}
          </div>
        </div>
      </div>
    </div>
  );
});

const ThreadEdge = React.memo(({ sourceX, sourceY, targetX, targetY, style }: XYEdgeProps) => {
  const path = `M ${sourceX},${sourceY} C ${sourceX + 70},${sourceY} ${targetX - 70},${targetY} ${targetX},${targetY}`;
  return <path d={path} fill="none" stroke={(style?.stroke as string) || '#927348'} strokeWidth={2} strokeDasharray={(style?.strokeDasharray as string) || '4 6'} opacity={(style?.opacity as number) ?? .7} />;
});

const nodeTypes = { evidence: PaperNode };
const edgeTypes = { thread: ThreadEdge };

export const EvidenceBoard: React.FC = () => {
  const { places, selectPlace } = useAtlasStore();
  const { click } = useAudioStore();
  const { evidence } = useInvestigationStore();
  const { dustIndex } = useProgressionStore();
  const { addCommand } = useTerminalStore();
  const {
    playerEdges,
    discoveredEdges,
    nodePositions,
    workspaceEvidenceIds,
    addToWorkspace,
    removeFromWorkspace,
    setNodePosition,
    selectNode,
    setFocusNode,
    setViewMode,
  } = useEvidenceBoardStore();

  const [view, setView] = useState<'workspace' | 'graph' | 'timeline'>('workspace');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | StationItem['kind']>('all');
  const [selectedId, setSelectedId] = useState<string | null>(workspaceEvidenceIds?.[0] || 'stelmo-light');
  const [selectedSignal, setSelectedSignal] = useState<SignalArtifact | null>(null);

  const visiblePlaces = useMemo(
    () => places.filter((p) => p.slug === STELMO_CASE_SLUG && p.status !== 'rejected'),
    [places],
  );

  const stElmoEvidence = useMemo(
    () => Object.values(evidence).flat().filter((item) =>
      item.id === 'doc-stelmo-001' ||
      item.id === 'evidence-stelmo-locked-drawer' ||
      item.id === 'evidence-stelmo-mechanical-exposure',
    ),
    [evidence],
  );

  const items = useMemo<StationItem[]>(() => {
    const place = visiblePlaces[0];
    const result: StationItem[] = [];

    if (place) {
      result.push({
        id: place.slug,
        kind: 'place',
        title: place.name,
        subtitle: place.address?.formatted || 'OREGON COAST',
        typeLabel: 'CASE ANCHOR // LOCATION',
        description: 'The geographic anchor for the St. Elmo investigation. Place context remains authoritative in the Atlas.',
        status: place.status,
        image: place.photos?.[0],
        place,
      });
    }

    for (const item of stElmoEvidence) {
      result.push({
        id: item.id,
        kind: 'evidence',
        title: item.title,
        subtitle: item.timestamp || item.status.toUpperCase(),
        typeLabel: item.type.toUpperCase() + ' // EVIDENCE',
        description: item.description,
        status: item.status,
        source: item.source,
        date: item.timestamp,
        evidence: item,
      });
    }

    if (dustIndex >= VANCE_SIGNAL.dustUnlock) {
      result.push({
        id: VANCE_SIGNAL.id,
        kind: 'media',
        title: VANCE_SIGNAL.title,
        subtitle: `${VANCE_SIGNAL.length} // AUDIO`,
        typeLabel: 'ARCHIVAL MEDIA // SIGNAL',
        description: VANCE_SIGNAL.description,
        source: VANCE_SIGNAL.source,
      });
    }

    result.push({
      id: INITIAL_HYPOTHESIS.id,
      kind: 'hypothesis',
      title: INITIAL_HYPOTHESIS.title,
      subtitle: `${INITIAL_HYPOTHESIS.confidence}% CONFIDENCE`,
      typeLabel: 'WORKING HYPOTHESIS',
      description: INITIAL_HYPOTHESIS.description,
      status: INITIAL_HYPOTHESIS.completed ? 'confirmed' : 'unresolved',
    });

    return result;
  }, [visiblePlaces, stElmoEvidence, dustIndex]);

  const filteredArchive = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      const kindMatch = filter === 'all' || item.kind === filter;
      const text = `${item.title} ${item.description} ${item.typeLabel} ${item.subtitle}`.toLowerCase();
      return kindMatch && (!needle || text.includes(needle));
    });
  }, [items, search, filter]);

  const workspaceIds = workspaceEvidenceIds?.length
    ? workspaceEvidenceIds
    : ['stelmo-light', 'doc-stelmo-001', 'hyp-physical-record-drift'];

  const workspaceItems = useMemo(
    () => workspaceIds.map((id) => items.find((item) => item.id === id)).filter(Boolean) as StationItem[],
    [workspaceIds, items],
  );

  const selectedItem = items.find((item) => item.id === selectedId) || workspaceItems[0] || items[0];

  const positionFor = useCallback((id: string, index: number) => {
    const saved = nodePositions[layoutKey(id)];
    if (saved) return saved;
    const defaults = [
      { x: 100, y: 90 },
      { x: 430, y: 115 },
      { x: 765, y: 280 },
      { x: 420, y: 390 },
      { x: 90, y: 410 },
    ];
    return defaults[index % defaults.length];
  }, [nodePositions]);

  const computedNodes = useMemo<Node[]>(() => workspaceItems.map((item, index) => ({
    id: item.id,
    type: 'evidence',
    position: positionFor(item.id, index),
    data: {
      item,
      selected: item.id === selectedId,
      onSelect: (id: string) => {
        click();
        setSelectedId(id);
        selectNode(id);
        setFocusNode(id);
        setViewMode('detail');
        if (item.kind === 'place') selectPlace(item.id);
      },
    },
  })), [workspaceItems, positionFor, selectedId, click, selectNode, setFocusNode, setViewMode, selectPlace]);

  const computedEdges = useMemo<Edge[]>(() => {
    const available = new Set(workspaceItems.map((item) => item.id));
    const allEdges = [...discoveredEdges, ...playerEdges];
    const unique = new Map<string, Edge>();
    allEdges.forEach((edge: any) => {
      if (!available.has(edge.source) || !available.has(edge.target)) return;
      unique.set(edge.id, {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'thread',
        style: {
          stroke: edge.type === 'confirmed' ? '#c9a65d' : edge.type === 'unstable' ? '#8b5e34' : '#806b4e',
          opacity: selectedId && (edge.source === selectedId || edge.target === selectedId) ? 1 : .42,
          strokeDasharray: edge.type === 'confirmed' ? 'none' : '4 6',
        },
      });
    });

    if (workspaceIds.includes('stelmo-light') && workspaceIds.includes('doc-stelmo-001')) {
      unique.set('auth-stelmo-log', {
        id: 'auth-stelmo-log', source: 'stelmo-light', target: 'doc-stelmo-001', type: 'thread',
        style: { stroke: '#725d42', opacity: selectedId === 'stelmo-light' || selectedId === 'doc-stelmo-001' ? .9 : .35, strokeDasharray: '2 6' },
      });
    }
    if (workspaceIds.includes('doc-stelmo-001') && workspaceIds.includes('hyp-physical-record-drift')) {
      unique.set('auth-log-hypothesis', {
        id: 'auth-log-hypothesis', source: 'doc-stelmo-001', target: 'hyp-physical-record-drift', type: 'thread',
        style: { stroke: '#9a7a46', opacity: selectedId === 'doc-stelmo-001' || selectedId === 'hyp-physical-record-drift' ? .95 : .35, strokeDasharray: 'none' },
      });
    }
    return Array.from(unique.values());
  }, [workspaceItems, discoveredEdges, playerEdges, selectedId, workspaceIds]);

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<Node>([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    setFlowNodes(computedNodes);
  }, [computedNodes, setFlowNodes]);

  useEffect(() => {
    setFlowEdges(computedEdges);
  }, [computedEdges, setFlowEdges]);

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    const id = `station-${connection.source}-${connection.target}`;
    const exists = playerEdges.some((edge: any) =>
      (edge.source === connection.source && edge.target === connection.target) ||
      (edge.source === connection.target && edge.target === connection.source)
    );
    if (!exists) {
      click();
      // This is a player workspace relationship only. Canonical progression
      // remains owned by the investigation/progression layer.
      useEvidenceBoardStore.getState().addPlayerEdge({
        id,
        source: connection.source,
        target: connection.target,
        type: 'suspected',
        label: 'PLAYER CONNECTION',
      });
    }
  }, [playerEdges, click]);

  const addEvidence = (id: string) => {
    addToWorkspace(id);
    setSelectedId(id);
    click();
  };

  const inspect = (id: string) => {
    setSelectedId(id);
    selectNode(id);
    setFocusNode(id);
    setViewMode('detail');
  };

  const onDragStop: OnNodeDrag<Node> = (_event, node) => {
    setNodePosition(layoutKey(node.id), node.position);
  };

  const openMedia = () => {
    if (!selectedItem || selectedItem.id !== VANCE_SIGNAL.id) return;
    click();
    setSelectedSignal(VANCE_SIGNAL);
  };

  const removeSelected = () => {
    if (!selectedItem) return;
    removeFromWorkspace(selectedItem.id);
    setSelectedId(workspaceItems.find((item) => item.id !== selectedItem.id)?.id || null);
  };

  const focusHypothesis = () => {
    setSelectedId(INITIAL_HYPOTHESIS.id);
    addToWorkspace(INITIAL_HYPOTHESIS.id);
    setView('graph');
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none" style={{ color: '#d5c7ad' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at center, transparent 42%, rgba(0,0,0,.18) 100%)', zIndex: 1 }} />

      <div className="absolute inset-x-0 top-0 z-40 h-[58px] border-b flex items-center" style={{ background: 'linear-gradient(180deg, rgba(19,15,11,.97), rgba(11,9,7,.94))', borderColor: 'rgba(148,120,75,.28)', boxShadow: '0 7px 18px rgba(0,0,0,.4)' }}>
        <div className="px-5 flex items-center gap-3 min-w-[255px] border-r h-full" style={{ borderColor: 'rgba(148,120,75,.2)' }}>
          <Archive size={17} style={{ color: '#c9a65d' }} />
          <div>
            <div className="font-mono text-[9px] tracking-[.2em] text-[#c9a65d]">EVIDENCE STATION</div>
            <div className="font-serif text-[12px] text-[#9c9181]">Investigation workspace</div>
          </div>
        </div>

        <div className="flex items-center gap-1 px-4">
          {(['workspace', 'graph', 'timeline'] as const).map((mode) => (
            <button key={mode} onClick={() => setView(mode)} className="px-3 py-2 font-mono text-[8px] uppercase tracking-[.13em] border transition-colors" style={{ color: view === mode ? '#e0c17b' : '#766c5d', borderColor: view === mode ? 'rgba(201,166,93,.35)' : 'transparent', background: view === mode ? 'rgba(201,166,93,.08)' : 'transparent' }}>
              {mode === 'workspace' ? 'Workspace' : mode === 'graph' ? 'Graph' : 'Timeline'}
            </button>
          ))}
        </div>

        <div className="ml-auto px-5 flex items-center gap-5 font-mono text-[8px] uppercase tracking-[.12em] text-[#6e6559]">
          <span>{workspaceItems.length} ON DESK</span>
          <span>{items.length} DISCOVERED</span>
          <span className="text-[#b89a61]">ST. ELMO // ACTIVE</span>
        </div>
      </div>

      <div className="absolute inset-0 z-30 pt-[58px] flex">
        <aside className="w-[285px] shrink-0 border-r flex flex-col" style={{ background: 'linear-gradient(180deg, rgba(20,16,12,.96), rgba(10,8,6,.97))', borderColor: 'rgba(148,120,75,.22)' }}>
          <div className="p-4 border-b" style={{ borderColor: 'rgba(148,120,75,.18)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-mono text-[8px] tracking-[.18em] text-[#c9a65d]">EVIDENCE ARCHIVE</div>
              <ListFilter size={13} className="text-[#756a5a]" />
            </div>
            <div className="relative">
              <Search size={12} className="absolute left-3 top-2.5 text-[#6e6559]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="SEARCH RECORDS" className="w-full h-8 pl-8 pr-3 bg-black/25 border outline-none font-mono text-[8px] tracking-[.1em] text-[#c9bea9] placeholder:text-[#4f4941]" style={{ borderColor: 'rgba(148,120,75,.22)' }} />
            </div>
            <div className="flex gap-1 mt-2 flex-wrap">
              {(['all', 'place', 'evidence', 'media', 'hypothesis'] as const).map((value) => (
                <button key={value} onClick={() => setFilter(value)} className="px-2 py-1 border font-mono text-[7px] uppercase tracking-[.1em]" style={{ color: filter === value ? '#c9a65d' : '#675f54', borderColor: filter === value ? 'rgba(201,166,93,.3)' : 'rgba(148,120,75,.12)', background: filter === value ? 'rgba(201,166,93,.06)' : 'transparent' }}>{value}</button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-2">
            <div className="px-2 py-2 font-mono text-[7px] tracking-[.16em] text-[#514a41] uppercase">ST. ELMO / DISCOVERED RECORDS</div>
            {filteredArchive.map((item) => {
              const onDesk = workspaceIds.includes(item.id);
              const active = selectedId === item.id;
              return (
                <button key={item.id} onClick={() => inspect(item.id)} className="w-full text-left p-3 mb-1 border transition-all" style={{ background: active ? 'rgba(201,166,93,.075)' : 'rgba(255,255,255,.012)', borderColor: active ? 'rgba(201,166,93,.28)' : 'rgba(148,120,75,.1)' }}>
                  <div className="flex items-center gap-2">
                    <span style={{ color: active ? '#c9a65d' : '#70675b' }}>{kindIcon(item.kind)}</span>
                    <span className="font-mono text-[8px] tracking-[.08em] text-[#b8ad9b] truncate">{item.title}</span>
                  </div>
                  <div className="mt-1 pl-5 font-mono text-[6px] uppercase tracking-[.12em] text-[#5d564d]">{item.typeLabel}</div>
                  <div className="mt-2 pl-5 flex items-center gap-2">
                    <span className="font-mono text-[6px] uppercase text-[#6c6358]">{item.status || 'DISCOVERED'}</span>
                    {onDesk && <span className="font-mono text-[6px] uppercase text-[#a48756]">ON DESK</span>}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 border-t" style={{ borderColor: 'rgba(148,120,75,.16)' }}>
            <div className="font-mono text-[7px] uppercase tracking-[.14em] text-[#5e574d]">Archive principle</div>
            <div className="mt-1 font-serif text-[10px] leading-[1.45] text-[#81776a]">Everything discovered can be found here. Only selected evidence needs to occupy the working desk.</div>
          </div>
        </aside>

        <main className="relative flex-1 min-w-0 overflow-hidden" style={{ background: 'transparent' }}>
          {view === 'workspace' && (
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodeClick={(_, node) => inspect(node.id)}
              onNodeDragStop={onDragStop}
              onConnect={onConnect}
              onPaneClick={() => setSelectedId(null)}
              defaultViewport={{ x: 20, y: 25, zoom: .88 }}
              minZoom={.45}
              maxZoom={1.65}
              proOptions={{ hideAttribution: true }}
              style={{ background: 'transparent' }}
            />
          )}

          {view === 'graph' && (
            <ReactFlow
              nodes={flowNodes.map((node) => ({ ...node, data: { ...node.data, selected: false } }))}
              edges={flowEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              defaultViewport={{ x: 20, y: 25, zoom: .82 }}
              minZoom={.45}
              maxZoom={1.5}
              nodesDraggable={false}
              nodesConnectable={false}
              proOptions={{ hideAttribution: true }}
              style={{ background: 'transparent' }}
            />
          )}

          {view === 'timeline' && (
            <div className="absolute inset-0 overflow-auto p-10">
              <div className="max-w-[900px] mx-auto">
                <div className="font-mono text-[8px] tracking-[.18em] text-[#c9a65d]">CHRONOLOGY / ST. ELMO</div>
                <div className="mt-2 font-serif text-[22px] text-[#c8bba7]">The record, as currently reconstructed</div>
                <div className="mt-10 relative border-t" style={{ borderColor: 'rgba(148,120,75,.28)' }}>
                  {[
                    ['1918', 'Locked drawer', 'The provenance record places the recovered drawer in a long-sealed desk.'],
                    ['1942-03-14', "Keeper's Log", 'Edward Vance records that the lamp was already lit when he woke.'],
                    ['CURRENT', 'Physical Record Drift', 'The working hypothesis asks whether the physical state still corresponds to its archived history.'],
                  ].map(([date, title, description], index) => (
                    <div key={date} className="relative grid grid-cols-[130px_1fr] gap-7 py-8 border-b" style={{ borderColor: 'rgba(148,120,75,.14)' }}>
                      <div className="font-mono text-[8px] tracking-[.12em] text-[#a28654]">{date}</div>
                      <div>
                        <div className="font-serif text-[15px] text-[#c9bdab]">{title}</div>
                        <div className="mt-2 font-serif text-[10px] leading-[1.6] text-[#777065] max-w-[570px]">{description}</div>
                      </div>
                      <div className="absolute left-[125px] top-[39px] w-2 h-2 rounded-full border" style={{ background: '#c9a65d', borderColor: '#624d2d', boxShadow: '0 0 0 4px rgba(201,166,93,.06)' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === 'workspace' && workspaceItems.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <Archive size={30} className="mx-auto text-[#5d554b]" />
                <div className="mt-3 font-mono text-[8px] tracking-[.18em] text-[#6a6156]">WORKSPACE EMPTY</div>
                <div className="mt-1 font-serif text-[11px] text-[#554e45]">Select a record from the archive to place it on the desk.</div>
              </div>
            </div>
          )}
        </main>

        <aside className="w-[330px] shrink-0 border-l overflow-auto" style={{ background: 'linear-gradient(180deg, rgba(19,15,11,.97), rgba(10,8,6,.98))', borderColor: 'rgba(148,120,75,.22)' }}>
          <div className="p-5 border-b" style={{ borderColor: 'rgba(148,120,75,.18)' }}>
            <div className="font-mono text-[7px] tracking-[.17em] text-[#6d6458]">EVIDENCE INSPECTOR</div>
            <div className="mt-2 font-serif text-[20px] leading-tight text-[#d1c4b1]">{selectedItem?.title || 'Nothing selected'}</div>
            {selectedItem && <div className="mt-2 font-mono text-[7px] uppercase tracking-[.12em] text-[#a48756]">{selectedItem.typeLabel}</div>}
          </div>

          {selectedItem ? (
            <div className="p-5">
              {selectedItem.kind === 'place' && selectedItem.place?.photos?.[0] && (
                <div className="border border-black/30 overflow-hidden mb-5" style={{ height: 190, background: '#14100d' }}>
                  <img src={selectedItem.place.photos[0]} alt={selectedItem.place.name} className="w-full h-full object-cover" style={{ filter: 'sepia(.18) contrast(1.06) brightness(.82) saturate(.84)' }} />
                </div>
              )}

              <div className="font-serif text-[11px] leading-[1.65] text-[#898075]">{selectedItem.description}</div>

              <div className="mt-6 space-y-3">
                {[
                  ['SOURCE', selectedItem.source || selectedItem.place?.address?.formatted || 'CANONICAL ARCHIVE'],
                  ['STATUS', selectedItem.status || 'DISCOVERED'],
                  ['DATE', selectedItem.date || 'NOT RECORDED'],
                ].map(([label, value]) => (
                  <div key={label} className="border-b pb-2" style={{ borderColor: 'rgba(148,120,75,.12)' }}>
                    <div className="font-mono text-[6px] tracking-[.14em] text-[#5d564d]">{label}</div>
                    <div className="mt-1 font-mono text-[8px] text-[#a59a89] break-words">{value}</div>
                  </div>
                ))}
              </div>

              {selectedItem.kind === 'media' && (
                <button onClick={openMedia} className="mt-5 w-full h-9 border flex items-center justify-center gap-2 font-mono text-[8px] uppercase tracking-[.12em] text-[#c9a65d]" style={{ borderColor: 'rgba(201,166,93,.28)', background: 'rgba(201,166,93,.05)' }}>
                  <Headphones size={12} /> OPEN RECORDING
                </button>
              )}

              {selectedItem.kind === 'hypothesis' && (
                <div className="mt-5 border p-4" style={{ borderColor: 'rgba(201,166,93,.2)', background: 'rgba(201,166,93,.035)' }}>
                  <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[.14em] text-[#c9a65d]"><ShieldAlert size={11} /> CURRENT INTERPRETATION</div>
                  <div className="mt-2 font-serif text-[10px] leading-[1.55] text-[#857b6e]">{INITIAL_HYPOTHESIS.contradictionText}</div>
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-2">
                {workspaceIds.includes(selectedItem.id) ? (
                  <button onClick={removeSelected} className="h-8 border flex items-center justify-center gap-2 font-mono text-[7px] uppercase tracking-[.1em] text-[#81766a]" style={{ borderColor: 'rgba(148,120,75,.16)' }}><ArrowDownToLine size={11} /> Remove</button>
                ) : (
                  <button onClick={() => addEvidence(selectedItem.id)} className="h-8 border flex items-center justify-center gap-2 font-mono text-[7px] uppercase tracking-[.1em] text-[#c9a65d]" style={{ borderColor: 'rgba(201,166,93,.26)', background: 'rgba(201,166,93,.04)' }}><ArrowUpRight size={11} /> Put on desk</button>
                )}
                <button onClick={focusHypothesis} className="h-8 border flex items-center justify-center gap-2 font-mono text-[7px] uppercase tracking-[.1em] text-[#81766a]" style={{ borderColor: 'rgba(148,120,75,.16)' }}><Network size={11} /> Focus theory</button>
              </div>

              <div className="mt-7">
                <div className="font-mono text-[7px] tracking-[.15em] text-[#5e574e]">RELATIONSHIPS</div>
                <div className="mt-2 space-y-1">
                  {flowEdges.filter((edge) => edge.source === selectedItem.id || edge.target === selectedItem.id).map((edge) => {
                    const otherId = edge.source === selectedItem.id ? edge.target : edge.source;
                    const other = items.find((item) => item.id === otherId);
                    return (
                      <button key={edge.id} onClick={() => inspect(otherId)} className="w-full text-left p-2 border flex items-center gap-2" style={{ borderColor: 'rgba(148,120,75,.11)', background: 'rgba(255,255,255,.01)' }}>
                        <Link2 size={10} className="text-[#8d7349]" />
                        <span className="font-mono text-[7px] text-[#82786c] truncate">{other?.title || otherId}</span>
                      </button>
                    );
                  })}
                  {flowEdges.filter((edge) => edge.source === selectedItem.id || edge.target === selectedItem.id).length === 0 && <div className="font-serif text-[9px] text-[#514b43]">No confirmed or authored relationship currently visible.</div>}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 font-serif text-[10px] leading-[1.6] text-[#5c554c]">Select an evidence object from the archive or workspace.</div>
          )}
        </aside>
      </div>

      {selectedSignal && <SignalModal signal={selectedSignal} onClose={() => setSelectedSignal(null)} />}
    </div>
  );
};

export default EvidenceBoard;
