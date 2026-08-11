import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  EdgeProps,
  Connection,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useAtlasStore } from '@/state/atlasStore';
import { useAudioStore } from '@/state/audioStore';
import { useUIStore } from '@/state/uiStore';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { useTerminalStore } from '@/state/terminalStore';
import { colors, typography, microform } from '@/styles/theme';
import { Place } from '@/types/places';

/* ═══════════════════════════════════════════════════════════════
   STYLING DEFINITIONS (Deep corkboard felt aesthetics)
   ═══════════════════════════════════════════════════════════════ */

const feltStyles = {
  board: {
    backgroundColor: '#0a0806',
    backgroundImage: `
      radial-gradient(circle at center, rgba(30, 22, 17, 0.5) 0%, transparent 85%),
      repeating-linear-gradient(45deg, #100d0a 25%, #0b0907 25%, #0b0907 50%, #100d0a 50%, #100d0a 75%, #0b0907 75%, #0b0907 100%)
    `,
    backgroundSize: '100% 100%, 10px 10px',
    boxShadow: 'inset 0 0 100px rgba(0,0,0,0.95)',
  } as React.CSSProperties,
};

/* ═══════════════════════════════════════════════════════════════
   CUSTOM NODE TYPE A: POLAROID PIN
   ═══════════════════════════════════════════════════════════════ */

interface CustomNodeProps {
  id: string;
  data: {
    place: Place;
    isSelected: boolean;
    isFocused: boolean;
    hasActiveThread: boolean;
    onSelect: (slug: string) => void;
  };
}

