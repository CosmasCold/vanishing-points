'use client';

import React from 'react';
import { EvidenceItem } from '@/types/investigation';
import { colors, typography } from '@/styles/theme';
import { FileText, Image, Mic, Video, Box, User, Radio } from 'lucide-react';

const typeIcons = {
  photo: Image,
  document: FileText,
  audio: Mic,
  video: Video,
  physical: Box,
  witness: User,
  signal: Radio,
};

const statusColors: Record<string, string> = {
  locked: colors.archive.gray,
  available: colors.archive.amber,
  collected: colors.archive.green,
  analyzing: colors.archive.blue,
  analyzed: colors.archive.white,
};

interface EvidenceGridProps {
  evidence: EvidenceItem[];
  investigationId: string;
}

export const EvidenceGrid: React.FC<EvidenceGridProps> = ({ evidence }) => {
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
        const Icon = typeIcons[item.type];
        return (
          <div
            key={item.id}
            className="p-3 border transition-colors hover:border-amber-700"
            style={{ 
              borderColor: colors.archive.gray, 
              backgroundColor: colors.archive.surface,
              opacity: item.status === 'locked' ? 0.5 : 1,
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon size={14} style={{ color: statusColors[item.status] || colors.archive.gray }} />
                <span style={{ color: colors.archive.white, fontSize: typography.sizes.sm, fontFamily: typography.mono }}>
                  {item.title}
                </span>
              </div>
              <span 
                className="px-1.5 py-0.5 text-xs border"
                style={{ 
                  color: statusColors[item.status] || colors.archive.gray, 
                  borderColor: statusColors[item.status] || colors.archive.gray,
                  fontFamily: typography.mono,
                }}
              >
                {item.status.toUpperCase()}
              </span>
            </div>
            <p style={{ color: colors.archive.grayLight, fontSize: typography.sizes.xs, lineHeight: '1.4' }}>
              {item.description}
            </p>
            {item.unlockCondition && item.status === 'locked' && (
              <p style={{ color: colors.archive.amber, fontSize: typography.sizes.xs, marginTop: '0.5rem', fontFamily: typography.mono }}>
                LOCKED: {item.unlockCondition.message}
              </p>
            )}
            {item.mediaUrl && item.status !== 'locked' && (
              <div className="mt-2 px-2 py-1 border inline-block" style={{ borderColor: colors.archive.blue, color: colors.archive.blue, fontSize: typography.sizes.xs, fontFamily: typography.mono }}>
                [MEDIA ATTACHED]
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};