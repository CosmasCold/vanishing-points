'use client';

import React, { useState } from 'react';
import { useUIStore } from '@/state/uiStore';
import { useAudioStore } from '@/state/audioStore';
import { useMediaStore } from '@/state/mediaStore';
import { colors, typography } from '@/styles/theme';

interface EvidenceItem {
  id: string;
  type: 'document' | 'photo' | 'audio' | 'video' | 'personal';
  title: string;
  description?: string;
  mediaUrl?: string;
  dustCost?: number;
}

interface EvidenceGridProps {
  items: EvidenceItem[];
}

export const EvidenceGrid: React.FC<EvidenceGridProps> = ({ items }) => {
  const [examinedIds, setExaminedIds] = useState<Set<string>>(new Set());
  const { examineEvidence } = useUIStore();
  const { click } = useAudioStore();
  const { openMedia } = useMediaStore();

  const handleExamine = (item: EvidenceItem) => {
    if (examinedIds.has(item.id)) return;

    click();
    examineEvidence(item.id);
    setExaminedIds((prev) => new Set(prev).add(item.id));

    if (
      (item.type === 'audio' || item.type === 'video' || item.type === 'personal') &&
      item.mediaUrl
    ) {
      const mediaType = item.type === 'personal' ? 'audio' : item.type;
      openMedia(item.id, item.mediaUrl, mediaType, item.title);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return colors.archive.amber;
      case 'photo': return colors.archive.green;
      case 'audio': return colors.archive.blue;
      case 'video': return colors.archive.redBright;
      case 'personal': return colors.archive.grayLight;
      default: return colors.archive.gray;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {items.map((item) => {
        const examined = examinedIds.has(item.id);
        return (
          <button
            key={item.id}
            onClick={() => handleExamine(item)}
            className="text-left p-4 border transition-all hover:border-amber-700"
            style={{
              borderColor: examined ? colors.archive.amber : colors.archive.grayDark,
              backgroundColor: examined ? 'rgba(201, 169, 110, 0.05)' : colors.archive.surface,
              opacity: examined ? 0.8 : 1,
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <span
                style={{
                  color: getTypeColor(item.type),
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.xs,
                  letterSpacing: '0.05em',
                }}
              >
                {item.type.toUpperCase()}
              </span>
              {examined && (
                <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
                  VIEWED
                </span>
              )}
            </div>
            <div
              style={{
                color: colors.archive.white,
                fontFamily: typography.mono,
                fontSize: typography.sizes.sm,
                marginBottom: '0.5rem',
              }}
            >
              {item.title}
            </div>
            {item.description && (
              <p style={{ color: colors.archive.gray, fontSize: typography.sizes.xs }}>
                {item.description}
              </p>
            )}
            {!examined && item.dustCost && (
              <div
                className="mt-2"
                style={{
                  color: colors.archive.amber,
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.xs,
                }}
              >
                COST: {item.dustCost} DUST
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};