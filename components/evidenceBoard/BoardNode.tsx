'use client';

import React, { useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useUIStore, BUNKER7_THRESHOLDS } from '@/state/uiStore';
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
  const { click, play } = useAudioStore();
  const { status } = useUIStore();

  const isSelected = selectedNodeId === id;
  const dustIndex = status.dustIndex;

  // Visual categorization colors matching the Archive philosophy [23]
  const statusColor = useMemo(() => {
    switch (data.status) {
      case 'sealed': return colors.archive.red;
      case 'whispered': return colors.archive.blue;
      case 'mirage': return '#8a6000'; // Amber Glow
      default: return colors.archive.green;
    }
  }, [data.status]);

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    click();
    selectNode(id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Heavy analog lever pull audio [24]
    play('return'); 
    openInvestigation(id, data.label);
  };

  // Procedural physical tilt so the board feels human, not programmatic [25]
  const seedRotation = useMemo(() => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 6) - 3; // Tilt between -3 and +3 degrees
  }, [id]);

  const isMirageLocked = data.status === 'mirage' && dustIndex < 40;

  return (
    <div 
      onClick={handleSelect}
      onDoubleClick={handleDoubleClick}
      className="group relative select-none rounded-[1px] transition-all duration-300"
      style={{
        transform: `rotate(${seedRotation}deg)`,
        filter: isMirageLocked ? 'blur(2px) grayscale(100%)' : 'none',
        opacity: isMirageLocked ? 0.35 : 1,
      }}
    >
      {/* 3D Cast Shadow Shadow Layer */}
      <div 
        className="absolute inset-0 z-[-1] translate-x-1.5 translate-y-2 pointer-events-none transition-transform duration-200 group-hover:translate-x-2 group-hover:translate-y-3"
        style={{
          backgroundColor: 'rgba(5, 4, 3, 0.65)',
          filter: 'blur(3px)',
        }}
      />

      {/* Tactile Pin Component at the top boundary */}
      <div 
        className="absolute top-[-10px] left-1/2 z-20 -translate-x-1/2 h-4 w-4 pointer-events-none flex items-center justify-center"
        style={{
          filter: 'drop-shadow(1px 2px 2px rgba(0,0,0,0.6))'
        }}
      >
        {/* Needle point */}
        <div className="absolute top-[8px] h-3 w-[1.5px] bg-[#666666]" />
        {/* Brass pushpin cap */}
        <div 
          className="h-3 w-3 rounded-full border-t border-l border-white/20"
          style={{ 
            backgroundColor: isSelected ? colors.archive.red : '#c5954a',
            backgroundImage: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.4) 0%, transparent 70%)'
          }} 
        />
      </div>

      {/* The Physical Paper Board Card */}
      <div 
        className="border px-4 py-3 min-w-[170px]"
        style={{
          borderColor: isSelected ? colors.archive.amber : colors.archive.grayDark,
          backgroundColor: isSelected ? '#1e1c18' : '#141311', // Heavy aged canvas vellum
          boxShadow: isSelected ? '0 0 16px rgba(201, 169, 110, 0.15)' : 'none',
        }}
      >
        {/* Document Header Metadata */}
        <div className="flex justify-between items-baseline mb-2 font-mono text-[9px] tracking-widest text-[#5a564e]">
          <span>INDEX // {id.toUpperCase().slice(0, 8)}</span>
          <span style={{ color: statusColor }}>●</span>
        </div>

        {/* Typed Location Name */}
        <div 
          className="font-mono text-xs font-semibold leading-relaxed tracking-wide text-[#d4cbb8]"
          style={{ fontFamily: typography.mono }}
        >
          {isMirageLocked ? '██████████' : data.label}
        </div>

        {/* Tactical Metrics Footing */}
        <div className="mt-3 pt-2 border-t flex items-center justify-between font-mono text-[9px]"
             style={{ borderColor: '#211f1c' }}>
          <span style={{ color: colors.archive.gray }}>
            {data.category.toUpperCase()}
          </span>
          <span style={{ color: colors.archive.amber }}>
            {'★'.repeat(data.dangerLevel)}
          </span>
        </div>
      </div>

      {/* React Flow Handles - hidden but fully operational */}
      <Handle type="target" position={Position.Top} className="opacity-0 w-full h-full" style={{ pointerEvents: 'none' }} />
      <Handle type="source" position={Position.Bottom} className="opacity-0 w-full h-full" style={{ pointerEvents: 'none' }} />
    </div>
  );
};