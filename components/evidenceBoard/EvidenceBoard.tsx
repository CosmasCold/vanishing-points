'use client';

import React, { useMemo } from 'react';
import ReactFlow, { 
  Controls, 
  Background, 
  BackgroundVariant,
  Node,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useAtlasStore } from '@/state/atlasStore';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { useUIStore } from '@/state/uiStore';
import { BoardNode } from './BoardNode';
import { BoardEdge } from './BoardEdge';
import { colors } from '@/styles/theme';

const nodeTypes = {
  boardNode: BoardNode,
};

const edgeTypes = {
  boardEdge: BoardEdge,
};

export const EvidenceBoard: React.FC = () => {
  const { places } = useAtlasStore();
  const { status } = useUIStore();
  
  const { 
    playerEdges, 
    discoveredEdges, 
    nodePositions, 
    setNodePosition 
  } = useEvidenceBoardStore();

  // Create standard React Flow Node array from place models
  const flowNodes = useMemo<Node[]>(() => {
    return places.map((place, idx) => {
      // Look up generated coordinate maps, fallback to radial spiral if uninitialized
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
          status: place.status || 'verified',
          dangerLevel: place.dangerLevel || 0,
          category: place.category || 'unknown'
        }
      };
    });
  }, [places, nodePositions]);

  // Combine discovered and player edges
  const flowEdges = useMemo<Edge[]>(() => {
    const all = [...discoveredEdges, ...playerEdges];
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

  // Handle position dragging back to store
  const onNodeDragStop = (_event: React.MouseEvent, node: Node) => {
    setNodePosition(node.id, node.position);
  };

  return (
    <div 
      className="absolute inset-0 overflow-hidden" 
      style={{ 
        backgroundColor: colors.archive.black,
        backgroundImage: 'radial-gradient(ellipse at 50% 30%, rgba(255, 170, 85, 0.02) 0%, transparent 65%)'
      }}
    >
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeDragStop={onNodeDragStop}
        fitView
        minZoom={0.3}
        maxZoom={2.0}
      >
        <Controls 
          showInteractive={false}
          style={{ 
            display: 'flex',
            flexDirection: 'row',
            gap: '4px',
            backgroundColor: 'rgba(30, 30, 27, 0.9)',
            border: '1px solid rgba(107, 103, 94, 0.4)',
            padding: '4px',
            borderRadius: '2px'
          }} 
        />
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={24} 
          size={1} 
          color="#3a3833" 
        />
      </ReactFlow>
    </div>
  );
};