const PolaroidNode: React.FC<CustomNodeProps> = React.memo(({ id, data }) => {
  const { place, isSelected, isFocused, hasActiveThread } = data;

  // Generate a deterministic physical tilt angle based on the slug string length
  const rotateAngle = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (hash % 7) - 3; // Generates constant tilt between -3deg and +3deg
  }, [id]);

  const categoryColor = useMemo(() => {
    switch (place.category) {
      case 'abandoned': return '#9a846c';
      case 'haunted': return '#c49a45';
      case 'both': return microform.halogen || '#bf9f62';
      default: return '#7a7670';
    }
  }, [place.category]);

  return (
    <div
      onClick={() => data.onSelect(place.slug)}
      className="relative cursor-pointer select-none transition-all duration-300"
      style={{
        transform: `rotate(${rotateAngle}deg) scale(${isSelected ? 1.05 : 1.0})`,
        opacity: hasActiveThread ? (isFocused ? 1.0 : 0.28) : 1.0,
        zIndex: isSelected ? 30 : 10,
      }}
    >
      {/* Grommet-styled connection handles visible on hover */}
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ 
          top: '-6px', 
          background: '#d4af37', 
          borderColor: '#8a6d1c', 
          width: '8px', 
          height: '8px',
          boxShadow: '0 0 4px rgba(212, 175, 55, 0.5)'
        }} 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ 
          bottom: '-6px', 
          background: '#d4af37', 
          borderColor: '#8a6d1c', 
          width: '8px', 
          height: '8px',
          boxShadow: '0 0 4px rgba(212, 175, 55, 0.5)'
        }} 
      />

      {/* 3D Brass Pushpin with detailed dimensional casting drop-shadow */}
      <div 
        className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full transition-transform duration-150"
        style={{
          background: 'radial-gradient(circle at 35% 35%, #bf9f62 0%, #7a5f2e 60%, #403010 100%)',
          boxShadow: '0 4px 6px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.4)',
          border: '1px solid #5a451e',
          zIndex: 40,
          transform: isSelected ? 'scale(1.15) translateY(-1px)' : 'scale(1.0)',
        }}
      >
        {/* Metal pin shaft shadow on the Polaroid */}
        <div className="absolute w-[2px] h-3 bg-black/60 top-3.5 left-1.5 rotate-[15deg] blur-[0.5px]" />
      </div>

      {/* Aged and stained white-matte Polaroid sheet body */}
      <div
        className="p-3 shadow-[0_14px_32px_rgba(0,0,0,0.85),_inset_0_0_16px_rgba(110,80,30,0.2)] rounded-[1px] border"
        style={{
          backgroundColor: '#dfd5c0', // Yellowed, stained paper look
          backgroundImage: 'radial-gradient(circle at top left, rgba(255,255,255,0.3) 0%, transparent 80%), radial-gradient(circle at bottom right, rgba(0,0,0,0.05) 0%, transparent 100%)',
          borderColor: isSelected ? microform.halogen : '#a69f8c',
          width: '135px',
          height: '165px',
        }}
      >
        {/* Physical image container frame (high contrast vintage sepia filter) */}
        <div
          className="w-full relative overflow-hidden flex items-center justify-center border bg-stone-900"
          style={{ height: '110px', borderColor: '#d0cbc0' }}
        >
          {/* Sepia Atmosphere Overlay */}
          <div className="absolute inset-0 bg-[#3a200a]/20 mix-blend-color pointer-events-none z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent z-10" />

          {/* Place Photo or Schematic Silhouette Icon */}
          {place.photos && place.photos.length > 0 ? (
            <img
              src={place.photos[0]}
              alt={place.name}
              className="w-full h-full object-cover filter sepia brightness-[0.7] contrast-[1.15]"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 opacity-40">
              {/* Category-accurate vintage blueprint stamp */}
              <span style={{ fontSize: '18px', color: categoryColor }}>
                {place.category === 'haunted' ? '💀' : '▲'}
              </span>
              <span className="text-[6.5px] font-mono tracking-widest text-stone-400">CLASSIFIED</span>
            </div>
          )}

          {/* Floating coordinate stamp at the bottom of the photo layout */}
          <div
            className="absolute bottom-1 right-1.5 z-20 font-mono text-[6px] tracking-wider"
            style={{ color: colors.archive.white, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
          >
            {place.coordinates ? `${place.coordinates[0].toFixed(2)}N, ${place.coordinates[1].toFixed(2)}E` : 'LOC_UNKNOWN'}
          </div>
        </div>

        {/* Polaroid lower margins containing raw scrawled typewriter tags */}
        <div className="mt-2.5 flex flex-col justify-between h-[32px]">
          <span
            className="truncate block leading-tight font-bold font-mono tracking-tight"
            style={{
              fontFamily: typography.mono,
              fontSize: place.name.length > 18 ? '7.5px' : '9px',
              color: isSelected ? colors.archive.black : '#2d2a25',
            }}
          >
            {place.name.toUpperCase()}
          </span>
          <div className="flex justify-between items-center text-[6px] font-mono opacity-65 tracking-wider mt-0.5">
            <span style={{ color: categoryColor, fontWeight: 'bold' }}>
              {(place.category || 'BASELINE').toUpperCase()}
            </span>
            <span style={{ color: colors.archive.grayDark }}>
              MDL_{id.substring(0, 4).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
PolaroidNode.displayName = 'PolaroidNode';

/* ═══════════════════════════════════════════════════════════════
   CUSTOM NODE TYPE B: MANILA INDEX DECLASSIFIED RECORD
   ═══════════════════════════════════════════════════════════════ */

interface ManilaCardProps {
  id: string;
  data: {
    title: string;
    excerpt: string;
    isFocused: boolean;
    hasActiveThread: boolean;
    placeSlug: string;
    onSelect: (slug: string) => void;
  };
}

const ManilaCardNode: React.FC<ManilaCardProps> = React.memo(({ id, data }) => {
  const { title, excerpt, isFocused, hasActiveThread, placeSlug } = data;

  const rotateAngle = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (hash % 5) - 2.5; // Constant tilt between -2.5deg and +2.5deg
  }, [id]);

  return (
    <div
      onClick={() => data.onSelect(placeSlug)}
      className="relative cursor-pointer select-none transition-all duration-300"
      style={{
        transform: `rotate(${rotateAngle}deg)`,
        opacity: hasActiveThread ? (isFocused ? 1.0 : 0.22) : 1.0,
        zIndex: 15,
      }}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ 
          left: '-4px', 
          background: '#d4af37', 
          borderColor: '#8a6d1c', 
          width: '6px', 
          height: '6px' 
        }} 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ 
          right: '-4px', 
          background: '#d4af37', 
          borderColor: '#8a6d1c', 
          width: '6px', 
          height: '6px' 
        }} 
      />

      {/* Staple Pin Effect at the Top Center */}
      <div 
        className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-stone-500 rounded-[1px] shadow-sm border"
        style={{ borderColor: '#66635c', zIndex: 30 }}
      />

      {/* Manila Index Card Sheet Body */}
      <div
        className="p-3 shadow-[0_8px_20px_rgba(0,0,0,0.6),_inset_0_0_8px_rgba(255,255,255,0.4)] rounded-[1px] border"
        style={{
          backgroundColor: '#eddcc4', // Manila envelope yellow-tan color
          borderColor: '#cbbaaa',
          width: '160px',
          height: '100px',
        }}
      >
        {/* Classification Header Stamp */}
        <div className="flex justify-between items-center border-b pb-1 mb-1.5 border-dashed border-[#cbbaaa]">
          <span
            className="text-[6.5px] font-bold font-mono tracking-widest text-red-800"
            style={{ fontFamily: typography.mono }}
          >
            DECLAS_UNRESTRICTED
          </span>
          <span className="text-[5.5px] font-mono opacity-50">RECORD_{id.substring(0, 5).toUpperCase()}</span>
        </div>

        {/* Typewriter Document Excerpt Text */}
        <div className="space-y-1 overflow-hidden h-[62px]">
          <h4
            className="text-[7.5px] font-bold text-stone-800 tracking-tight leading-tight truncate"
            style={{ fontFamily: typography.mono }}
          >
            {title.toUpperCase()}
          </h4>
          <p
            className="text-[6.2px] text-stone-700 leading-snug line-clamp-4 font-mono font-medium tracking-tight whitespace-pre-wrap"
            style={{ fontFamily: typography.mono }}
          >
            {excerpt}
          </p>
        </div>
      </div>
    </div>
  );
});
ManilaCardNode.displayName = 'ManilaCardNode';

