'use client';

import React, { useMemo, useCallback } from 'react';
// 1. Explicitly import flow types to override native browser DOM types
import { 
  ReactFlow, 
  Controls, 
  Background, 
  BackgroundVariant,
  Node,
  Edge,
  Connection
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// 2. State & hook imports
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { useAtlasStore } from '@/state/atlasStore';
import { useUIStore, BUNKER7_THRESHOLDS } from '@/state/uiStore';
import { useAudioStore } from '@/state/audioStore';
import { useResonanceTriangulation } from '@/hooks/useResonanceTriangulation'; 

// 3. Subcomponent & styling imports
import { BoardNode } from './BoardNode';
import { BoardEdge } from './BoardEdge';
import { colors } from '@/styles/theme';

const nodeTypes = { boardNode: BoardNode };
const edgeTypes = { boardEdge: BoardEdge };

export const EvidenceBoard: React.FC = () => {
  // Initialize the resonance triangulation listener
  useResonanceTriangulation();

  const { places } = useAtlasStore();
  const { status } = useUIStore();
  const { play, click } = useAudioStore();
  const { 
    playerEdges, 
    discoveredEdges, 
    nodePositions, 
    setNodePosition,
    addPlayerEdge
  } = useEvidenceBoardStore();

  const dustIndex = status.dustIndex;

  // Convert places to custom Polaroid or Index Card Nodes
  const flowNodes = useMemo<Node[]>(() => {
    return places.map((place, idx) => {
      const pos = nodePositions[place.slug] || { 
        x: 600 + Math.sin(idx * 0.5) * (180 + idx * 24), 
        y: 400 + Math.cos(idx * 0.5) * (180 + idx * 24) 
      };
      
      return {
        id: place.slug,
        type: 'boardNode',
        position: pos,
        data: { 
          label: place.name, 
          status: place.status, 
          dangerLevel: place.dangerLevel, 
          category: place.category 
        },
      };
    });
  }, [places, nodePositions]);

  // Merge verified and suspected strings/threads
  const flowEdges = useMemo<Edge[]>(() => {
    const all = [
      ...discoveredEdges.map(e => ({ ...e, type: 'confirmed' as const })),
      ...playerEdges.map(e => ({ ...e, type: 'suspected' as const }))
    ];

    return all.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'boardEdge',
      data: { 
        type: edge.type, 
        label: edge.label 
      }
    }));
  }, [discoveredEdges, playerEdges]);

  // Commit dragged positions back to Zustand safely across mouse and touch inputs
  const onNodeDragStop = (_event: any, node: Node) => {
    setNodePosition(node.id, node.position);
    if (Math.random() > 0.7) {
      play('type'); // Tactile cardboard friction audio cue
    }
  };

  // Stretched string connect mechanic
  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    
    const newEdge: any = {
      id: `edge-${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target,
      type: 'suspected',
      label: 'Suspected Link'
    };

    play('tape'); // Play physical tape noise
    addPlayerEdge(newEdge);
  }, [addPlayerEdge, play]);

  const showOpticsGlitch = dustIndex >= BUNKER7_THRESHOLDS.UNSTABLE;

  return (
    <div 
      className="absolute inset-0 overflow-hidden select-none"
      style={{ 
        backgroundColor: colors.archive.black,
        // High density visual corkboard texturing with desk lamp vignette overlay
        backgroundImage: `
          radial-gradient(ellipse at 30% 20%, rgba(255, 170, 85, 0.08) 0%, transparent 60%),
          radial-gradient(circle at center, transparent 30%, rgba(10, 8, 6, 0.85) 100%),
          url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='cork'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23cork)' opacity='0.08'/%3E%3C/svg%3E")
        `
      }}
    >
      {/* Decorative Brass Bezels & System Labels */}
      <div className="absolute top-4 left-4 z-10 p-3 border font-mono text-xs tracking-wider"
           style={{ borderColor: colors.archive.grayDark, backgroundColor: 'rgba(20, 18, 16, 0.9)' }}>
        <div style={{ color: colors.archive.amber }}>CASE MATRIX SYNC: SECURE</div>
        <div className="text-[10px] mt-1" style={{ color: colors.archive.gray }}>
          DUST COMPRESSION RATIO: {(dustIndex / 1.5).toFixed(1)}%
        </div>
      </div>

      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        fitView
        minZoom={0.25}
        maxZoom={1.5}
        className={showOpticsGlitch ? 'animate-pulse' : ''}
      >
        <Controls 
          showInteractive={false} 
          style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            gap: '6px', 
            backgroundColor: 'rgba(22, 20, 18, 0.95)', 
            border: `1px solid ${colors.archive.grayDark}`, 
            padding: '5px', 
            borderRadius: '1px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }} 
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={32}
          size={1.2}
          color="#2d2a24"
        />
      </ReactFlow>
    </div>
  );
};

export default EvidenceBoard;