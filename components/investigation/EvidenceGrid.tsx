'use client';

import React from 'react';
import { EvidenceItem } from '@/types/investigation';
import { colors, typography } from '@/styles/theme';
import { FileText, Image, Mic, Video, Box, User, Radio, Lock } from 'lucide-react';
import { useAudioStore } from '@/state/audioStore';

const typeIcons: Record<EvidenceItem['type'], React.ComponentType<any>> = {
  photo: Image,
  document: FileText,
  audio: Mic,
  video: Video,
  witness: User,
  signal: Radio,
  personal: User,
  artifact: Box,
};

const statusColors: Record<EvidenceItem['status'], string> = {
  locked: colors.archive.gray,
  available: colors.archive.amber,
  collected: colors.archive.green,
  analyzing: colors.archive.blue,
  analyzed: colors.archive.white,
  viewed: colors.archive.white,
};

interface EvidenceGridProps {
  evidence: EvidenceItem[];
  onSelect: (item: EvidenceItem) => void;
}

export const EvidenceGrid: React.FC<EvidenceGridProps> = ({ evidence, onSelect }) => {
  const { click } = useAudioStore();

  if (evidence.length === 0) {
    return (
      <div className="flex items-center justify-center h-64" style={{ fontFamily: typography.mono }}>
        <div style={{ color: colors.archive.gray }}>NO EVIDENCE COLLECTED</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {evidence.map((item) => {
        const Icon = typeIcons[item.type] || FileText;
        const isLocked = item.status === 'locked';
        const isViewed = item.status === 'analyzed' || item.status === 'viewed';
        const unlockCondition = item.unlockCondition;

        return (
          <button
            key={item.id}
            onClick={() => {
              click();
              onSelect(item);
            }}
            className="text-left p-3 border transition-colors hover:border-amber-700 relative"
            style={{
              borderColor: isViewed ? colors.archive.amber : colors.archive.gray,
              backgroundColor: colors.archive.surface,
              opacity: isLocked ? 0.5 : 1,
              cursor: isLocked ? 'not-allowed' : 'pointer',
            }}
            disabled={isLocked}
          >
            {isViewed && (
              <div
                className="absolute top-2 right-2 px-1.5 py-0.5 border"
                style={{
                  borderColor: colors.archive.amber,
                  color: colors.archive.amber,
                  fontFamily: typography.mono,
                  fontSize: '0.625rem',
                }}
              >
                VIEWED
              </div>
            )}

            <div className="flex items-start justify-between mb-2 pr-16">
              <div className="flex items-center gap-2">
                {isLocked ? (
                  <Lock size={14} style={{ color: colors.archive.gray }} />
                ) : (
                  <Icon size={14} style={{ color: statusColors[item.status] || colors.archive.gray }} />
                )}
                <span
                  style={{
                    color: isLocked ? colors.archive.gray : colors.archive.white,
                    fontSize: typography.sizes.sm,
                    fontFamily: typography.mono,
                  }}
                >
                  {item.title}
                </span>
              </div>
            </div>

            <p
              style={{
                color: colors.archive.grayLight,
                fontSize: typography.sizes.xs,
                lineHeight: '1.4',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {item.description}
            </p>

            {unlockCondition && isLocked && (
              <p
                style={{
                  color: colors.archive.amber,
                  fontSize: typography.sizes.xs,
                  marginTop: '0.5rem',
                  fontFamily: typography.mono,
                }}
              >
                LOCKED: {unlockCondition.message}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
};