'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useArtifactStore } from '@/state/artifactStore';
import { useAudioStore } from '@/state/audioStore';
import { PhysicalArtifact } from '@/types/artifacts';
import { colors, typography } from '@/styles/theme';

export const InventoryPanel: React.FC = () => {
  const { inventory } = useArtifactStore();
  const { click } = useAudioStore();

  const quarantineColor = (status: string) => {
    switch (status) {
      case 'anomalous': return colors.archive.red;
      case 'pending': return colors.archive.amber;
      case 'cleared': return colors.archive.green;
      default: return colors.archive.gray;
    }
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="mb-4 pb-2 border-b" style={{ borderColor: colors.archive.grayDark }}>
        <h2 style={{ color: colors.archive.amber, fontFamily: typography.mono, fontSize: typography.sizes.xs, letterSpacing: '0.1em' }}>
          QUARANTINE LOCKER
        </h2>
        <div style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs, marginTop: '0.25rem' }}>
          {inventory.length} ARTIFACTS IN CONTAINMENT
        </div>
      </div>

      {inventory.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4" style={{ color: colors.archive.gray, fontFamily: typography.mono }}>
          <div style={{ fontSize: typography.sizes.xl, opacity: 0.3 }}>▪</div>
          <div>No items in quarantine...</div>
          <div style={{ fontSize: typography.sizes.xs, opacity: 0.6 }}>
            Artifacts recovered from investigations will appear here
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {inventory.map((artifact: PhysicalArtifact, i: number) => (
            <motion.button
              key={artifact.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => click()}
              className="w-full text-left p-4 border hover:border-amber-700 transition-colors"
              style={{ borderColor: colors.archive.grayDark, backgroundColor: colors.archive.surface }}
            >
              <div className="flex justify-between items-start mb-1">
                <span style={{ color: colors.archive.white, fontFamily: typography.mono, fontSize: typography.sizes.sm }}>
                  {artifact.name}
                </span>
                <span
                  className="px-1.5 py-0.5 text-xs border"
                  style={{ borderColor: quarantineColor(artifact.quarantineStatus), color: quarantineColor(artifact.quarantineStatus), fontFamily: typography.mono }}
                >
                  {artifact.quarantineStatus.toUpperCase()}
                </span>
              </div>
              <div style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
                {artifact.origin} • {artifact.dateRecovered}
              </div>
              <div className="mt-2 flex flex-wrap gap-2" style={{ fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
                <span style={{ color: colors.archive.gray }}>{artifact.material.toUpperCase()}</span>
                <span style={{ color: colors.archive.gray }}>•</span>
                <span style={{ color: colors.archive.gray }}>{artifact.condition.toUpperCase()}</span>
                <span style={{ color: colors.archive.gray }}>•</span>
                <span style={{ color: colors.archive.gray }}>{artifact.weight}</span>
                <span style={{ color: colors.archive.gray }}>•</span>
                <span style={{ color: colors.archive.gray }}>{artifact.dimensions}</span>
              </div>
              {artifact.markings.length > 0 && (
                <div className="mt-2" style={{ color: colors.archive.blue, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
                  {artifact.markings.length} MARKING{artifact.markings.length > 1 ? 'S' : ''} DETECTED
                </div>
              )}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
};