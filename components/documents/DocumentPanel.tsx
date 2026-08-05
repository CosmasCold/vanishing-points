'use client';

import React, { useState } from 'react';
import { useDocumentStore } from '@/state/documentStore';
import { useAtlasStore } from '@/state/atlasStore';
import { useAudioStore } from '@/state/audioStore';
import { DocumentArtifact, DocumentFilter } from '@/types/documents';
import { colors, typography } from '@/styles/theme';
import { FileText, Image, Mic, BookOpen, AlertTriangle, Lock } from 'lucide-react';

const typeIcons: Record<string, React.ElementType> = {
  field_report: FileText,
  witness_statement: Mic,
  internal_memo: FileText,
  photograph: Image,
  audio_transcript: Mic,
  blueprint: BookOpen,
  telegram: FileText,
  journal_entry: BookOpen,
  bunker7_transmission: Mic,
};

const conditionColors: Record<string, string> = {
  pristine: colors.archive.green,
  aged: colors.archive.amber,
  damaged: colors.archive.amber,
  corrupted: colors.archive.red,
  unreadable: colors.archive.gray,
};

export const DocumentPanel: React.FC = () => {
  const { documents, openDocument, getFilteredDocuments } = useDocumentStore();
  const { places } = useAtlasStore();
  const { click } = useAudioStore();
  const [filter, setFilter] = useState<DocumentFilter>({});
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = getFilteredDocuments({ ...filter, search: searchQuery || undefined });

  const handleOpenDocument = (doc: DocumentArtifact) => {
    click();
    openDocument(doc.id);
  };

  return (
    <div className="h-full flex flex-col">
      <div style={{ color: colors.archive.amber, fontSize: typography.sizes.xs, fontFamily: typography.mono, letterSpacing: '0.05em', marginBottom: '1rem' }}>
        DOCUMENT ARCHIVE
      </div>

      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search documents..."
          className="w-full px-2 py-1.5 border bg-transparent outline-none"
          style={{ borderColor: colors.archive.gray, color: colors.archive.white, fontFamily: typography.mono, fontSize: typography.sizes.xs }}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1 mb-3">
        {(['field_report', 'witness_statement', 'internal_memo', 'photograph', 'bunker7_transmission'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter({ ...filter, type: filter.type === t ? undefined : t })}
            className="px-2 py-0.5 text-xs border transition-colors"
            style={{
              borderColor: filter.type === t ? colors.archive.amber : colors.archive.gray,
              color: filter.type === t ? colors.archive.amber : colors.archive.grayLight,
              fontFamily: typography.mono,
              fontSize: '0.6rem',
            }}
          >
            {t.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {filtered.map((doc) => {
          const Icon = typeIcons[doc.type] || FileText;
          const place = places.find((p) => p.slug === doc.placeSlug);
          
          return (
            <button
              key={doc.id}
              onClick={() => handleOpenDocument(doc)}
              className="w-full text-left p-2 border transition-colors hover:border-amber-700"
              style={{ borderColor: colors.archive.gray, backgroundColor: colors.archive.surface }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Icon size={12} style={{ color: conditionColors[doc.condition] || colors.archive.gray }} />
                  <span style={{ color: colors.archive.white, fontSize: typography.sizes.sm }}>
                    {doc.title}
                  </span>
                </div>
                {doc.corruptionLevel > 0 && (
                  <AlertTriangle size={10} style={{ color: colors.archive.red }} />
                )}
              </div>
              <div className="flex justify-between mt-1" style={{ fontSize: typography.sizes.xs, fontFamily: typography.mono }}>
                <span style={{ color: colors.archive.gray }}>
                  {place?.name || doc.placeSlug}
                </span>
                <span style={{ color: conditionColors[doc.condition] || colors.archive.gray }}>
                  {doc.condition.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '0.6rem', color: colors.archive.grayLight, marginTop: '2px', fontFamily: typography.mono }}>
                {doc.date} | {doc.source.replace('_', ' ')}
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center mt-8" style={{ fontFamily: typography.mono }}>
            <div style={{ color: colors.archive.gray, fontSize: typography.sizes.xs }}>
              NO DOCUMENTS FOUND
            </div>
          </div>
        )}
      </div>
    </div>
  );
};