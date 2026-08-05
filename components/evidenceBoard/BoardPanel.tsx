'use client';

import React, { useState } from 'react';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useAtlasStore } from '@/state/atlasStore';
import { colors, typography } from '@/styles/theme';
import { Plus, Trash2, Download } from 'lucide-react';

export const BoardPanel: React.FC = () => {
  const { nodes, edges, selectedNodeId, removeNode, clearBoard, addNode } = useEvidenceBoardStore();
  const { activeInvestigationId, evidence } = useInvestigationStore();
  const { places } = useAtlasStore();
  const [theoryText, setTheoryText] = useState('');

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const handleAddTheory = () => {
    if (!theoryText.trim()) return;
    addNode({
      id: `theory-${Date.now()}`,
      type: 'theory',
      position: { x: 380 + Math.random() * 100, y: 280 + Math.random() * 100 },
      data: {
        label: theoryText,
        type: 'theory',
        createdAt: new Date().toISOString(),
      },
    });
    setTheoryText('');
  };

  const handlePopulate = () => {
    if (!activeInvestigationId) return;
    const place = places.find((p) => p.slug === activeInvestigationId);
    const invEvidence = evidence[activeInvestigationId] || [];
    if (place) {
      useEvidenceBoardStore.getState().populateFromInvestigation(activeInvestigationId, invEvidence, place);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div style={{ color: colors.archive.amber, fontSize: typography.sizes.xs, fontFamily: typography.mono, letterSpacing: '0.05em', marginBottom: '1rem' }}>
        EVIDENCE BOARD
      </div>

      {activeInvestigationId && (
        <button
          onClick={handlePopulate}
          className="w-full py-2 mb-3 border transition-colors hover:border-green-700 flex items-center justify-center gap-2"
          style={{ borderColor: colors.archive.green, color: colors.archive.green, fontFamily: typography.mono, fontSize: typography.sizes.xs }}
        >
          <Download size={12} />
          IMPORT CASE EVIDENCE
        </button>
      )}

      <div className="mb-4">
        <div style={{ color: colors.archive.grayLight, fontSize: typography.sizes.xs, fontFamily: typography.mono, marginBottom: '0.5rem' }}>
          ADD THEORY NODE
        </div>
        <div className="flex gap-1">
          <input
            type="text"
            value={theoryText}
            onChange={(e) => setTheoryText(e.target.value)}
            className="flex-1 px-2 py-1.5 border bg-transparent outline-none"
            style={{ borderColor: colors.archive.gray, color: colors.archive.white, fontFamily: typography.mono, fontSize: typography.sizes.xs }}
            placeholder="Hypothesis..."
            onKeyDown={(e) => e.key === 'Enter' && handleAddTheory()}
          />
          <button
            onClick={handleAddTheory}
            className="px-2 py-1 border transition-colors hover:border-amber-700"
            style={{ borderColor: colors.archive.amber, color: colors.archive.amber }}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        <div className="flex justify-between items-baseline" style={{ fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
          <span style={{ color: colors.archive.gray }}>NODES</span>
          <span style={{ color: colors.archive.amber }}>{nodes.length}</span>
        </div>
        <div className="flex justify-between items-baseline" style={{ fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
          <span style={{ color: colors.archive.gray }}>CONNECTIONS</span>
          <span style={{ color: colors.archive.amber }}>{edges.length}</span>
        </div>

        {selectedNode && (
          <div className="mt-4 p-3 border" style={{ borderColor: colors.archive.blue, backgroundColor: 'rgba(106, 122, 138, 0.05)' }}>
            <div style={{ color: colors.archive.blue, fontSize: typography.sizes.xs, fontFamily: typography.mono, letterSpacing: '0.05em' }}>
              SELECTED NODE
            </div>
            <div style={{ color: colors.archive.white, fontSize: typography.sizes.sm, marginTop: '0.25rem' }}>
              {selectedNode.data?.label}
            </div>
            <div style={{ color: colors.archive.gray, fontSize: typography.sizes.xs, marginTop: '0.25rem', fontFamily: typography.mono }}>
              {selectedNode.data?.type?.toUpperCase()}
            </div>
            <button
              onClick={() => selectedNodeId && removeNode(selectedNodeId)}
              className="mt-3 flex items-center gap-1.5 hover:opacity-70 transition-opacity"
              style={{ color: colors.archive.red, fontSize: typography.sizes.xs, fontFamily: typography.mono }}
            >
              <Trash2 size={12} /> REMOVE NODE
            </button>
          </div>
        )}

        {nodes.length === 0 && (
          <div className="mt-8 text-center" style={{ fontFamily: typography.mono }}>
            <div style={{ color: colors.archive.gray, fontSize: typography.sizes.xs }}>
              BOARD EMPTY
            </div>
            <div style={{ color: colors.archive.grayLight, fontSize: typography.sizes.xs, marginTop: '0.5rem' }}>
              Import a case or add a theory to begin
            </div>
          </div>
        )}
      </div>

      {nodes.length > 0 && (
        <button
          onClick={clearBoard}
          className="mt-3 py-2 border transition-colors hover:border-red-700"
          style={{ borderColor: colors.archive.red, color: colors.archive.red, fontFamily: typography.mono, fontSize: typography.sizes.xs }}
        >
          CLEAR BOARD
        </button>
      )}
    </div>
  );
};