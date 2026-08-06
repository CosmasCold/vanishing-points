'use client';

import React from 'react';
import { useUIStore, DUST_THRESHOLDS, STABILITY_THRESHOLDS } from '@/state/uiStore';
import { colors, typography, spacing } from '@/styles/theme';

export const StatusBar: React.FC = () => {
  const { status } = useUIStore();
  const { dustIndex, observerStability } = status;

  const dustColor =
    dustIndex >= DUST_THRESHOLDS.EXTREME
      ? colors.archive.red
      : dustIndex >= DUST_THRESHOLDS.HIGH
      ? colors.archive.redBright
      : dustIndex >= DUST_THRESHOLDS.MODERATE
      ? colors.archive.amber
      : colors.archive.green;

  const stabColor =
    observerStability <= STABILITY_THRESHOLDS.UNSTABLE
      ? colors.archive.red
      : observerStability <= STABILITY_THRESHOLDS.CRITICAL
      ? colors.archive.redBright
      : observerStability <= STABILITY_THRESHOLDS.DEGRADED
      ? colors.archive.amber
      : colors.archive.green;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-between px-4 h-8 border-t"
      style={{
        marginLeft: spacing.rail,
        borderColor: colors.archive.gray,
        backgroundColor: colors.archive.surface,
        fontFamily: typography.mono,
        fontSize: typography.sizes.xs,
      }}
    >
      <div className="flex items-center gap-4">
        <span style={{ color: colors.archive.gray }}>BUNKER_7</span>
        <span style={{ color: colors.archive.green }}>● ONLINE</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span style={{ color: colors.archive.gray }}>DUST</span>
          <span style={{ color: dustColor }}>{dustIndex}</span>
          {dustIndex >= DUST_THRESHOLDS.HIGH && (
            <span className="animate-pulse" style={{ color: colors.archive.red }}>
              ▲
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span style={{ color: colors.archive.gray }}>STABILITY</span>
          <span style={{ color: stabColor }}>{observerStability.toFixed(0)}%</span>
          {observerStability <= STABILITY_THRESHOLDS.CRITICAL && (
            <span className="animate-pulse" style={{ color: colors.archive.red }}>
              !
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span style={{ color: colors.archive.gray }}>COVERAGE</span>
          <span style={{ color: colors.archive.blue }}>{status.atlasCoverage} km²</span>
        </div>

        {status.activeAlerts > 0 && (
          <div className="flex items-center gap-1">
            <span style={{ color: colors.archive.red }}>ALERTS</span>
            <span
              className="px-1.5 py-0.5 text-xs border"
              style={{
                borderColor: colors.archive.red,
                color: colors.archive.red,
              }}
            >
              {status.activeAlerts}
            </span>
          </div>
        )}
      </div>

      <div style={{ color: colors.archive.gray }}>
        {new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </div>
  );
};