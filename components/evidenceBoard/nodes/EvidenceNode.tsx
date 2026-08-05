'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';
import { BoardNodeData } from '@/types/evidenceBoard';
import { colors, typography } from '@/styles/theme';
import { FileText, Image, Mic, Video, Box, User, Radio } from 'lucide-react';

const typeIcons: Record<string, React.ElementType> = {
  photo: Image,
  document: FileText,
  audio: Mic,
  video: Video,
  physical: Box,
  witness: User,
  signal: Radio,
};

export const EvidenceNode: React.FC<{ data: BoardNodeData }> = ({ data }) => {
  const statusColor = 
    data.status === 'locked' ? colors.archive.gray :
    data.status === 'analyzing' ? colors.archive.blue :
    data.status === 'analyzed' ? colors.archive.green :
    colors.archive.amber;

  return (
    <div 
      className="px-3 py-2 border min-w-[150px] max-w-[220px]"
      style={{ 
        borderColor: statusColor, 
        backgroundColor: colors.archive.surface,
        boxShadow: `0 0 10px ${statusColor}20`,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: statusColor, width: 6, height: 6 }} />
      
      <div className="flex items-center gap-1.5 mb-1">
        <span style={{ color: statusColor, fontSize: '0.6rem', fontFamily: typography.mono }}>
          EVIDENCE
        </span>
      </div>
      
      <div style={{ color: colors.archive.white, fontSize: typography.sizes.sm, lineHeight: '1.3' }}>
        {data.label}
      </div>
      
      {data.description && (
        <div style={{ color: colors.archive.grayLight, fontSize: typography.sizes.xs, marginTop: '0.25rem', lineHeight: '1.3' }}>
          {data.description.substring(0, 50)}{data.description.length > 50 ? '...' : ''}
        </div>
      )}
      
      {data.mediaUrl && (
        <div 
          className="mt-1.5 px-1.5 py-0.5 inline-block border"
          style={{ borderColor: colors.archive.blue, color: colors.archive.blue, fontSize: '0.6rem', fontFamily: typography.mono }}
        >
          [BUNKER_7 TRANSMISSION]
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} style={{ background: statusColor, width: 6, height: 6 }} />
      <Handle type="source" position={Position.Left} style={{ background: statusColor, width: 6, height: 6 }} />
      <Handle type="source" position={Position.Right} style={{ background: statusColor, width: 6, height: 6 }} />
    </div>
  );
};