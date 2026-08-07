'use client';

import React from 'react';
import { EvidenceItem } from '@/types/investigation';
import { colors, typography } from '@/styles/theme';
import { X, FileText, Image, Mic, Video, Box, User, Radio } from 'lucide-react';
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

const typeLabels: Record<EvidenceItem['type'], string> = {
  photo: 'PHOTOGRAPH',
  document: 'DOCUMENT',
  audio: 'AUDIO RECORDING',
  video: 'VIDEO REEL',
  witness: 'WITNESS TESTIMONY',
  signal: 'SIGNAL CAPTURE',
  personal: 'PERSONAL ITEM',
  artifact: 'ARTIFACT',
};

const statusColors: Record<EvidenceItem['status'], string> = {
  locked: colors.archive.gray,
  available: colors.archive.amber,
  collected: colors.archive.green,
  analyzing: colors.archive.blue,
  analyzed: colors.archive.white,
  viewed: colors.archive.white,
};

interface EvidenceDetailProps {
  evidence: EvidenceItem;
  onClose: () => void;
}

export const EvidenceDetail: React.FC<EvidenceDetailProps> = ({ evidence, onClose }) => {
  const { click } = useAudioStore();
  const Icon = typeIcons[evidence.type] || FileText;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26, 26, 24, 0.9)' }}
      onClick={() => { click(); onClose(); }}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border"
        style={{ backgroundColor: colors.archive.surfaceRaised, borderColor: colors.archive.gray }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 h-10 border-b shrink-0"
          style={{ borderColor: colors.archive.gray, backgroundColor: colors.archive.surface }}
        >
          <div className="flex items-center gap-3">
            <Icon size={14} style={{ color: colors.archive.amber }} />
            <span
              style={{
                color: colors.archive.amber,
                fontFamily: typography.mono,
                fontSize: typography.sizes.xs,
                letterSpacing: '0.05em',
              }}
            >
              {typeLabels[evidence.type] || evidence.type.toUpperCase()}
            </span>
            <span
              style={{
                color: colors.archive.white,
                fontFamily: typography.mono,
                fontSize: typography.sizes.sm,
              }}
            >
              {evidence.title}
            </span>
            <span
              className="px-1.5 py-0.5 text-xs border"
              style={{
                color: statusColors[evidence.status] || colors.archive.gray,
                borderColor: statusColors[evidence.status] || colors.archive.gray,
                fontFamily: typography.mono,
              }}
            >
              {evidence.status.toUpperCase()}
            </span>
          </div>
          <button
            onClick={() => { click(); onClose(); }}
            className="hover:opacity-70 transition-opacity"
            style={{ color: colors.archive.gray }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div
            style={{
              color: colors.archive.white,
              fontSize: typography.sizes.base,
              lineHeight: '1.7',
              fontFamily: typography.serif,
              opacity: 0.9,
            }}
          >
            {evidence.description}
          </div>

          <div className="pt-4 border-t space-y-2" style={{ borderColor: colors.archive.gray }}>
            {evidence.source && (
              <div style={{ color: colors.archive.gray, fontSize: typography.sizes.xs, fontFamily: typography.mono }}>
                SOURCE: <span style={{ color: colors.archive.grayLight }}>{evidence.source}</span>
              </div>
            )}
            {evidence.timestamp && (
              <div style={{ color: colors.archive.gray, fontSize: typography.sizes.xs, fontFamily: typography.mono }}>
                TIMESTAMP: <span style={{ color: colors.archive.grayLight }}>{evidence.timestamp}</span>
              </div>
            )}
            {evidence.metadata && Object.entries(evidence.metadata).map(([k, v]) => (
              <div key={k} style={{ color: colors.archive.gray, fontSize: typography.sizes.xs, fontFamily: typography.mono }}>
                {k.toUpperCase()}: <span style={{ color: colors.archive.grayLight }}>{v}</span>
              </div>
            ))}
          </div>

          {evidence.relatedTo.length > 0 && (
            <div className="pt-4 border-t" style={{ borderColor: colors.archive.gray }}>
              <div
                style={{
                  color: colors.archive.blue,
                  fontSize: typography.sizes.xs,
                  fontFamily: typography.mono,
                  letterSpacing: '0.05em',
                  marginBottom: '0.5rem',
                }}
              >
                CROSS REFERENCES
              </div>
              <div className="flex flex-wrap gap-2">
                {evidence.relatedTo.map((ref) => (
                  <span
                    key={ref}
                    className="px-2 py-1 text-xs border"
                    style={{
                      borderColor: colors.archive.blue,
                      color: colors.archive.blue,
                      fontFamily: typography.mono,
                    }}
                  >
                    {ref}
                  </span>
                ))}
              </div>
            </div>
          )}

          {evidence.mediaUrl && (
            <div
              className="p-4 border"
              style={{ borderColor: colors.archive.blue, backgroundColor: 'rgba(106, 122, 138, 0.05)' }}
            >
              <div
                style={{
                  color: colors.archive.blue,
                  fontSize: typography.sizes.xs,
                  fontFamily: typography.mono,
                  letterSpacing: '0.05em',
                  marginBottom: '0.75rem',
                }}
              >
                ATTACHED MEDIA
              </div>
              <div
                style={{
                  color: colors.archive.blueBright,
                  fontSize: typography.sizes.sm,
                  fontFamily: typography.mono,
                }}
              >
                {evidence.mediaUrl}
              </div>
              <div
                style={{
                  color: colors.archive.gray,
                  fontSize: typography.sizes.xs,
                  fontFamily: typography.mono,
                  marginTop: '0.5rem',
                }}
              >
                [Media playback requires field equipment initialization]
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};