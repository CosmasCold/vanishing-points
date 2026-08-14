import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
  type EdgeProps,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useAtlasStore } from '@/state/atlasStore';
import { useAudioStore } from '@/state/audioStore';
import { useUIStore } from '@/state/uiStore';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { useTerminalStore } from '@/state/terminalStore';
import { colors, typography, microform } from '@/styles/theme';
import { Place } from '@/types/places';
import { AlertTriangle, Pin } from 'lucide-react';

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
   CUSTOM NODE TYPE A: POLAROID PIN (HYPER-REALISTIC AGED & GLOSS)
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
    return (hash % 7) - 3;
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
      className="relative cursor-pointer select-none transition-all duration-300 group"
      style={{
        transform: `rotate(${rotateAngle}deg) scale(${isSelected ? 1.05 : 1.0})`,
        opacity: hasActiveThread ? (isFocused ? 1.0 : 0.28) : 1.0,
        zIndex: isSelected ? 30 : 10,
      }}
    >
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

      <div
        className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full transition-all duration-150 z-[40]"
        style={{
          background: 'radial-gradient(circle at 35% 35%, #bf9f62 0%, #7a5f2e 60%, #403010 100%)',
          boxShadow: isSelected
            ? '0 6px 12px rgba(0,0,0,0.95), inset 0 1px 1px rgba(255,255,255,0.45)'
            : '0 4px 6px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.4)',
          border: '1px solid #5a451e',
          transform: isSelected ? 'scale(1.15) translateY(-1.5px)' : 'scale(1.0)',
        }}
      >
        <div className="absolute w-[2px] h-3.5 bg-black/75 top-3.5 left-1.5 rotate-[15deg] blur-[0.5px]" />
      </div>

      <div
        className="p-3 rounded-[1px] border transition-all duration-300"
        style={{
          backgroundColor: '#dfd5c0',
          backgroundImage: `
            radial-gradient(circle at 12% 15%, rgba(139, 90, 43, 0.12) 0%, transparent 22%),
            radial-gradient(circle at 80% 90%, rgba(60, 40, 20, 0.10) 0%, transparent 25%),
            linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)
          `,
          borderColor: isSelected ? '#bf9f62' : '#8a806f',
          boxShadow: isSelected
            ? '0 12px 30px rgba(0,0,0,0.9), inset 0 0 10px rgba(139, 90, 43, 0.12)'
            : '0 6px 16px rgba(0,0,0,0.65)',
        }}
      >
        <div
          className="relative overflow-hidden border border-black/20"
          style={{
            width: '180px',
            height: '135px',
            background: '#171411',
          }}
        >
          {place.photos?.[0] ? (
            <img
              src={place.photos[0]}
              alt={place.name}
              className="w-full h-full object-cover"
              style={{
                filter: 'sepia(0.18) contrast(1.05) brightness(0.86)',
              }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                color: categoryColor,
                fontFamily: typography.mono,
                fontSize: '10px',
                letterSpacing: '0.12em',
              }}
            >
              NO PHOTOGRAPH
            </div>
          )}

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.32))',
              mixBlendMode: 'multiply',
            }}
          />
        </div>

        <div className="mt-2 px-1">
          <div
            className="font-serif font-bold uppercase truncate"
            style={{
              color: '#211b16',
              fontSize: '11px',
              letterSpacing: '0.05em',
            }}
          >
            {place.name}
          </div>

          <div
            className="font-mono uppercase truncate mt-1"
            style={{
              color: categoryColor,
              fontSize: '7px',
              letterSpacing: '0.12em',
            }}
          >
            {place.category} // {place.status}
          </div>

          <div
            className="font-mono mt-1 truncate"
            style={{
              color: '#5f574c',
              fontSize: '7px',
            }}
          >
            {place.address?.formatted || 'LOCATION UNKNOWN'}
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-1 right-1"
        style={{
          color: '#5f574c',
          opacity: 0.6,
          fontSize: '6px',
          fontFamily: typography.mono,
        }}
      >
        {place.id}
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════
   CUSTOM NODE TYPE B: MANILA RESONANCE CARD
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

