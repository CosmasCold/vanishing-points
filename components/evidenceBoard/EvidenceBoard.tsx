'use client';

import React, { useCallback } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { EvidenceNode } from './nodes/EvidenceNode';
import { PlaceNode } from './nodes/PlaceNode';
import { TheoryNode } from './nodes/TheoryNode';
import { colors } from '@/styles/theme';

const nodeTypes = {
  evidence: EvidenceNode,
  place: PlaceNode,
  theory: TheoryNode,
};

export const EvidenceBoard: React.FC = () => {
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    selectNode 
  } = useEvidenceBoardStore();

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: any) => {
    selectNode(node.id);
  }, [selectNode]);

  const handlePaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  return (
    <div className="w-full h-full" style={{ backgroundColor: colors.archive.black }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.2}
        maxZoom={2}
        style={{ backgroundColor: colors.archive.black }}
      >
        <Background
          color={colors.archive.gray}
          gap={24}
          size={1}
          style={{ opacity: 0.15 }}
        />
        <Controls
          style={{
            backgroundColor: colors.archive.surface,
            borderColor: colors.archive.gray,
            color: colors.archive.white,
          }}
          showInteractive={false}
        />
        <MiniMap
          style={{
            backgroundColor: colors.archive.surface,
            borderColor: colors.archive.gray,
            borderWidth: 1,
            borderStyle: 'solid',
          }}
          nodeColor={(node) => {
            if (node.type === 'place') {
              const status = node.data?.status;
              if (status === 'sealed') return colors.archive.red;
              if (status === 'whispered') return colors.archive.blue;
              return colors.archive.green;
            }
            if (node.type === 'theory') return colors.archive.amber;
            return colors.archive.white;
          }}
          maskColor="rgba(26, 26, 24, 0.7)"
        />
      </ReactFlow>
    </div>
  );
};