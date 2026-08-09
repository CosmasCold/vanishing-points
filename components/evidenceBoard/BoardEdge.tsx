'use client';

import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
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

  // Physically driven visual palette of threads on the felt board
  const threadColor = React.useMemo(() => {
    if (data?.type === 'confirmed') {
      return colors.archive.red; // Crimson string for verified connections
    }
    if (data?.type === 'unstable') {
      return colors.archive.blue; // Ghostly blue line under UV/Grounding states
    }
    return colors.archive.amber; // Frayed amber string for suspected connections
  }, [data?.type]);

  const strokeDasharray = data?.type === 'unstable' ? '4,4' : undefined;

  return (
    <>
      {/* Visual Shadow Layer beneath the thread to imply depth against the corkboard */}
      <path
        id={`${id}-shadow`}
        style={{
          stroke: 'rgba(5, 4, 3, 0.45)',
          strokeWidth: data?.type === 'confirmed' ? 2.8 : 2.0,
          fill: 'none',
        }}
        className="react-flow__edge-path pointer-events-none"
        d={edgePath}
        transform="translate(1.5, 3)"
      />

      {/* Main Tactile Stretched Yarn/String Edge */}
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

      {/* Hand-labeled paper tag attached to the thread */}
      {data?.label && typeof data.label === 'string' && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${(sourceX + targetX) / 2}px, ${(sourceY + targetY) / 2}px)`,
              background: '#141211',
              border: '1px solid #2a2824',
              padding: '2px 6px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '8px',
              color: colors.archive.grayLight,
              pointerEvents: 'all',
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
            }}
            className="nodrag nopan rounded-[1px] tracking-widest uppercase select-none"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};