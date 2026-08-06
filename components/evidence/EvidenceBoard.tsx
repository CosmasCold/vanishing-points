'use client';

import React, { useEffect, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { useAtlasStore } from '@/state/atlasStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useAudioStore } from '@/state/audioStore';
import { useUIStore } from '@/state/uiStore';
import { BoardNode } from './BoardNode';
import { BoardEdge } from './BoardEdge';
import { colors, typography, spacing } from '@/styles/theme';

const nodeTypes = { boardNode: BoardNode };
const edgeTypes = { boardEdge: BoardEdge };

export const EvidenceBoard: React.FC = () => {
  const { places } = useAtlasStore();
  const { click } = useAudioStore();
  const { terminalOpen } = useUIStore();
  const {
    discoveredEdges,
    playerEdges,
    selectedNodeId,
    selectNode,
    addPlayerEdge,
    discoverEdge,
  } = useEvidenceBoardStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Seed nodes from places
  useEffect(() => {
    const boardNodes: Node[] = places.map((place, index) => {
      const angle = (index / places.length) * Math.PI * 2;
      const radius = 300 + (place.dangerLevel * 50);
      return {
        id: place.slug,
        type: 'boardNode',
        position: {
          x: 500 + Math.cos(angle) * radius,
          y: 400 + Math.sin(angle) * radius,
        },
        data: {
          label: place.name,
          status: place.status,
          dangerLevel: place.dangerLevel,
          category: place.category,
        },
      };
    });
    setNodes(boardNodes);
  }, [places, setNodes]);

  // Seed edges from connectedTo
  useEffect(() => {
    places.forEach((place) => {
      place.connectedTo.forEach((targetSlug) => {
        const edgeId = `${place.slug}-${targetSlug}`;
        discoverEdge({
          id: edgeId,
          source: place.slug,
          target: targetSlug,
          type: 'confirmed',
        });
      });
    });
  }, [places, discoverEdge]);

  // Sync edges to React Flow
  useEffect(() => {
    const allEdges: Edge[] = [...discoveredEdges, ...playerEdges].map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'boardEdge',
      data: { type: e.type, label: e.label },
      animated: e.type === 'unstable',
    }));
    setEdges(allEdges);
  }, [discoveredEdges, playerEdges, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      click();
      if (connection.source && connection.target) {
        const edgeId = `player-${connection.source}-${connection.target}`;
        addPlayerEdge({
          id: edgeId,
          source: connection.source,
          target: connection.target,
          type: 'suspected',
          label: 'SUSPECTED',
        });
        setEdges((eds) => addEdge(connection, eds));
      }
    },
    [click, addPlayerEdge, setEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const selectedPlace = places.find((p) => p.slug === selectedNodeId);

  return (
    <div
      className="fixed inset-0 z-10 flex"
      style={{
        marginLeft: spacing.rail,
        marginBottom: terminalOpen
          ? `calc(${spacing.statusBar} + ${spacing.terminalHeight})`
          : spacing.statusBar,
        backgroundColor: colors.archive.black,
      }}
    >
      {/* Main graph canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          attributionPosition="bottom-right"
          style={{ background: colors.archive.black }}
        >
          <Background color={colors.archive.gray} gap={20} size={1} />
          <Controls
            style={{
              backgroundColor: colors.archive.surface,
              borderColor: colors.archive.gray,
            }}
          />
          <MiniMap
            nodeColor={(node) =>
              node.data?.status === 'sealed' ? colors.archive.red :
              node.data?.status === 'whispered' ? colors.archive.blue :
              node.data?.status === 'mirage' ? colors.archive.white :
              colors.archive.green
            }
            maskColor="rgba(26, 26, 24, 0.8)"
            style={{
              backgroundColor: colors.archive.surface,
              border: `1px solid ${colors.archive.gray}`,
            }}
          />
        </ReactFlow>

        {/* Header overlay */}
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 h-10 border-b pointer-events-none"
          style={{ borderColor: colors.archive.gray, backgroundColor: 'rgba(42, 42, 38, 0.9)' }}
        >
          <span style={{ color: colors.archive.amber, fontFamily: typography.mono, fontSize: typography.sizes.xs, letterSpacing: '0.05em' }}>
            EVIDENCE BOARD
          </span>
          <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
            {places.length} NODES • {discoveredEdges.length + playerEdges.length} CONNECTIONS
          </span>
        </div>
      </div>

      {/* Detail sidebar */}
      {selectedPlace && (
        <div
          className="w-80 border-l overflow-y-auto p-4"
          style={{ borderColor: colors.archive.gray, backgroundColor: colors.archive.surfaceRaised }}
        >
          <button
            onClick={() => selectNode(null)}
            className="mb-3 text-left hover:opacity-70 transition-opacity"
            style={{ color: colors.archive.gray, fontSize: typography.sizes.xs, fontFamily: typography.mono }}
          >
            ← DESELECT
          </button>

          <div style={{ color: colors.archive.white, fontSize: typography.sizes.lg, fontWeight: typography.weights.medium }}>
            {selectedPlace.name}
          </div>
          <div style={{ color: colors.archive.gray, fontSize: typography.sizes.xs, fontFamily: typography.mono, marginTop: '0.25rem' }}>
            {selectedPlace.address.country} • {selectedPlace.status.toUpperCase()}
          </div>

          <div className="mt-4 space-y-2">
            <div style={{ color: colors.archive.amber, fontSize: typography.sizes.xs, fontFamily: typography.mono, letterSpacing: '0.05em' }}>
              CONFIRMED CONNECTIONS
            </div>
            {selectedPlace.connectedTo.length === 0 ? (
              <div style={{ color: colors.archive.gray, fontSize: typography.sizes.xs }}>None recorded</div>
            ) : (
              selectedPlace.connectedTo.map((slug) => {
                const target = places.find((p) => p.slug === slug);
                return (
                  <button
                    key={slug}
                    onClick={() => selectNode(slug)}
                    className="block w-full text-left p-2 border transition-colors hover:border-amber-700"
                    style={{ borderColor: colors.archive.gray, color: colors.archive.white, fontSize: typography.sizes.xs, fontFamily: typography.mono }}
                  >
                    {target ? target.name : `[${slug}]`}
                  </button>
                );
              })
            )}
          </div>

          <button
            onClick={() => {
              click();
              useInvestigationStore.getState().openInvestigation(selectedPlace.slug, selectedPlace.name);
            }}
            className="w-full mt-4 py-2 border transition-colors hover:border-amber-700"
            style={{ borderColor: colors.archive.amber, color: colors.archive.amber, fontFamily: typography.mono, fontSize: typography.sizes.sm }}
          >
            OPEN INVESTIGATION
          </button>
        </div>
      )}
    </div>
  );
};