/* ═══════════════════════════════════════════════════════════════
   CUSTOM NODE TYPE C: HYPOTHESIS DEDUCTION BLOCK
   ═══════════════════════════════════════════════════════════════ */

interface HypothesisNodeProps {
  id: string;
  data: {
    title: string;
    description: string;
    confidence: number;
    completed: boolean;
    connectedSlugs: string[];
    onHover: (id: string | null) => void;
  };
}

const HypothesisNode: React.FC<HypothesisNodeProps> = React.memo(({ id, data }) => {
  const { title, description, confidence, completed, connectedSlugs } = data;

  return (
    <div
      onMouseEnter={() => data.onHover(id)}
      onMouseLeave={() => data.onHover(null)}
      className={`relative p-4 rounded-[2px] border transition-all duration-300 ${
        completed 
          ? 'border-green-600 bg-stone-900/95 shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
          : 'border-amber-600/40 bg-stone-950/95 shadow-[0_8px_32px_rgba(0,0,0,0.85)]'
      }`}
      style={{
        width: '260px',
        minHeight: '140px',
        fontFamily: typography.mono,
      }}
    >
      {/* Target handle allowing players to drag cords into the Hypothesis card */}
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ 
          left: '-6px', 
          background: completed ? '#22c55e' : '#d97706', 
          borderColor: completed ? '#15803d' : '#92400e', 
          width: '10px', 
          height: '10px',
          boxShadow: `0 0 6px ${completed ? '#22c55e' : '#d97706'}`
        }} 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ 
          right: '-6px', 
          background: completed ? '#22c55e' : '#d97706', 
          borderColor: completed ? '#15803d' : '#92400e', 
          width: '10px', 
          height: '10px',
          boxShadow: `0 0 6px ${completed ? '#22c55e' : '#d97706'}`
        }} 
      />

      {/* Decorative brass corner brackets inside node */}
      <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 border-t border-l opacity-30 border-stone-400" />
      <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 border-t border-r opacity-30 border-stone-400" />
      <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 border-b border-l opacity-30 border-stone-400" />
      <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 border-b border-r opacity-30 border-stone-400" />

      {/* Pinned Tack Head */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-800 border border-red-950 shadow-md" />

      {/* Header Tag */}
      <div className="flex justify-between items-baseline mb-2 border-b border-stone-800 pb-1.5">
        <span className={`text-[8px] font-bold tracking-widest ${completed ? 'text-green-500' : 'text-amber-500'}`}>
          {completed ? 'COGNITIVE HYPOTHESIS SECURED' : 'HYPOTHESIS DEDUCTION'}
        </span>
        <span className="text-[7px] text-stone-500">VP_7B_CONTRADICT</span>
      </div>

      {/* Title */}
      <h3 className={`text-[10px] font-bold tracking-tight mb-1.5 ${completed ? 'text-green-400' : 'text-stone-200'}`}>
        {title}
      </h3>

      {/* Description */}
      <p className="text-[7.2px] text-stone-400 leading-normal mb-3 font-mono opacity-85">
        {description}
      </p>

      {/* Connected nodes trace */}
      {connectedSlugs.length > 0 && (
        <div className="mb-3 border-t border-stone-900 pt-2 text-[6.8px] text-stone-500 space-y-0.5">
          <div className="tracking-widest uppercase text-stone-600 font-bold mb-0.5">Connected Evidence:</div>
          {connectedSlugs.map(slug => (
            <div key={slug} className="truncate text-stone-400">
              ● {slug.replace(/-/g, ' ').toUpperCase()}
            </div>
          ))}
        </div>
      )}

      {/* Meter Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[7.5px]">
          <span className="text-stone-500">CONSENSUS INTEGRITY:</span>
          <span className={`font-bold ${completed ? 'text-green-500 animate-pulse' : 'text-amber-500'}`}>
            {confidence}% {completed && '(LOCKED)'}
          </span>
        </div>
        <div className="h-2 w-full bg-stone-900 rounded-[1px] border border-stone-800 p-[1px]">
          <div 
            className={`h-full transition-all duration-500 rounded-[1px] ${
              completed ? 'bg-green-600' : 'bg-amber-600'
            }`}
            style={{ 
              width: `${confidence}%`,
              boxShadow: `0 0 6px ${completed ? '#16a34a' : '#d97706'}60`
            }} 
          />
        </div>
      </div>
    </div>
  );
});
HypothesisNode.displayName = 'HypothesisNode';

/* ═══════════════════════════════════════════════════════════════
   CUSTOM EDGE RENDERER: SUSPENDED RED WOOL STRING
   ═══════════════════════════════════════════════════════════════ */

const RedWoolStringEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
}) => {
  // Calculate weighted quadratic Bezier sag (catenary curve modeling)
  // Suspended wool yarns sag downwards along the Y-axis due to gravity [26]
  const sagY = 32; // Amount of pixels the string dips
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2 + sagY;

  // Render Bezier curve string path
  const path = `M ${sourceX},${sourceY} Q ${midX},${midY} ${targetX},${targetY}`;

  return (
    <>
      <g className="react-flow__edge">
        {/* Double-offset deep blurred drop-shadow (GPU composited) */}
        <path
          d={path}
          fill="none"
          stroke="rgba(0, 0, 0, 0.72)"
          strokeWidth={4.5}
          strokeLinecap="round"
          className="transition-opacity duration-300"
          style={{
            filter: 'blur(3.5px)',
            transform: 'translate(4px, 12px)', // Physical offset simulating distance from felt backdrop
            pointerEvents: 'none',
          }}
        />

        {/* Primary Textured Crimson Wool Thread Yarn Path */}
        <path
          id={id}
          d={path}
          fill="none"
          stroke="#9b1b12" // Deep blood crimson string
          strokeWidth={2.4}
          strokeLinecap="round"
          className="transition-opacity duration-300"
          style={{
            ...style,
            strokeDasharray: 'none',
            filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.5))',
          }}
          markerEnd={markerEnd}
        />

        {/* Accent fuzzy fiber highlights (giving string realistic wool feel) */}
        <path
          d={path}
          fill="none"
          stroke="#b83126" // Brighter core fiber thread
          strokeWidth={0.8}
          strokeLinecap="round"
          opacity={0.7}
          style={{ pointerEvents: 'none' }}
        />
      </g>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MASTER EVIDENCE CONNECTION BOARD COMPONENT
   ═══════════════════════════════════════════════════════════════ */

