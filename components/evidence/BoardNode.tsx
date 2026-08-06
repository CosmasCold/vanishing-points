'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography } from '@/styles/theme';

interface BoardNodeProps {
  id: string;
  data: {
    label: string;
    status: string;
    dangerLevel: number;
    category: string;
  };
}

export const BoardNode: React.FC<BoardNodeProps> = ({ id, data }) => {
  const { selectedNodeId, selectNode } = useEvidenceBoardStore();
  const { openInvestigation } = useInvestigationStore();
  const { click } = useAudioStore();
  const isSelected = selectedNodeId === id;

  const statusColor =
    data.status === 'sealed' ? colors.archive.red :
    data.status === 'whispered' ? colors.archive.blue :
    data.status === 'mirage' ? colors.archive.white :
    colors.archive.green;

  const handleClick = () => {
    click();
    selectNode(id);
  };

  const handleDoubleClick = () => {
    click();
    openInvestigation(id, data.label);
  };

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className="relative px-3 py-2 border transition-all cursor-pointer"
      style={{
        borderColor: isSelected ? colors.archive.amber : statusColor,
        backgroundColor: isSelected ? 'rgba(184, 149, 106, 0.1)' : colors.archive.surface,
        minWidth: '140px',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      
      <div className="flex items-center justify-between gap-2">
        <span
          style={{
            color: colors.archive.white,
            fontFamily: typography.mono,
            fontSize: typography.sizes.xs,
            fontWeight: typography.weights.medium,
          }}
        >
          {data.label}
        </span>
        <span
          style={{
            color: statusColor,
            fontFamily: typography.mono,
            fontSize: '0.625rem',
          }}
        >
          {data.status.toUpperCase()}
        </span>
      </div>
      
      <div
        className="flex justify-between mt-1"
        style={{
          color: colors.archive.gray,
          fontFamily: typography.mono,
          fontSize: '0.625rem',
        }}
      >
        <span>{data.category.toUpperCase()}</span>
        <span style={{ color: data.dangerLevel >= 4 ? colors.archive.red : colors.archive.amber }}>
          D{data.dangerLevel}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
};