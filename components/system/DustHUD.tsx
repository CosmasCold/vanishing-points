'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useUIStore, DUST_THRESHOLDS, STABILITY_THRESHOLDS } from '@/state/uiStore';
import { colors, typography } from '@/styles/theme';

export const DustHUD: React.FC = () => {
  const { status } = useUIStore();

  const dustPct = Math.min(100, (status.dustIndex / DUST_THRESHOLDS.EXTREME) * 100);
  const stabilityPct = status.observerStability;

  const dustColor =
    status.dustIndex >= DUST_THRESHOLDS.EXTREME ? colors.archive.red :
    status.dustIndex >= DUST_THRESHOLDS.HIGH ? colors.archive.redBright :
    status.dustIndex >= DUST_THRESHOLDS.MODERATE ? colors.archive.amber :
    colors.archive.green;

  const stabilityColor =
    stabilityPct <= STABILITY_THRESHOLDS.UNSTABLE ? colors.archive.red :
    stabilityPct <= STABILITY_THRESHOLDS.CRITICAL ? colors.archive.redBright :
    stabilityPct <= STABILITY_THRESHOLDS.DEGRADED ? colors.archive.amber :
    colors.archive.green;

  return (
    <div
      className="fixed top-4 right-4 z-40 border p-3 w-64"
      style={{
        borderColor: colors.archive.grayDark,
        backgroundColor: 'rgba(20, 20, 18, 0.92)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <span
          style={{
            color: colors.archive.gray,
            fontFamily: typography.mono,
            fontSize: typography.sizes.xs,
            letterSpacing: '0.1em',
          }}
        >
          OBSERVER STATUS
        </span>
        {status.dustIndex >= DUST_THRESHOLDS.HIGH && (
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="px-1.5 py-0.5 text-xs border"
            style={{ color: colors.archive.red, borderColor: colors.archive.red, fontFamily: typography.mono }}
          >
            ALERT
          </motion.span>
        )}
      </div>

      {/* Dust Index */}
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
            DUST INDEX
          </span>
          <span style={{ color: dustColor, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
            {status.dustIndex}
          </span>
        </div>
        <div className="h-1.5 w-full" style={{ backgroundColor: colors.archive.grayDark }}>
          <motion.div
            className="h-full"
            style={{ backgroundColor: dustColor }}
            initial={{ width: 0 }}
            animate={{ width: `${dustPct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between mt-1">
          {['LOW', 'MOD', 'HIGH', 'EXT'].map((label, i) => {
            const thresholds = [DUST_THRESHOLDS.LOW, DUST_THRESHOLDS.MODERATE, DUST_THRESHOLDS.HIGH, DUST_THRESHOLDS.EXTREME];
            const active = status.dustIndex >= thresholds[i];
            return (
              <span
                key={label}
                style={{
                  color: active ? dustColor : colors.archive.grayDark,
                  fontFamily: typography.mono,
                  fontSize: '0.5rem',
                  letterSpacing: '0.05em',
                }}
              >
                {label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Observer Stability */}
      <div>
        <div className="flex justify-between mb-1">
          <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
            STABILITY
          </span>
          <span style={{ color: stabilityColor, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
            {stabilityPct.toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 w-full" style={{ backgroundColor: colors.archive.grayDark }}>
          <motion.div
            className="h-full"
            style={{ backgroundColor: stabilityColor }}
            initial={{ width: '100%' }}
            animate={{ width: `${stabilityPct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between mt-1">
          {['UNSTABLE', 'CRIT', 'DEG', 'STABLE'].map((label, i) => {
            const thresholds = [STABILITY_THRESHOLDS.UNSTABLE, STABILITY_THRESHOLDS.CRITICAL, STABILITY_THRESHOLDS.DEGRADED, STABILITY_THRESHOLDS.STABLE];
            const active = stabilityPct <= thresholds[i];
            return (
              <span
                key={label}
                style={{
                  color: active ? stabilityColor : colors.archive.grayDark,
                  fontFamily: typography.mono,
                  fontSize: '0.5rem',
                  letterSpacing: '0.05em',
                }}
              >
                {label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};