const nodeTypes = {
  polaroid: PolaroidNode,
  manilaCard: ManilaCardNode,
  hypothesis: HypothesisNode,
};

const edgeTypes = {
  wool: RedWoolStringEdge,
};

// 13 Authoritative Core Case Slugs (Layer A) to isolate and prevent board clutter
const CORE_CASE_SLUGS = new Set([
  'eastern-state-penitentiary',
  'pripyat-amusement-park',
  'pripyat-hospital-126',
  'chernobyl-reactor-4-control-room',
  'isla-de-las-muecas',
  'bodie-ghost-town',
  'aokigahara-forest',
  'the-grid-null-point',
  'the-vanishing-hospital',
  'borovsko-bridge',
  'st-kilda',
  'teufelsberg-echo-dome',
  'byberry-state-hospital'
]);

export const EvidenceBoard: React.FC = () => {
  const { places, selectedPlaceSlug, selectPlace, setPlaces } = useAtlasStore();
  const { click, play } = useAudioStore();
  const { status, updateStatus } = useUIStore();
  const { addCommand } = useTerminalStore();
  const { selectNode, setFocusNode, setViewMode, playerEdges, addPlayerEdge, nodePositions, setNodePosition } = useEvidenceBoardStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [focusedHypothesisId, setFocusedHypothesisId] = useState<string | null>(null);

  // Sound play cache to prevent click spamming on rapid changes
  const lastAlarmPlayRef = useRef<number>(0);

  // 1. Lore-Seeded Hypotheses Local State (The Contradiction Engine)
  const [hypotheses, setHypotheses] = useState<any[]>([
    {
      id: 'hyp-01-vance',
      title: 'THE EDWARD VANCE PARADOX',
      description: 'Is Edward Vance the keeper of St. Elmo Lighthouse, or a casualty of Oradour Crypt?',
      targetSlugs: ['stelmo-light', 'oradour-church-crypt', 'bodie-ghost-town'],
      connectedSlugs: [],
      completed: false,
      contradictionText: `⚠ CONSENSUS FAILURE REPORT // COGNITIVE ANOMALY V-01\n------------------------------------------------\nEdward Vance kept the St. Elmo light for exactly 40 years, yet disappeared into the sealed Oradour Crypt in 1944. His signature appears in a 1962 transfer record assigned to INV_RED-7.\n\nCOMMON VARIABLE: YOU. THE ARCHIVE IS RECONSTRUCTING YOUR HISTORY.`
    },
    {
      id: 'hyp-02-signal',
      title: 'THE SPATIAL COAXIAL CENTROID',
      description: 'Connect Mount Weather, Cheyenne Mountain, and Raven Rock Complexes to align the 4.5 Hz sub-audible vibration.',
      targetSlugs: ['mount-weather-emergency-operations-center', 'cheyenne-mountain-complex', 'raven-rock-mountain-complex'],
      connectedSlugs: [],
      completed: false,
      contradictionText: `⚠ GEODETIC CENTROID SECURED // ANOMALY ALIGNMENT\n------------------------------------------------\nThe synchronized 4.5 Hz granite vibrations from all three Cold-War complexes cross precisely in an empty wheat field near Lebanon, Kansas.\n\nTHE GRID NULL POINT MARKER IS NOW VERIFIED AND UNLOCKED ON YOUR ATLAS.`
    },
    {
      id: 'hyp-03-identity',
      title: 'THE RECURSIVE ARCHIVIST INDEX',
      description: 'Evaluate Beelitz Surgery, Teufelsberg Echo Dome, and Byberry State Hospital to trace INV_RED-7\'s carrel transfer.',
      targetSlugs: ['beelitz-surgery-basement', 'teufelsberg-echo-dome', 'byberry-state-hospital'],
      connectedSlugs: [],
      completed: false,
      contradictionText: `⚠ CONSENSUS FAILURE REPORT // COGNITIVE ANOMALY I-03\n------------------------------------------------\nArchivist INV_RED-7 completed exactly 4,211 days of service before entering the basement carrel with no keyhole. You have been sitting in their empty chair since the boot sequence.\n\nCOMMON VARIABLE: YOU. THERE IS NO WINDOW IN THIS BUNK.`
    }
  ]);

  // Filter: Progressive Disclosure Loop (Quiet board philosophy) — showing ONLY Layer A core cases on felt
  const visiblePlaces = useMemo(() => {
    return places.filter(
      (place) => CORE_CASE_SLUGS.has(place.slug) && place.status && ['verified', 'whispered', 'sealed', 'mirage'].includes(place.status)
    );
  }, [places]);

  // Interactive edge drawing connection listener
  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;

    // Check if target is a hypothesis node
    const isHypTarget = connection.target.startsWith('hyp-');
    
    if (isHypTarget) {
      const hypId = connection.target;
      const sourcePlaceSlug = connection.source;

      // Click sound on hook connection
      click();

      setHypotheses(prev => {
        return prev.map(hyp => {
          if (hyp.id === hypId) {
            // Prevent duplicate attachments to the same hypothesis node
            if (hyp.connectedSlugs.includes(sourcePlaceSlug)) return hyp;

            const updatedSlugs = [...hyp.connectedSlugs, sourcePlaceSlug];
            
            // Calculate real-time Confidence Metric
            const correctConnections = updatedSlugs.filter(slug => hyp.targetSlugs.includes(slug));
            const baseConfidence = Math.round((correctConnections.length / hyp.targetSlugs.length) * 100);
            
            // Apply Red Herring Penalty if incorrect locations are connected!
            const incorrectCount = updatedSlugs.length - correctConnections.length;
            const finalConfidence = Math.max(0, baseConfidence - (incorrectCount * 20));

            // Evaluate lock status on complete target validation
            const isCompleted = correctConnections.length === hyp.targetSlugs.length && finalConfidence >= 100;

            if (isCompleted && !hyp.completed) {
              // Secure sounding cascades
              play('alert');
              
              // Print the chilling contradiction text directly into your terminal console!
              addCommand({
                id: `hyp-unlocked-${hyp.id}-${Date.now()}`,
                input: `/audit --hypothesis ${hyp.id.toUpperCase()}`,
                output: hyp.contradictionText,
                timestamp: Date.now(),
                type: 'warning'
              });

              // Apply geodetic unlocking side-effects for Centroid Hypotheses
              if (hypId === 'hyp-02-signal') {
                const updatedPlaces = places.map(p => {
                  if (p.slug === 'the-grid-null-point') {
                    return { ...p, status: 'verified' as const };
                  }
                  return p;
                });
                // Force update on Atlas Stores
                setPlaces(updatedPlaces);
              }

              // Award +10 Stability and increase Dust Index on anomalous unredaction
              updateStatus({
                observerStability: Math.min(100, status.observerStability + 10),
                dustIndex: Math.min(100, status.dustIndex + 8)
              });
            } else {
              // Intermittent typing thuds
              play('type');
            }

            return {
              ...hyp,
              connectedSlugs: updatedSlugs,
              confidence: finalConfidence,
              completed: isCompleted
            };
          }
          return hyp;
        });
      });

      // Commit player edges to store
      addPlayerEdge({
        id: `edge-${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        type: 'suspected'
      });

    } else {
      // Standard suspected connection drawn between individual places
      click();
      addPlayerEdge({
        id: `edge-${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        type: 'suspected'
      });
    }
  }, [click, play, addPlayerEdge, addCommand, places, setPlaces, updateStatus, status.observerStability, status.dustIndex]);

  // Synchronize and seed coordinates dynamically into the React Flow Canvas
  useEffect(() => {
    if (visiblePlaces.length === 0) return;

    const centerBoardX = 400;
    const centerBoardY = 320;
    const orbitRadius = 240;

    // Build Polaroid Nodes
    const flowNodes = visiblePlaces.map((place, index) => {
      let position = nodePositions[place.slug];
      if (!position) {
        const angle = (index * 2 * Math.PI) / visiblePlaces.length;
        const nodeX = place.coordinates
          ? centerBoardX + (place.coordinates[0] - 30.0) * 12
          : centerBoardX + orbitRadius * Math.cos(angle);
        const nodeY = place.coordinates
          ? centerBoardY + (51.0 - place.coordinates[1]) * 12
          : centerBoardY + orbitRadius * Math.sin(angle);
        position = { x: nodeX, y: nodeY };
        setNodePosition(place.slug, position);
      }

      const isSelected = selectedPlaceSlug === place.slug;
      
      // Focal Filtering: Identify if a node belongs to the actively investigated thread
      const isFocused = selectedPlaceSlug ? (place.slug === selectedPlaceSlug || place.connectedTo?.includes(selectedPlaceSlug || '')) : false;
      const hasActiveThread = selectedPlaceSlug !== null;

      return {
        id: place.slug,
        type: 'polaroid' as const,
        position: position,
        data: {
          place,
          isSelected,
          isFocused,
          hasActiveThread,
          onSelect: (slug: string) => {
            click();
            selectPlace(slug);
            selectNode(slug);
            setFocusNode(slug);
            setViewMode('focus');
          },
        },
      };
    });

    // Build Document Cards
    const documentCardNodes: any[] = [];
    visiblePlaces.forEach((place) => {
      if (place.resonanceNote) {
        const targetX = flowNodes.find(n => n.id === place.slug)?.position.x ?? centerBoardX;
        const targetY = flowNodes.find(n => n.id === place.slug)?.position.y ?? centerBoardY;

        let cardPos = nodePositions[`card-${place.slug}`];
        if (!cardPos) {
          cardPos = { x: targetX + 115, y: targetY + 30 };
          setNodePosition(`card-${place.slug}`, cardPos);
        }

        documentCardNodes.push({
          id: `card-${place.slug}`,
          type: 'manilaCard' as const,
          position: cardPos,
          data: {
            title: `Resonance Log // ${place.name.toUpperCase()}`,
            excerpt: place.resonanceNote,
            isFocused: selectedPlaceSlug ? (place.slug === selectedPlaceSlug) : false,
            hasActiveThread: selectedPlaceSlug !== null,
            placeSlug: place.slug,
            onSelect: (slug: string) => {
              click();
              selectPlace(slug);
              selectNode(slug);
              setFocusNode(slug);
              setViewMode('focus');
            },
          },
        });
      }
    });

    // Build seeded Hypothesis Nodes stacked neatly in the center grid
    const hypNodes = hypotheses.map((hyp, index) => {
      let hypPos = nodePositions[hyp.id];
      if (!hypPos) {
        hypPos = { x: centerBoardX - 130, y: centerBoardY + (index * 200) - 180 };
        setNodePosition(hyp.id, hypPos);
      }

      return {
        id: hyp.id,
        type: 'hypothesis' as const,
        position: hypPos,
        data: {
          title: hyp.title,
          description: hyp.description,
          confidence: hyp.confidence || 0,
          completed: hyp.completed,
          connectedSlugs: hyp.connectedSlugs,
          onHover: (id: string | null) => setFocusedHypothesisId(id)
        }
      };
    });

    setNodes([...flowNodes, ...documentCardNodes, ...hypNodes]);

    // Build Edge strings
    const flowEdges: any[] = [];
    visiblePlaces.forEach((place) => {
      if (!place.connectedTo) return;

      place.connectedTo.forEach((targetSlug) => {
        const targetExists = visiblePlaces.some((p) => p.slug === targetSlug);
        if (!targetExists) return;

        const isHighlighted = selectedPlaceSlug
          ? (place.slug === selectedPlaceSlug || targetSlug === selectedPlaceSlug)
          : false;

        flowEdges.push({
          id: `edge-${place.slug}-${targetSlug}`,
          source: place.slug,
          target: targetSlug,
          type: 'wool',
          style: {
            opacity: selectedPlaceSlug ? (isHighlighted ? 1.0 : 0.12) : 0.85,
            stroke: isHighlighted ? '#c11b17' : '#801811',
          },
        });
      });

      if (place.resonanceNote) {
        const isHighlighted = selectedPlaceSlug === place.slug;
        flowEdges.push({
          id: `edge-card-${place.slug}`,
          source: place.slug,
          target: `card-${place.slug}`,
          type: 'wool',
          style: {
            opacity: selectedPlaceSlug ? (isHighlighted ? 1.0 : 0.12) : 0.65,
            stroke: isHighlighted ? '#bf9f62' : '#5a4632',
          },
        });
      }
    });

    // Feed player suspects and connections
    playerEdges.forEach((edge: any) => {
      // Only render valid targets
      const sourceExists = [...flowNodes, ...hypNodes].some(n => n.id === edge.source);
      const targetExists = [...flowNodes, ...hypNodes].some(n => n.id === edge.target);
      if (!sourceExists || !targetExists) return;

      const isHighlighted = selectedPlaceSlug
        ? (edge.source === selectedPlaceSlug || edge.target === selectedPlaceSlug || edge.target === `card-${selectedPlaceSlug}`)
        : false;

      const isHypEdge = edge.target.startsWith('hyp-');

      flowEdges.push({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'wool',
        style: {
          opacity: selectedPlaceSlug ? (isHighlighted ? 1.0 : 0.12) : 0.75,
          stroke: isHypEdge 
            ? (isHighlighted ? '#eab308' : '#854d0e') // Suspended golden twine for hypotheses
            : (isHighlighted ? '#eab308' : '#92400e'),
          strokeDasharray: isHypEdge ? 'none' : '3, 6', // Player connections are frayed twine
        }
      });
    });

    setEdges(flowEdges);
  }, [visiblePlaces, selectedPlaceSlug, selectPlace, selectNode, setFocusNode, setViewMode, click, setNodes, setEdges, hypotheses, playerEdges]);

  // Click handler to deselect node on board background click
  const handlePaneClick = useCallback(() => {
    click();
    selectPlace(null);
  }, [click, selectPlace]);

  return (
    <div
      className="w-full h-full select-none overflow-hidden relative felt-board"
      style={feltStyles.board}
    >
      {/* Dynamic Overlay: Desklamp lighting glow and vignette shading [1] */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 35%, rgba(0, 0, 0, 0.95) 100%)',
          zIndex: 4,
        }}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={(evt, node) => setNodePosition(node.id, node.position)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onConnect={onConnect}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        maxZoom={3.0}
        minZoom={0.3}
        className="relative z-10"
      >
        {/* Soft atmospheric radial grid background */}
        <Background color="#161310" gap={16} size={1} style={{ opacity: 0.06 }} />
        
        {/* Customized terminal console control gauges */}
        <Controls
          showInteractive={false}
          className="border rounded-[2px]"
          style={{
            borderColor: colors.archive.grayDark || '#2c251e',
            backgroundColor: 'rgba(10, 8, 6, 0.95)',
            color: colors.archive.grayLight,
            fontFamily: typography.mono,
            fontSize: '9px',
          }}
        />
      </ReactFlow>

      {/* Outer Tactical Corner Brackets [100] */}
      <div className="absolute inset-0 pointer-events-none" style={{ border: `1px solid ${microform.mahogany}`, zIndex: 5 }}>
        <div className="absolute top-3 left-3 w-4 h-4 border-t border-l" style={{ borderColor: microform.halogen, opacity: 0.35 }} />
        <div className="absolute top-3 right-3 w-4 h-4 border-t border-r" style={{ borderColor: microform.halogen, opacity: 0.35 }} />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l" style={{ borderColor: microform.halogen, opacity: 0.35 }} />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r" style={{ borderColor: microform.halogen, opacity: 0.35 }} />
      </div>

      {/* Board Information Card Tag */}
      <div
        className="absolute bottom-5 left-5 p-3 border font-mono text-[9px] tracking-wider pointer-events-auto"
        style={{
          borderColor: colors.archive.grayDark || '#2a2a28',
          backgroundColor: 'rgba(10, 8, 6, 0.95)',
          color: colors.archive.grayLight,
          zIndex: 5,
        }}
      >
        <div style={{ color: microform.halogen, fontWeight: 'bold', marginBottom: '4px' }}>
          REALITY CONSENSUS BOARD
        </div>
        <div className="opacity-60 space-y-0.5">
          <div>NODES PINNED: {visiblePlaces.length} UNIT(S)</div>
          <div>ACTIVE THREADS: {edges.length} CONNECTION(S)</div>
          <div>ACTIVE HYPOTHESES: {hypotheses.filter(h => !h.completed).length} DISCOVERED</div>
          <div>CONSENSUS FAILURE WARNINGS: {hypotheses.filter(h => h.completed).length} RECONSTRUCTED</div>
        </div>
      </div>
    </div>
  );
};

export default EvidenceBoard;