const ManilaCardNode: React.FC<ManilaCardProps> = React.memo(({ data }) => {
  const {
    title,
    excerpt,
    isFocused,
    hasActiveThread,
    placeSlug,
    onSelect,
  } = data;

  return (
    <div
      onClick={() => onSelect(placeSlug)}
      className="relative cursor-pointer select-none transition-all duration-300"
      style={{
        width: '220px',
        opacity: hasActiveThread ? (isFocused ? 1 : 0.25) : 0.92,
        transform: `rotate(-1deg) ${isFocused ? 'scale(1.04)' : 'scale(1)'}`,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          left: '-6px',
          background: '#bf9f62',
          borderColor: '#6f5624',
          width: '7px',
          height: '7px',
        }}
      />

      <div
        className="p-4 border"
        style={{
          backgroundColor: '#bca987',
          backgroundImage: `
            radial-gradient(circle at 15% 20%, rgba(80, 55, 30, 0.12), transparent 30%),
            radial-gradient(circle at 85% 75%, rgba(255, 255, 255, 0.08), transparent 25%)
          `,
          borderColor: '#76654c',
          boxShadow: '0 7px 18px rgba(0,0,0,0.6)',
        }}
      >
        <div
          className="font-mono uppercase"
          style={{
            color: '#3c3226',
            fontSize: '8px',
            letterSpacing: '0.12em',
            marginBottom: '6px',
          }}
        >
          {title}
        </div>

        <div
          className="font-serif"
          style={{
            color: '#282018',
            fontSize: '11px',
            lineHeight: 1.5,
          }}
        >
          {excerpt}
        </div>

        <div
          className="mt-3 pt-2 border-t font-mono"
          style={{
            borderColor: 'rgba(50,40,30,0.25)',
            color: '#5f503d',
            fontSize: '7px',
            letterSpacing: '0.08em',
          }}
        >
          RESONANCE RECORD // {placeSlug}
        </div>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════
   CUSTOM NODE TYPE C: HYPOTHESIS CARD
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
  const {
    title,
    description,
    confidence,
    completed,
    onHover,
  } = data;

  return (
    <div
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      className="relative w-[250px] select-none"
      style={{
        filter: completed
          ? 'drop-shadow(0 0 10px rgba(212,175,55,0.3))'
          : 'none',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          left: '-6px',
          background: '#eab308',
          borderColor: '#854d0e',
          width: '8px',
          height: '8px',
        }}
      />

      <Handle
        type="source"
        position={Position.Right}
        style={{
          right: '-6px',
          background: '#eab308',
          borderColor: '#854d0e',
          width: '8px',
          height: '8px',
        }}
      />

      <div
        className="border p-3"
        style={{
          background: 'linear-gradient(145deg, rgba(20,16,11,0.98), rgba(8,7,5,0.98))',
          borderColor: completed ? '#bf9f62' : '#574a39',
          boxShadow: '0 10px 22px rgba(0,0,0,0.8)',
        }}
      >
        <div
          className="font-mono font-bold"
          style={{
            color: completed ? '#bf9f62' : '#c8b79b',
            fontSize: '9px',
            letterSpacing: '0.12em',
          }}
        >
          {title}
        </div>

        <div
          className="mt-2 font-serif"
          style={{
            color: '#aaa092',
            fontSize: '10px',
            lineHeight: 1.45,
          }}
        >
          {description}
        </div>

        <div className="mt-3">
          <div
            className="flex justify-between font-mono uppercase"
            style={{
              color: '#71685d',
              fontSize: '7px',
            }}
          >
            <span>CONFIDENCE</span>
            <span>{confidence}%</span>
          </div>

          <div
            className="mt-1 h-[3px]"
            style={{
              background: '#241e17',
            }}
          >
            <div
              className="h-full"
              style={{
                width: `${Math.max(0, Math.min(100, confidence))}%`,
                background: completed ? '#bf9f62' : '#854d0e',
                transition: 'width 300ms ease',
              }}
            />
          </div>
        </div>

        <div
          className="mt-2 font-mono uppercase"
          style={{
            color: completed ? '#bf9f62' : '#70665a',
            fontSize: '7px',
            letterSpacing: '0.1em',
          }}
        >
          {completed ? 'CONSENSUS FAILURE CONFIRMED' : 'HYPOTHESIS UNRESOLVED'}
        </div>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════
   CUSTOM EDGE TYPE: WOOL / THREAD
   ═══════════════════════════════════════════════════════════════ */

const WoolEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
}) => {
  const path = `M ${sourceX},${sourceY} C ${sourceX + 80},${sourceY} ${targetX - 80},${targetY} ${targetX},${targetY}`;

  return (
    <>
      <path
        id={id}
        d={path}
        fill="none"
        stroke={(style?.stroke as string) || '#801811'}
        strokeWidth={2}
        strokeDasharray={(style?.strokeDasharray as string) || 'none'}
        opacity={(style?.opacity as number) ?? 0.85}
      />
    </>
  );
};

const nodeTypes = {
  polaroid: PolaroidNode,
  manilaCard: ManilaCardNode,
  hypothesis: HypothesisNode,
};

const edgeTypes = {
  wool: WoolEdge,
};

/* ═══════════════════════════════════════════════════════════════
   MAIN EVIDENCE BOARD
   ═══════════════════════════════════════════════════════════════ */

const INITIAL_HYPOTHESES = [
  {
    id: 'hyp-01-vance',
    title: 'THE EDWARD VANCE PARADOX',
    description: 'Is Edward Vance the keeper of St. Elmo Lighthouse, or a casualty of Oradour Crypt?',
    targetSlugs: ['stelmo-light', 'oradour-church-crypt', 'bodie-ghost-town'],
    connectedSlugs: [],
    completed: false,
    contradictionText: `⚠ CONSENSUS FAILURE REPORT // COGNITIVE ANOMALY V-01
------------------------------------------------
Edward Vance kept the St. Elmo light for exactly 40 years, yet disappeared into the sealed Oradour Crypt in 1944. His signature appears in a 1962 transfer record assigned to INV_RED-7.

COMMON VARIABLE: YOU. THE ARCHIVE IS RECONSTRUCTING YOUR HISTORY.`,
  },
  {
    id: 'hyp-02-signal',
    title: 'THE 18 HZ SIGNAL',
    description: 'Are the apparently unrelated resonance events actually one distributed signal?',
    targetSlugs: ['cheyenne-mountain-complex', 'dallol-sulfur-cathedral', 'the-grid-null-point'],
    connectedSlugs: [],
    completed: false,
    contradictionText: `⚠ SIGNAL CORRELATION REPORT // FREQUENCY ANOMALY V-02
------------------------------------------------
Three locations report resonance activity at precisely 18 Hz despite having no shared geological, electrical, or communications infrastructure.

The signal is not traveling between them.

THE LOCATIONS ARE RECEIVING THE SAME THING.`,
  },
  {
    id: 'hyp-03-map',
    title: 'THE IMPOSSIBLE MAP',
    description: 'Do the Atlas coordinates describe physical locations, or positions in a second geography?',
    targetSlugs: ['pripyat-amusement-park', 'poveglia-island', 'the-grid-null-point'],
    connectedSlugs: [],
    completed: false,
    contradictionText: `⚠ GEODETIC INTEGRITY REPORT // CARTOGRAPHIC ANOMALY V-03
------------------------------------------------
Three verified coordinates form a triangle that does not exist on any recognized terrestrial projection.

The same triangle appears in historical maps predating the locations themselves.

THE MAP MAY NOT BE DESCRIBING EARTH.`,
  },
];

export const EvidenceBoard: React.FC = () => {
  const {
    places,
    selectedPlaceSlug,
    selectPlace,
    setPlaces,
  } = useAtlasStore();

  const { click, play } = useAudioStore();

  const {
    status,
    updateStatus,
  } = useUIStore();

  const {
    addCommand,
  } = useTerminalStore();

  const {
    selectNode,
    setFocusNode,
    setViewMode,
    playerEdges,
    addPlayerEdge,
    nodePositions,
    setNodePosition,
  } = useEvidenceBoardStore();

  const [nodes, setNodes, onNodesChange] =
    useNodesState<Node>([]);

  const [edges, setEdges, onEdgesChange] =
    useEdgesState<Edge>([]);

  const [focusedHypothesisId, setFocusedHypothesisId] =
    useState<string | null>(null);

  const [hypotheses, setHypotheses] =
    useState<any[]>(INITIAL_HYPOTHESES);

  const visiblePlaces = useMemo(
    () => places.filter((place) => place.status !== 'rejected'),
    [places]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) {
        return;
      }

      const sourcePlace = places.find(
        (place) => place.slug === connection.source
      );

      const targetPlace = places.find(
        (place) => place.slug === connection.target
      );

      const hyp = hypotheses.find(
        (candidate) => candidate.id === connection.target
      );

      if (sourcePlace && targetPlace) {
        const existing = sourcePlace.connectedTo?.some(
          (connectedId) =>
            connectedId === `place:${targetPlace.slug}`
        );

        if (!existing) {
          const updatedPlaces = places.map((place) => {
            if (place.slug !== sourcePlace.slug) {
              return place;
            }

            return {
              ...place,
              connectedTo: [
                ...(place.connectedTo || []),
                `place:${targetPlace.slug}` as `place:${string}`,
              ],
            };
          });

          setPlaces(updatedPlaces);
        }

        click();

        addPlayerEdge({
          id: `edge-${connection.source}-${connection.target}`,
          source: connection.source,
          target: connection.target,
          type: 'suspected',
        });

        return;
      }

      if (hyp) {
        setHypotheses((current) =>
          current.map((candidate) => {
            if (candidate.id !== hyp.id) {
              return candidate;
            }

            const updatedSlugs = Array.from(
              new Set([
                ...candidate.connectedSlugs,
                connection.source,
              ])
            );

            const correctConnections =
              updatedSlugs.filter(
                (slug) =>
                  candidate.targetSlugs.includes(slug)
              );

            const baseConfidence =
              candidate.targetSlugs.length > 0
                ? Math.round(
                    (correctConnections.length /
                      candidate.targetSlugs.length) *
                      100
                  )
                : 0;

            const incorrectCount =
              updatedSlugs.length -
              correctConnections.length;

            const finalConfidence = Math.max(
              0,
              baseConfidence -
                incorrectCount * 20
            );

            const isCompleted =
              correctConnections.length ===
                candidate.targetSlugs.length &&
              finalConfidence >= 100;

            if (
              isCompleted &&
              !candidate.completed
            ) {
              play('alert');

              addCommand({
                id: `hyp-unlocked-${candidate.id}-${Date.now()}`,
                input: `/audit --hypothesis ${candidate.id.toUpperCase()}`,
                output:
                  candidate.contradictionText,
                timestamp: Date.now(),
                type: 'warning',
              });

              if (
                candidate.id ===
                'hyp-02-signal'
              ) {
                const updatedPlaces =
                  places.map((place) => {
                    if (
                      place.slug ===
                      'the-grid-null-point'
                    ) {
                      return {
                        ...place,
                        status:
                          'verified' as const,
                      };
                    }

                    return place;
                  });

                setPlaces(updatedPlaces);
              }

              updateStatus({
                observerStability: Math.min(
                  100,
                  status.observerStability + 10
                ),
                dustIndex: Math.min(
                  100,
                  status.dustIndex + 8
                ),
              });
            } else {
              play('type');
            }

            return {
              ...candidate,
              connectedSlugs: updatedSlugs,
              confidence: finalConfidence,
              completed: isCompleted,
            };
          })
        );

        addPlayerEdge({
          id: `edge-${connection.source}-${connection.target}`,
          source: connection.source,
          target: connection.target,
          type: 'suspected',
        });
      } else {
        click();

        addPlayerEdge({
          id: `edge-${connection.source}-${connection.target}`,
          source: connection.source,
          target: connection.target,
          type: 'suspected',
        });
      }
    },
    [
      click,
      play,
      addPlayerEdge,
      addCommand,
      places,
      setPlaces,
      updateStatus,
      status.observerStability,
      status.dustIndex,
      hypotheses,
    ]
  );

  useEffect(() => {
    if (visiblePlaces.length === 0) {
      return;
    }

    const centerBoardX = 400;
    const centerBoardY = 320;
    const orbitRadius = 240;

    const flowNodes = visiblePlaces.map(
      (place, index) => {
        let position =
          nodePositions[place.slug];

        if (!position) {
          const angle =
            (index * 2 * Math.PI) /
            visiblePlaces.length;

          const nodeX = place.coordinates
            ? centerBoardX +
              (place.coordinates[0] -
                30.0) *
                12
            : centerBoardX +
              orbitRadius *
                Math.cos(angle);

          const nodeY = place.coordinates
            ? centerBoardY +
              (51.0 -
                place.coordinates[1]) *
                12
            : centerBoardY +
              orbitRadius *
                Math.sin(angle);

          position = {
            x: nodeX,
            y: nodeY,
          };

          setNodePosition(
            place.slug,
            position
          );
        }

        const isSelected =
          selectedPlaceSlug ===
          place.slug;

        const isFocused =
          selectedPlaceSlug
            ? (
                place.slug ===
                  selectedPlaceSlug ||
                place.connectedTo?.some(
                  (connectedId) =>
                    connectedId ===
                    `place:${selectedPlaceSlug}`
                )
              )
            : false;

        const hasActiveThread =
          selectedPlaceSlug !== null;

        return {
          id: place.slug,
          type: 'polaroid' as const,
          position,
          data: {
            place,
            isSelected,
            isFocused,
            hasActiveThread,
            onSelect: (
              slug: string
            ) => {
              click();
              selectPlace(slug);
              selectNode(slug);
              setFocusNode(slug);
              setViewMode('focus');
            },
          },
        };
      }
    );

    const documentCardNodes: Node[] = [];

    visiblePlaces.forEach(
      (place) => {
        if (!place.resonanceNote) {
          return;
        }

        const targetX =
          flowNodes.find(
            (node) =>
              node.id === place.slug
          )?.position.x ??
          centerBoardX;

        const targetY =
          flowNodes.find(
            (node) =>
              node.id === place.slug
          )?.position.y ??
          centerBoardY;

        let cardPos =
          nodePositions[
            `card-${place.slug}`
          ];

        if (!cardPos) {
          cardPos = {
            x: targetX + 115,
            y: targetY + 30,
          };

          setNodePosition(
            `card-${place.slug}`,
            cardPos
          );
        }

        documentCardNodes.push({
          id: `card-${place.slug}`,
          type: 'manilaCard',
          position: cardPos,
          data: {
            title: `Resonance Log // ${place.name.toUpperCase()}`,
            excerpt:
              place.resonanceNote,
            isFocused:
              selectedPlaceSlug
                ? place.slug ===
                  selectedPlaceSlug
                : false,
            hasActiveThread:
              selectedPlaceSlug !==
              null,
            placeSlug:
              place.slug,
            onSelect: (
              slug: string
            ) => {
              click();
              selectPlace(slug);
              selectNode(slug);
              setFocusNode(slug);
              setViewMode('focus');
            },
          },
        });
      }
    );

    const hypNodes: Node[] =
      hypotheses.map(
        (
          hyp,
          index
        ) => {
          let hypPos =
            nodePositions[
              hyp.id
            ];

          if (!hypPos) {
            hypPos = {
              x:
                centerBoardX -
                130,
              y:
                centerBoardY +
                index * 200 -
                180,
            };

            setNodePosition(
              hyp.id,
              hypPos
            );
          }

          return {
            id: hyp.id,
            type: 'hypothesis',
            position: hypPos,
            data: {
              title:
                hyp.title,
              description:
                hyp.description,
              confidence:
                hyp.confidence ||
                0,
              completed:
                hyp.completed,
              connectedSlugs:
                hyp.connectedSlugs,
              onHover: (
                id: string | null
              ) =>
                setFocusedHypothesisId(
                  id
                ),
            },
          };
        }
      );

    setNodes([
      ...flowNodes,
      ...documentCardNodes,
      ...hypNodes,
    ]);

    const flowEdges: Edge[] = [];

    visiblePlaces.forEach(
      (place) => {
        if (!place.connectedTo) {
          return;
        }

        place.connectedTo.forEach(
          (targetId) => {
            const targetSlug =
              targetId.replace(
                /^place:/,
                ''
              );

            const targetExists =
              visiblePlaces.some(
                (candidate) =>
                  candidate.slug ===
                  targetSlug
              );

            if (!targetExists) {
              return;
            }

            const isHighlighted =
              selectedPlaceSlug
                ? (
                    place.slug ===
                      selectedPlaceSlug ||
                    targetSlug ===
                      selectedPlaceSlug
                  )
                : false;

            flowEdges.push({
              id: `edge-${place.slug}-${targetSlug}`,
              source:
                place.slug,
              target:
                targetSlug,
              type: 'wool',
              style: {
                opacity:
                  selectedPlaceSlug
                    ? (
                        isHighlighted
                          ? 1.0
                          : 0.12
                      )
                    : 0.85,
                stroke:
                  isHighlighted
                    ? '#c11b17'
                    : '#801811',
              },
            });
          }
        );

        if (place.resonanceNote) {
          const isHighlighted =
            selectedPlaceSlug ===
            place.slug;

          flowEdges.push({
            id: `edge-card-${place.slug}`,
            source:
              place.slug,
            target:
              `card-${place.slug}`,
            type: 'wool',
            style: {
              opacity:
                selectedPlaceSlug
                  ? (
                      isHighlighted
                        ? 1.0
                        : 0.12
                    )
                  : 0.65,
              stroke:
                isHighlighted
                  ? '#bf9f62'
                  : '#5a4632',
            },
          });
        }
      }
    );

    playerEdges.forEach(
      (edge: any) => {
        const sourceExists =
          [
            ...flowNodes,
            ...hypNodes,
          ].some(
            (node) =>
              node.id ===
              edge.source
          );

        const targetExists =
          [
            ...flowNodes,
            ...hypNodes,
          ].some(
            (node) =>
              node.id ===
              edge.target
          );

        if (
          !sourceExists ||
          !targetExists
        ) {
          return;
        }

        const isHighlighted =
          selectedPlaceSlug
            ? (
                edge.source ===
                  selectedPlaceSlug ||
                edge.target ===
                  selectedPlaceSlug ||
                edge.target ===
                  `card-${selectedPlaceSlug}`
              )
            : false;

        const isHypEdge =
          edge.target.startsWith(
            'hyp-'
          );

        flowEdges.push({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: 'wool',
          style: {
            opacity:
              selectedPlaceSlug
                ? (
                    isHighlighted
                      ? 1.0
                      : 0.12
                  )
                : 0.75,
            stroke:
              isHypEdge
                ? (
                    isHighlighted
                      ? '#eab308'
                      : '#854d0e'
                  )
                : (
                    isHighlighted
                      ? '#eab308'
                      : '#92400e'
                  ),
            strokeDasharray:
              isHypEdge
                ? 'none'
                : '3, 6',
          },
        });
      }
    );

    setEdges(flowEdges);
  }, [
    visiblePlaces,
    selectedPlaceSlug,
    selectPlace,
    selectNode,
    setFocusNode,
    setViewMode,
    click,
    setNodes,
    setEdges,
    hypotheses,
    playerEdges,
  ]);

  const handlePaneClick =
    useCallback(() => {
      click();
      selectPlace(null);
    }, [
      click,
      selectPlace,
    ]);

  return (
    <div
      className="w-full h-full select-none overflow-hidden relative felt-board"
      style={feltStyles.board}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at center, transparent 35%, rgba(0, 0, 0, 0.95) 100%)',
          zIndex: 4,
        }}
      />

      <ReactFlow
        onlyRenderVisibleElements={true}
        nodes={nodes}
        edges={edges}
        onNodesChange={
          onNodesChange
        }
        onEdgesChange={
          onEdgesChange
        }
        onNodeDragStop={(
          _evt,
          node
        ) => {
          setNodePosition(
            node.id,
            node.position
          );
        }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onConnect={onConnect}
        onPaneClick={
          handlePaneClick
        }
        fitView
        fitViewOptions={{
          padding: 0.15,
        }}
        maxZoom={2.0}
        minZoom={0.25}
        className="relative z-10"
      >
        <Background
          color="#161310"
          gap={16}
          size={1}
          style={{
            opacity: 0.06,
          }}
        />

        <Controls
          showInteractive={false}
          className="border rounded-[2px]"
          style={{
            borderColor:
              colors.archive
                .grayDark ||
              '#2c251e',
            backgroundColor:
              'rgba(10, 8, 6, 0.95)',
            color:
              colors.archive
                .grayLight,
            fontFamily:
              typography.mono,
            fontSize: '9px',
          }}
        />
      </ReactFlow>

      <AnimatePresence>
        {focusedHypothesisId && (
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: 10,
            }}
            className="absolute bottom-5 right-5 z-20 max-w-[340px]"
          >
            <div
              className="border p-4"
              style={{
                background:
                  'rgba(10, 8, 6, 0.96)',
                borderColor:
                  '#574a39',
                boxShadow:
                  '0 12px 30px rgba(0,0,0,0.85)',
              }}
            >
              <div
                className="font-mono uppercase font-bold"
                style={{
                  color:
                    microform.halogen,
                  fontSize: '8px',
                  letterSpacing:
                    '0.14em',
                }}
              >
                HYPOTHESIS THREAD
              </div>

              <div
                className="mt-2 font-serif"
                style={{
                  color:
                    colors.archive
                      .grayLight,
                  fontSize:
                    '11px',
                  lineHeight:
                    1.45,
                }}
              >
                {
                  hypotheses.find(
                    (hyp) =>
                      hyp.id ===
                      focusedHypothesisId
                  )?.description
                }
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="absolute top-5 left-5 z-20 pointer-events-none"
        style={{
          color:
            microform.halogen,
          fontFamily:
            typography.mono,
          fontSize: '8px',
          letterSpacing:
            '0.12em',
          textShadow:
            microform.halogenText,
        }}
      >
        <div>
          REALITY CONSENSUS BOARD
        </div>
        <div
          className="mt-1"
          style={{
            color:
              colors.archive
                .grayLight,
            opacity: 0.55,
          }}
        >
          GEODETIC ATLAS // EVIDENCE RELATIONSHIP MATRIX
        </div>
      </div>

      <div
        className="absolute top-5 right-5 z-20 pointer-events-none"
        style={{
          color:
            colors.archive
              .grayLight,
          fontFamily:
            typography.mono,
          fontSize: '8px',
          textAlign:
            'right',
          opacity: 0.65,
        }}
      >
        <div>
          DUST INDEX: {status.dustIndex}
        </div>
        <div>
          STABILITY: {status.observerStability}
        </div>
      </div>

      <div
        className="absolute bottom-5 left-5 p-3 border font-mono text-[9px] tracking-wider pointer-events-auto modal-chassis"
        style={{
          color:
            colors.archive
              .grayLight,
          zIndex: 5,
        }}
      >
        <div
          style={{
            color:
              microform.halogen,
            fontWeight:
              'bold',
            marginBottom:
              '4px',
            textShadow:
              microform.halogenText,
          }}
        >
          REALITY CONSENSUS BOARD
        </div>

        <div className="opacity-60 space-y-0.5">
          <div>
            NODES PINNED:{' '}
            {visiblePlaces.length}{' '}
            UNIT(S)
          </div>

          <div>
            ACTIVE THREADS:{' '}
            {edges.length}{' '}
            CONNECTION(S)
          </div>

          <div>
            ACTIVE HYPOTHESES:{' '}
            {
              hypotheses.filter(
                (hyp) =>
                  !hyp.completed
              ).length
            }{' '}
            DISCOVERED
          </div>

          <div>
            CONSENSUS FAILURE WARNINGS:{' '}
            {
              hypotheses.filter(
                (hyp) =>
                  hyp.completed
              ).length
            }{' '}
            RECONSTRUCTED
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvidenceBoard;