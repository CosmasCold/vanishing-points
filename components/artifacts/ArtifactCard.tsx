'use client';

import React from 'react';
import { PhysicalArtifact } from '@/types/artifacts';
import { useArtifactStore } from '@/state/artifactStore';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography } from '@/styles/theme';

interface ArtifactCardProps {
  artifact: PhysicalArtifact;
}

export const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact }) => {
  const { openArtifact } = useArtifactStore();
  const { click } = useAudioStore();

  const handleClick = () => {
    click();
    openArtifact(artifact);
  };

  return (
    <div
      onClick={handleClick}
      className="p-3 border cursor-pointer hover:border-amber-700 transition-colors"
      style={{ borderColor: colors.archive.gray, backgroundColor: colors.archive.surface }}
    >
      <div className="flex justify-between items-start mb-2">
        <span
          className="px-1.5 py-0.5 border text-xs"
          style={{ borderColor: colors.archive.amber, color: colors.archive.amber, fontFamily: typography.mono, fontSize: '0.625rem' }}
        >
          ART
        </span>
        <span
          style={{
            color:
              artifact.quarantineStatus === 'anomalous' ? colors.archive.red :
              artifact.quarantineStatus === 'pending' ? colors.archive.amber :
              colors.archive.green,
            fontFamily: typography.mono,
            fontSize: '0.625rem',
          }}
        >
          {artifact.quarantineStatus.toUpperCase()}
        </span>
      </div>

      <div style={{ color: colors.archive.white, fontFamily: typography.mono, fontSize: typography.sizes.sm, marginBottom: '0.25rem' }}>
        {artifact.name}
      </div>

      <div style={{ color: colors.archive.gray, fontSize: typography.sizes.xs, fontFamily: typography.mono }}>
        {artifact.material.toUpperCase()} • {artifact.weight}
      </div>

      <div
        className="mt-2 pt-2 border-t flex justify-between"
        style={{ borderColor: colors.archive.gray }}
      >
        <span style={{ color: colors.archive.gray, fontSize: '0.625rem', fontFamily: typography.mono }}>
          {artifact.markings.length} MARKING{artifact.markings.length !== 1 ? 'S' : ''}
        </span>
        <span style={{ color: colors.archive.gray, fontSize: '0.625rem', fontFamily: typography.mono }}>
          {artifact.condition.toUpperCase()}
        </span>
      </div>
    </div>
  );
};