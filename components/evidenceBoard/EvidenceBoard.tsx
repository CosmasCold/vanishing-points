import React, { useMemo, useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  EdgeProps,
  EdgeText,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useAtlasStore } from '@/state/atlasStore';
import { useAudioStore } from '@/state/audioStore';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
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
    return (hash % 7); // Generates constant tilt between -3deg and +3deg
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
      {/* Target input/output connection handles hidden beneath the pushpin */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0, top: '4px' }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, bottom: '4px' }} />

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

      {/* Faded white-matte Polaroid sheet body */}
      <div
        className="p-3 bg-[#e8e5db] shadow-[0_12px_28px_rgba(0,0,0,0.7),_inset_0_0_12px_rgba(255,255,255,0.35)] rounded-[1px] border"
        style={{
          borderColor: isSelected ? microform.halogen : '#b8b4a8',
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
      <Handle type="target" position={Position.Left} style={{ opacity: 0, left: '4px' }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, right: '4px' }} />

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
};

const edgeTypes = {
  wool: RedWoolStringEdge,
};

export const EvidenceBoard: React.FC = () => {
  const { places, selectedPlaceSlug, selectPlace } = useAtlasStore();
  const { click } = useAudioStore();
  const { selectNode, setFocusNode, setViewMode } = useEvidenceBoardStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Filter: Progressive Disclosure Loop (Quiet board philosophy)
  // Nodes only appear on the board once they have been verified, whispered, or sealed [5]
  const visiblePlaces = useMemo(() => {
    return places.filter(
      (place) => place.status && ['verified', 'whispered', 'sealed', 'mirage'].includes(place.status)
    );
  }, [places]);

  // Synchronize and seed coordinates dynamically into the React Flow Canvas
  useEffect(() => {
    if (visiblePlaces.length === 0) return;

    // Generate physical map grids on a circular orbit to prevent spatial overlap chaos
    const totalNodes = visiblePlaces.length;
    const centerBoardX = 400;
    const centerBoardY = 300;
    const orbitRadius = 180; // Distance of node orbiting anchors

    // Build Polaroid and Card Nodes
    const flowNodes = visiblePlaces.map((place, index) => {
      const angle = (index * 2 * Math.PI) / totalNodes;
      
      // Node position is mapped deterministic based on coordinates when available
      const nodeX = place.coordinates
        ? centerBoardX + (place.coordinates[0] - 30.0) * 12 // Scale coordinates appropriately
        : centerBoardX + orbitRadius * Math.cos(angle);
      const nodeY = place.coordinates
        ? centerBoardY + (51.0 - place.coordinates[1]) * 12
        : centerBoardY + orbitRadius * Math.sin(angle);

      const isSelected = selectedPlaceSlug === place.slug;
      
      // Focal Filtering: Identify if a node belongs to the actively investigated thread
      const isFocused = selectedPlaceSlug ? (place.slug === selectedPlaceSlug || place.connectedTo?.includes(selectedPlaceSlug || '')) : false;
      const hasActiveThread = selectedPlaceSlug !== null;

      return {
        id: place.slug,
        type: 'polaroid' as const,
        position: { x: nodeX, y: nodeY },
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

    // Generate Manila Document Card Nodes orbiting around their place anchors
    const documentCardNodes: any[] = [];
    visiblePlaces.forEach((place) => {
      if (place.resonanceNote) {
        // Position Card 90px below its respective polaroid node
        const targetX = flowNodes.find(n => n.id === place.slug)?.position.x ?? centerBoardX;
        const targetY = flowNodes.find(n => n.id === place.slug)?.position.y ?? centerBoardY;

        documentCardNodes.push({
          id: `card-${place.slug}`,
          type: 'manilaCard' as const,
          position: { x: targetX + 110, y: targetY + 35 },
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

    setNodes([...flowNodes, ...documentCardNodes]);

    // Build Wool Edge connections natively using global geodetic ties [94, 99]
    const flowEdges: any[] = [];
    visiblePlaces.forEach((place) => {
      if (!place.connectedTo) return;

      place.connectedTo.forEach((targetSlug) => {
        // Ensure destination target actually is resolved on board
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
            stroke: isHighlighted ? '#c11b17' : '#801811', // Glowing red yarn when clicked
          },
        });
      });

      // Thread string between Polaroid and its relative Manila index card
      if (place.resonanceNote) {
        const isHighlighted = selectedPlaceSlug === place.slug;
        flowEdges.push({
          id: `edge-card-${place.slug}`,
          source: place.slug,
          target: `card-${place.slug}`,
          type: 'wool',
          style: {
            opacity: selectedPlaceSlug ? (isHighlighted ? 1.0 : 0.12) : 0.65,
            stroke: isHighlighted ? '#bf9f62' : '#5a4632', // Manila paper yarn uses golden/tan hemp string
          },
        });
      }
    });

    setEdges(flowEdges);
  }, [visiblePlaces, selectedPlaceSlug, selectPlace, selectNode, setFocusNode, setViewMode, click, setNodes, setEdges]);

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
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
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
          <div>STABILITY LEVEL: NOMINAL</div>
        </div>
      </div>
    </div>
  );
};

export default EvidenceBoard;
