'use client';

import React from 'react';
import { Place } from '@/types/places';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography } from '@/styles/theme';
import { X, AlertTriangle } from 'lucide-react';

interface CaseHeaderProps {
  place: Place;
  onClose: () => void;
  evidenceCount: number;
}

export const CaseHeader: React.FC<CaseHeaderProps> = ({ place, onClose, evidenceCount }) => {
  const { click } = useAudioStore();
  
  const statusColor = 
    place.status === 'sealed' ? colors.archive.red :
    place.status === 'whispered' ? colors.archive.blue :
    place.status === 'mirage' ? colors.archive.white :
    colors.archive.green;
  
  return (
    <div 
      className="flex items-center justify-between px-4 h-12 border-b shrink-0"
      style={{ borderColor: colors.archive.gray, backgroundColor: colors.archive.surfaceRaised }}
    >
      <div className="flex items-center gap-3">
        <span style={{ color: colors.archive.amber, fontFamily: typography.mono, fontSize: typography.sizes.sm, letterSpacing: '0.05em' }}>
          CASE FILE
        </span>
        <span style={{ color: colors.archive.white, fontFamily: typography.mono, fontSize: typography.sizes.sm }}>
          {place.name}
        </span>
        <span 
          className="px-2 py-0.5 text-xs border"
          style={{ color: statusColor, borderColor: statusColor, fontFamily: typography.mono }}
        >
          {place.status.toUpperCase()}
        </span>
        {place.dangerLevel >= 4 && (
          <AlertTriangle size={14} style={{ color: colors.archive.red }} />
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
          EVIDENCE: <span style={{ color: colors.archive.amber }}>{evidenceCount}</span>
        </span>
        <button
          onClick={() => { click(); onClose(); }}
          className="hover:opacity-70 transition-opacity"
          style={{ color: colors.archive.gray }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};