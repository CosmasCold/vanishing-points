'use client';

import React from 'react';
import { EdgeProps, getBezierPath } from '@xyflow/react';
import { colors } from '@/styles/theme';

export const BoardEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Physically driven visual palette
  const threadColor = React.useMemo(() => {
    if (data?.type === 'confirmed') {
      return colors.archive.red; // Heavy Crimson Thread for verified connections [26]
    }
    if (data?.type === 'unstable') {
      return colors.archive.blue; // Blue glowing resonance line [23]
    }
    return colors.archive.amber; // Frayed wool string for player suspected routes [26]
  }, [data?.type]);

  const strokeDasharray = data?.type === 'unstable' ? '4,4' : undefined;

  return (
    <>
      {/* Visual Shadow Layer beneath the thread to imply distance from board */}
      <path
        id={`${id}-shadow`}
        style={{
          stroke: 'rgba(5, 4, 3, 0.5)',
          strokeWidth: 2.5,
          fill: 'none',
        }}
        className="react-flow__edge-path pointer-events-none"
        d={edgePath}
        transform="translate(1.5, 3)"
      />

      {/* Main Tactile Stretched Yarn Edge */}
      <path
        id={id}
        style={{
          stroke: threadColor,
          strokeWidth: data?.type === 'confirmed' ? 1.8 : 1.2,
          strokeDasharray,
          fill: 'none',
          opacity: 0.8,
          transition: 'stroke 0.3s ease',
        }}
        className="react-flow__edge-path cursor-pointer hover:opacity-100"
        d={edgePath}
        markerEnd={markerEnd}
      />

      {/* Thread labels styled as hand-labeled metal tag tags */}
      {data?.label && (
        <edgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${(sourceX + targetX) / 2}px, ${(sourceY + targetY) / 2}px)`,
              background: '#141211',
              border: '1px solid #2a2824',
              padding: '2px 5px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '8px',
              color: colors.archive.grayLight,
              pointerEvents: 'all',
            }}
            className="nodrag nopan rounded-[1px] tracking-widest uppercase"
          >
            {data.label}
          </div>
        </edgeLabelRenderer>
      )}
    </>
  );
};