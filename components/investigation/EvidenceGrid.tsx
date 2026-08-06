'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { EvidenceItem } from '@/types/investigation';
import { DocumentArtifact } from '@/types/documents';
import { PhysicalArtifact } from '@/types/artifacts';
import { useMediaStore } from '@/state/mediaStore';
import { useDocumentStore } from '@/state/documentStore';
import { useArtifactStore } from '@/state/artifactStore';
import { useAudioStore } from '@/state/audioStore';
import { useUIStore } from '@/state/uiStore';
import { colors, typography } from '@/styles/theme';

interface EvidenceGridProps {
  evidence: EvidenceItem[];
  investigationId: string;
}

const TYPE_LABELS: Record<string, string> = {
  document: 'DOC',
  witness: 'WIT',
  signal: 'SIG',
  photo: 'IMG',
  audio: 'AUD',
  video: 'VID',
  personal: 'ARC',
  artifact: 'ART',
};

const TYPE_COLORS: Record<string, string> = {
  document: colors.archive.white,
  witness: colors.archive.amber,
  signal: colors.archive.blue,
  photo: colors.archive.green,
  audio: colors.archive.amber,
  video: colors.archive.redBright,
  personal: colors.archive.blueBright,
  artifact: colors.archive.red,
};

export const EvidenceGrid: React.FC<EvidenceGridProps> = ({ evidence, investigationId }) => {
  const { openMedia } = useMediaStore();
  const { openDocument } = useDocumentStore();
  const { openArtifact } = useArtifactStore();
  const { click } = useAudioStore();
  const status = useUIStore((s) => s.status);
  const examineEvidence = useUIStore((s) => s.examineEvidence);
  const dustIndex = status?.dustIndex || 0;

  const handleItemClick = (item: EvidenceItem) => {
    if (item.unlockDust && dustIndex < item.unlockDust) return;

    click();

    // Award Dust for first examination only
    const awarded = examineEvidence(item.id, item.type);
    if (awarded > 0) {
      console.log(`[DUST] +${awarded} from ${item.id}`);
    }

    // ── ARTIFACT: Physical object examination ──
    if (item.type === 'artifact') {
      const artifact: PhysicalArtifact = {
        id: item.id,
        name: item.title,
        description: item.description,
        material: 'unknown',
        condition: 'weathered',
        weight: 'Unknown',
        dimensions: 'Unknown',
        origin: item.source || 'Unknown',
        dateRecovered: 'Unknown',
        recoveredBy: 'Unknown',
        quarantineStatus: 'pending',
        markings: [],
        relatedPlaceSlugs: item.relatedTo,
        relatedEvidenceIds: [],
        hasBeenWeighed: false,
        hasBeenPhotographed: false,
        hasBeenScanned: false,
      };
      openArtifact(artifact);
      return;
    }

    // ── DOCUMENT: Typed, handwritten, telegram, etc. ──
    if (item.type === 'document' || item.type === 'witness' || item.type === 'signal') {
      const doc: DocumentArtifact = {
        id: item.id,
        slug: item.id,
        title: item.title,
        type: item.type === 'signal' ? 'telegram' : item.type === 'witness' ? 'handwritten' : 'typed_report',
        content: item.description,
        date: new Date().toISOString().split('T')[0],
        author: item.source || 'Unknown',
        source: item.source || 'Archive',
        condition: 'aged',
        tier: 0,
        placeSlug: investigationId,
        pages: 1,
        paperType: 'bond',
        inkType: 'typewriter',
        corruptionLevel: 0,
        recoveredAt: new Date().toISOString(),
        recoveredBy: 'Field Team',
        verificationStatus: 'verified',
        relatedDocuments: [],
        dustReward: 1,
        readCount: 0,
        annotations: [],
      };
      openDocument(doc);
      return;
    }

    // ── MEDIA: Audio, video, personal cache ──
    if (
      (item.type === 'audio' || item.type === 'video' || item.type === 'personal') &&
      item.mediaUrl
    ) {
      openMedia(item.id, item.mediaUrl, item.type, item.title);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {evidence.map((item, index) => {
        const isLocked = item.unlockDust ? dustIndex < item.unlockDust : false;
        const color = TYPE_COLORS[item.type] || colors.archive.gray;

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.25 }}
            onClick={() => !isLocked && handleItemClick(item)}
            className={`relative p-3 border transition-colors ${
              isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:border-amber-700'
            }`}
            style={{
              borderColor: isLocked ? colors.archive.gray : color,
              backgroundColor: colors.archive.surface,
              opacity: isLocked ? 0.55 : 1,
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
              <span
                className="px-1.5 py-0.5 border text-xs"
                style={{
                  borderColor: isLocked ? colors.archive.gray : color,
                  color: isLocked ? colors.archive.gray : color,
                  fontFamily: typography.mono,
                  fontSize: '0.625rem',
                }}
              >
                {isLocked ? 'LOCK' : TYPE_LABELS[item.type] || 'UNK'}
              </span>

              {item.status === 'analyzing' && !isLocked && (
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: colors.archive.amber }}
                />
              )}
            </div>

            {/* Title */}
            <div
              className="mb-1"
              style={{
                color: isLocked ? colors.archive.gray : colors.archive.white,
                fontFamily: typography.mono,
                fontSize: typography.sizes.sm,
              }}
            >
              {item.title}
            </div>

            {/* Description */}
            <div
              style={{
                color: colors.archive.gray,
                fontFamily: typography.serif,
                fontSize: typography.sizes.xs,
                lineHeight: '1.4',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {isLocked
                ? 'Insufficient Dust clearance for playback stabilization.'
                : item.description}
            </div>

            {/* Footer */}
            <div
              className="mt-2 pt-2 border-t flex justify-between items-center"
              style={{ borderColor: colors.archive.gray }}
            >
              {item.source && !isLocked ? (
                <span
                  style={{
                    color: colors.archive.gray,
                    fontSize: '0.625rem',
                    fontFamily: typography.mono,
                  }}
                >
                  SRC: {item.source}
                </span>
              ) : (
                <span />
              )}

              {isLocked && (
                <span
                  style={{
                    color: colors.archive.red,
                    fontSize: '0.625rem',
                    fontFamily: typography.mono,
                  }}
                >
                  DUST {item.unlockDust}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};