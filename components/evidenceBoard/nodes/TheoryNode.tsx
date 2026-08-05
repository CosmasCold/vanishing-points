'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';
import { BoardNodeData } from '@/types/evidenceBoard';
import { colors, typography } from '@/styles/theme';
import { Lightbulb } from 'lucide-react';

export const TheoryNode: React.FC<{ data: BoardNodeData }> = ({ data }) => {
  return (
    <div 
      className="px-3 py-2 border min-w-[150px] max-w-[200px]"
      style={{ 
        borderColor: colors.archive.amber, 
        backgroundColor: 'rgba(184, 149, 106, 0.08)',
        boxShadow: `0 0 10px rgba(184, 149, 106, 0.15)`,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: colors.archive.amber, width: 6, height: 6 }} />
      
      <div className="flex items-center gap-1.5 mb-1">
        <Lightbulb size={10} style={{ color: colors.archive.amber }} />
        <span style={{ color: colors.archive.amber, fontSize: '0.6rem', fontFamily: typography.mono }}>
          THEORY
        </span>
      </div>
      
      <div 
        style={{ 
          color: colors.archive.white, 
          fontSize: typography.sizes.sm, 
          fontStyle: 'italic',
          lineHeight: '1.4' 
        }}
      >
        {data.label}
      </div>
      
      <Handle type="source" position={Position.Bottom} style={{ background: colors.archive.amber, width: 6, height: 6 }} />
      <Handle type="source" position={Position.Left} style={{ background: colors.archive.amber, width: 6, height: 6 }} />
      <Handle type="source" position={Position.Right} style={{ background: colors.archive.amber, width: 6, height: 6 }} />
    </div>
  );
};