'use client';

import React from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';
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

  const strokeColor =
    data?.type === 'unstable' ? colors.archive.white :
    data?.type === 'suspected' ? colors.archive.amber :
    colors.archive.blue;

  const strokeDasharray =
    data?.type === 'suspected' ? '5,5' :
    data?.type === 'unstable' ? '2,2' :
    undefined;

  return (
    <>
      <path
        id={id}
        style={{
          stroke: strokeColor,
          strokeWidth: 1.5,
          strokeDasharray,
          opacity: 0.6,
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {data?.label && (
        <text
          x={(sourceX + targetX) / 2}
          y={(sourceY + targetY) / 2}
          textAnchor="middle"
          style={{
            fill: colors.archive.gray,
            fontSize: '0.625rem',
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          {data.label}
        </text>
      )}
    </>
  );
};