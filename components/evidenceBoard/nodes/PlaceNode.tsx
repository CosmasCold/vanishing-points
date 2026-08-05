'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';
import { BoardNodeData } from '@/types/evidenceBoard';
import { colors, typography } from '@/styles/theme';
import { MapPin } from 'lucide-react';

export const PlaceNode: React.FC<{ data: BoardNodeData }> = ({ data }) => {
  const statusColor = 
    data.status === 'sealed' ? colors.archive.red :
    data.status === 'whispered' ? colors.archive.blue :
    data.status === 'mirage' ? colors.archive.white :
    data.status === 'unknown' ? colors.archive.gray :
    colors.archive.green;

  return (
    <div 
      className="px-4 py-3 border min-w-[170px]"
      style={{ 
        borderColor: statusColor, 
        backgroundColor: colors.archive.surfaceRaised,
        boxShadow: `0 0 15px ${statusColor}25`,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: statusColor, width: 8, height: 8 }} />
      <Handle type="target" position={Position.Left} style={{ background: statusColor, width: 8, height: 8 }} />
      <Handle type="target" position={Position.Right} style={{ background: statusColor, width: 8, height: 8 }} />
      
      <div className="flex items-center gap-2 mb-1">
        <MapPin size={12} style={{ color: statusColor }} />
        <span style={{ color: statusColor, fontSize: '0.6rem', fontFamily: typography.mono, letterSpacing: '0.05em' }}>
          {data.status?.toUpperCase() || 'UNKNOWN'}
        </span>
      </div>
      
      <div style={{ color: colors.archive.white, fontSize: typography.sizes.base, fontWeight: typography.weights.medium, lineHeight: '1.3' }}>
        {data.label}
      </div>
      
      {data.description && (
        <div style={{ color: colors.archive.gray, fontSize: typography.sizes.xs, marginTop: '0.25rem' }}>
          {data.description}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} style={{ background: statusColor, width: 8, height: 8 }} />
    </div>
  );
};