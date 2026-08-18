'use client';

import React, { useState } from 'react';
import { colors, typography } from '@/styles/theme';

interface BodieExposurePanelProps {
  dustIndex: number;
  cost: number;
  completed: boolean;
  onInduce: () => { success: boolean; message: string };
}

export const BodieExposurePanel: React.FC<BodieExposurePanelProps> = ({
  dustIndex,
  cost,
  completed,
  onInduce,
}) => {
  const [message, setMessage] = useState<string | null>(null);

  if (completed) {
    return (
      <section
        className="p-4 border"
        style={{
          borderColor: colors.archive.grayDark,
          backgroundColor: colors.archive.surface,
        }}
      >
        <div
          style={{
            color: colors.archive.gray,
            fontFamily: typography.mono,
            fontSize: typography.sizes.xs,
            marginBottom: '0.5rem',
            letterSpacing: '0.05em',
          }}
        >
          EXPOSURE RECORD
        </div>
        <div
          style={{
            color: colors.archive.green,
            fontFamily: typography.mono,
            fontSize: typography.sizes.xs,
          }}
        >
          EXPOSURE ALREADY RECORDED
        </div>
      </section>
    );
  }

  const insufficientDust = dustIndex < cost;

  const handleInduce = () => {
    const result = onInduce();
    setMessage(result.message);
  };

  return (
    <section
      className="p-4 border"
      style={{
        borderColor: colors.archive.grayDark,
        backgroundColor: colors.archive.surface,
      }}
    >
      <div
        style={{
          color: colors.archive.gray,
          fontFamily: typography.mono,
          fontSize: typography.sizes.xs,
          marginBottom: '0.75rem',
          letterSpacing: '0.05em',
        }}
      >
        UNRESOLVED MATERIAL
      </div>

      <p
        style={{
          color: colors.archive.grayLight,
          fontFamily: typography.serif,
          fontSize: typography.sizes.sm,
          lineHeight: '1.6',
          marginBottom: '1rem',
        }}
      >
        The weathering record contains discrepancies that ordinary examination
        has not resolved.
      </p>

      <div
        className="mb-3"
        style={{
          color: colors.archive.gray,
          fontFamily: typography.mono,
          fontSize: typography.sizes.xs,
        }}
      >
        DUST INDEX: {dustIndex} · EXPOSURE DISTURBANCE: {cost}
      </div>

      <button
        onClick={handleInduce}
        disabled={insufficientDust}
        className="px-3 py-2 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          borderColor: insufficientDust ? colors.archive.grayDark : colors.archive.amber,
          color: insufficientDust ? colors.archive.gray : colors.archive.amber,
          backgroundColor: colors.archive.surfaceRaised,
          fontFamily: typography.mono,
          fontSize: typography.sizes.xs,
          letterSpacing: '0.05em',
        }}
      >
        {insufficientDust ? 'INSUFFICIENT DUST' : 'INDUCE EXPOSURE'}
      </button>

      {message && (
        <p
          className="mt-3"
          style={{
            color: colors.archive.gray,
            fontFamily: typography.mono,
            fontSize: typography.sizes.xs,
            lineHeight: '1.5',
          }}
        >
          {message}
        </p>
      )}
    </section>
  );
};
