'use client';

import React, { useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useProgressionStore } from '@/state/progressionStore';
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

export const BoardNode = React.memo(
  ({ id, data }: BoardNodeProps) => {
    /*
     * IMPORTANT:
     * Subscribe only to the individual values this node actually uses.
     * Subscribing to the complete Zustand stores causes every board node
     * to rerender whenever unrelated application state changes.
     */

    const selectedNodeId = useEvidenceBoardStore(
      (state) => state.selectedNodeId
    );

    const selectNode = useEvidenceBoardStore(
      (state) => state.selectNode
    );

    const openInvestigation = useInvestigationStore(
      (state) => state.openInvestigation
    );

    const click = useAudioStore(
      (state) => state.click
    );

    const play = useAudioStore(
      (state) => state.play
    );

    const dustIndex = useProgressionStore(
      (state) => state.dustIndex
    );

    const isSelected = selectedNodeId === id;

    /*
     * Visual categorization colors.
     * Memoized because status is stable for a given node.
     */
    const statusColor = useMemo(() => {
      switch (data.status) {
        case 'sealed':
          return colors.archive.red;

        case 'whispered':
          return colors.archive.blue;

        case 'mirage':
          return '#8a6000';

        default:
          return colors.archive.green;
      }
    }, [data.status]);

    /*
     * Procedural physical tilt.
     * Deterministic from the node ID, so it never changes between renders.
     */
    const seedRotation = useMemo(() => {
      const hash = id
        .split('')
        .reduce(
          (acc, char) => acc + char.charCodeAt(0),
          0
        );

      return (hash % 6) - 3;
    }, [id]);

    const isMirageLocked =
      data.status === 'mirage' &&
      dustIndex < 40;

    const handleSelect = (
      e: React.MouseEvent
    ) => {
      e.stopPropagation();

      click();
      selectNode(id);
    };

    const handleDoubleClick = (
      e: React.MouseEvent
    ) => {
      e.stopPropagation();

      play('return');

      openInvestigation(
        id,
        data.label
      );
    };

    return (
      <div
        onClick={handleSelect}
        onDoubleClick={handleDoubleClick}
        className="group relative select-none rounded-[1px] transition-all duration-300"
        style={{
          transform: `rotate(${seedRotation}deg)`,
          filter: isMirageLocked
            ? 'blur(2px) grayscale(100%)'
            : 'none',
          opacity: isMirageLocked
            ? 0.35
            : 1,
        }}
      >
        {/* 3D Cast Shadow */}
        <div
          className="absolute inset-0 z-[-1] translate-x-1.5 translate-y-2 pointer-events-none transition-transform duration-200 group-hover:translate-x-2 group-hover:translate-y-3"
          style={{
            backgroundColor:
              'rgba(5, 4, 3, 0.65)',
            filter: 'blur(3px)',
          }}
        />

        {/* Tactile Pin */}
        <div
          className="absolute top-[-10px] left-1/2 z-20 -translate-x-1/2 h-4 w-4 pointer-events-none flex items-center justify-center"
          style={{
            filter:
              'drop-shadow(1px 2px 2px rgba(0,0,0,0.6))',
          }}
        >
          <div className="absolute top-[8px] h-3 w-[1.5px] bg-[#666666]" />

          <div
            className="h-3 w-3 rounded-full border-t border-l border-white/20"
            style={{
              backgroundColor: isSelected
                ? colors.archive.red
                : '#c5954a',
              backgroundImage:
                'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.4) 0%, transparent 70%)',
            }}
          />
        </div>

        {/* Physical Paper Board Card */}
        <div
          className="border px-4 py-3 min-w-[170px]"
          style={{
            borderColor: isSelected
              ? colors.archive.amber
              : colors.archive.grayDark,

            backgroundColor: isSelected
              ? '#1e1c18'
              : '#141311',

            boxShadow: isSelected
              ? '0 0 16px rgba(201, 169, 110, 0.15)'
              : 'none',
          }}
        >
          {/* Document Header */}
          <div className="flex justify-between items-baseline mb-2 font-mono text-[9px] tracking-widest text-[#5a564e]">
            <span>
              INDEX //{' '}
              {id
                .toUpperCase()
                .slice(0, 8)}
            </span>

            <span
              style={{
                color: statusColor,
              }}
            >
              ●
            </span>
          </div>

          {/* Location Name */}
          <div
            className="font-mono text-xs font-semibold leading-relaxed tracking-wide text-[#d4cbb8]"
            style={{
              fontFamily: typography.mono,
            }}
          >
            {isMirageLocked
              ? '██████████'
              : data.label}
          </div>

          {/* Metrics */}
          <div
            className="mt-3 pt-2 border-t flex items-center justify-between font-mono text-[9px]"
            style={{
              borderColor: '#211f1c',
            }}
          >
            <span
              style={{
                color: colors.archive.gray,
              }}
            >
              {data.category.toUpperCase()}
            </span>

            <span
              style={{
                color: colors.archive.amber,
              }}
            >
              {'★'.repeat(
                data.dangerLevel
              )}
            </span>
          </div>
        </div>

        {/* React Flow Handles */}
        <Handle
          type="target"
          position={Position.Top}
          className="opacity-0 w-full h-full"
          style={{
            pointerEvents: 'none',
          }}
        />

        <Handle
          type="source"
          position={Position.Bottom}
          className="opacity-0 w-full h-full"
          style={{
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  }
);

BoardNode.displayName = 'BoardNode';

