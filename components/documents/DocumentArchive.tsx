'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography, microform } from '@/styles/theme';

interface ArchiveDocument {
  id: string;
  title: string;
  date: string;
  source: string;
  classification: 'public' | 'restricted' | 'sealed';
  excerpt: string;
  content: string;
}

const DOCUMENTS: ArchiveDocument[] = [
  {
    id: 'memo-11-delta',
    title: 'Research Memorandum 11-Δ',
    date: '1983-10-14',
    source: 'Archive Research Division',
    classification: 'restricted',
    excerpt: '"When a place is erased, something remains. Not the place itself. Not the people. Only the possibility that they once existed."',
    content: `When a place is erased, something remains. Not the place itself. Not the people. Only the possibility that they once existed.

The Archive has observed this phenomenon across forty-seven documented Vanishing Points. In each case, the same residue was present: microscopic particulate that defies conventional analysis.

We have named this substance Dust.

Dust is not literal dust. It is the residue left behind when reality abandons a possibility. Every forgotten town. Every erased person. Every rewritten photograph. Every impossible event. Leaves behind an invisible sediment.

No laboratory has ever isolated it. No instrument can measure it directly. Its existence is inferred through its effects.

Most people pass through Dust without noticing. Investigators do not.

The implications are extraordinary. If Dust is the scar tissue of erased history, then the Archive is not merely preserving information. It is preserving the wounds themselves.

And wounds, properly attended, can teach us what happened here.`,
  },
  {
    id: 'field-manual-7',
    title: 'Field Manual 7: Observer Protocols',
    date: '1991-03-22',
    source: 'Training Division',
    classification: 'public',
    excerpt: 'Ground yourself often. Trust the equipment. It remembers when you cannot.',
    content: `GROUNDING PROCEDURES

When Dust exposure exceeds moderate levels, the investigator must perform the following:

1. Review verified evidence against preserved originals.
2. Listen to authenticated recordings.
3. Compare photographs against archival negatives.
4. Organize the workstation.
5. Catalogue recent discoveries.
6. Speak aloud the names of verified locations.

These acts restore Observer Stability. They are not optional.

The equipment is calibrated to detect changes the human mind cannot. Trust the equipment. It remembers when you cannot.

Do not investigate alone after midnight. The Archive is not indifferent. It is hungry.

If you hear your name spoken by BUNKER_7 when you have not entered a command, log the incident immediately. Do not respond.`,
  },
  {
    id: 'personnel-447',
    title: 'Personnel File 447: Disappearance Report',
    date: '1978-11-03',
    source: 'Internal Affairs',
    classification: 'sealed',
    excerpt: 'Investigator did not retire. Investigator was not reassigned. Investigator simply stopped appearing in personnel records.',
    content: `INVESTIGATOR: [REDACTED]
ASSIGNED: 1962-04-18
LAST CONTACT: 1978-10-30
STATUS: UNRESOLVED

Investigator 447 completed 312 archival cases over sixteen years. Dust exposure was consistently within nominal ranges. No stability warnings were logged.

On October 30, 1978, Investigator 447 submitted a routine report on the Meridian Mine case. The report was unremarkable. No anomalies were flagged.

On November 1, 1978, Investigator 447 did not report for duty. Their workstation was found exactly as they had left it. Coffee was still warm. A pen lay uncapped on an open notebook. The notebook contained a single sentence:

"The tunnel is longer today than it was yesterday."

Investigator 447 did not retire. Investigator 447 was not reassigned. Investigator 447 simply stopped appearing in personnel records.

BUNKER_7 cannot confirm whether Investigator 447 ever existed.

The case remains open.`,
  },
  {
    id: 'atlas-note-12',
    title: 'Atlas Annotation 12: Coordinate Drift',
    date: '1995-06-08',
    source: 'Cartography Division',
    classification: 'restricted',
    excerpt: 'The Atlas is never complete. Its imperfections tell stories.',
    content: `COORDINATE DRIFT REPORT

The following locations have experienced measurable coordinate drift in the past fiscal year:

- St. Elmo Lighthouse: 0.003° eastward
- Blackwood Hospital: 0.007° northward
- Meridian Mine: [COORDINATES UNSTABLE — see Appendix C]

This is not equipment error. All instruments have been calibrated against verified benchmarks. The drift is real.

The Atlas is humanity's greatest attempt to map places that reality refuses to keep. It behaves like a living cartographic database.

Roads disappear. Coordinates drift. Buildings migrate. Entire settlements vanish from previous versions.

The Atlas is never complete. Its imperfections tell stories.

Do not correct drift without cross-referencing witness testimony. Some drift is data. Some drift is evidence.`,
  },
];

export const DocumentArchive: React.FC = () => {
  const { click } = useAudioStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const selected = DOCUMENTS.find((d) => d.id === selectedId);
  const filtered = DOCUMENTS.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.excerpt.toLowerCase().includes(search.toLowerCase())
  );

  const classColor = (c: string) => {
    switch (c) {
      case 'sealed': return colors.archive.red;
      case 'restricted': return colors.archive.amber;
      default: return colors.archive.green;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Stamped brass search header */}
      <div
        className="mb-4 pb-4"
        style={{ borderBottom: `1px solid ${microform.mahoganyLight}` }}
      >
        <div
          className="mb-3 text-[10px] tracking-[0.15em]"
          style={{ color: microform.halogen, fontFamily: typography.mono, textShadow: microform.halogenText }}
        >
          DOCUMENT ARCHIVE
        </div>

        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{
            border: `1px solid ${microform.iron}`,
            boxShadow: `inset 0 1px 2px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.02)`,
            background: microform.iron,
          }}
        >
          <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.sm }}>
            ⌕
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search index cards..."
            className="flex-1 bg-transparent outline-none"
            style={{
              color: colors.archive.white,
              fontFamily: typography.mono,
              fontSize: typography.sizes.xs,
              caretColor: microform.halogen,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}
            >
              ×
            </button>
          )}
        </div>

        <div
          className="mt-2"
          style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: '0.5625rem', letterSpacing: '0.06em' }}
        >
          {filtered.length} OF {DOCUMENTS.length} DOCUMENTS
        </div>
      </div>

      {/* Document list — index card aesthetic */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filtered.map((doc, i) => (
          <motion.button
            key={doc.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25 }}
            onClick={() => { click(); setSelectedId(doc.id); }}
            className="w-full text-left transition-all duration-200"
            style={{
              padding: '0.75rem',
              background: selectedId === doc.id
                ? `linear-gradient(90deg, ${microform.mahogany} 0%, ${colors.archive.surface} 100%)`
                : `linear-gradient(180deg, ${colors.archive.surfaceRaised} 0%, ${colors.archive.surface} 100%)`,
              border: `1px solid ${selectedId === doc.id ? microform.mahoganyLight : microform.iron}`,
              borderLeft: selectedId === doc.id ? `3px solid ${colors.archive.amber}` : `1px solid ${microform.iron}`,
              boxShadow: selectedId === doc.id
                ? `inset 0 0 12px ${microform.halogenDim}, 0 2px 8px rgba(0,0,0,0.3)`
                : `0 1px 3px rgba(0,0,0,0.3)`,
            }}
          >
            <div className="flex justify-between items-start mb-1.5">
              <span
                style={{
                  color: selectedId === doc.id ? colors.archive.white : colors.archive.grayLight,
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.sm,
                  textShadow: selectedId === doc.id ? microform.halogenText : 'none',
                }}
              >
                {doc.title}
              </span>
              <span
                className="px-1.5 py-0.5 text-[10px] border shrink-0 ml-2"
                style={{
                  borderColor: classColor(doc.classification),
                  color: classColor(doc.classification),
                  fontFamily: typography.mono,
                  backgroundColor: 'rgba(20,20,18,0.6)',
                  letterSpacing: '0.04em',
                }}
              >
                {doc.classification.toUpperCase()}
              </span>
            </div>
            <div
              style={{
                color: colors.archive.gray,
                fontFamily: typography.mono,
                fontSize: '0.5625rem',
                letterSpacing: '0.04em',
              }}
            >
              {doc.date} • {doc.source}
            </div>
            <div
              className="mt-2 line-clamp-2"
              style={{
                color: colors.archive.gray,
                fontFamily: typography.serif,
                fontSize: '0.6875rem',
                lineHeight: 1.5,
                opacity: 0.7,
              }}
            >
              {doc.excerpt}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Document viewer — appears below selection in the narrow panel */}
      {selected && (
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 shrink-0"
          style={{ borderTop: `1px solid ${microform.mahoganyLight}` }}
        >
          <div
            className="mb-3 pb-3"
            style={{ borderBottom: `1px solid ${microform.iron}` }}
          >
            <div className="flex justify-between items-start">
              <span
                style={{
                  color: colors.archive.white,
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.sm,
                  textShadow: microform.halogenText,
                }}
              >
                {selected.title}
              </span>
              <span
                className="px-1.5 py-0.5 text-[10px] border"
                style={{
                  borderColor: classColor(selected.classification),
                  color: classColor(selected.classification),
                  fontFamily: typography.mono,
                  backgroundColor: 'rgba(20,20,18,0.6)',
                }}
              >
                {selected.classification.toUpperCase()}
              </span>
            </div>
            <div
              className="mt-1.5 flex gap-3"
              style={{
                color: colors.archive.gray,
                fontFamily: typography.mono,
                fontSize: '0.5625rem',
                letterSpacing: '0.04em',
              }}
            >
              <span>{selected.date}</span>
              <span>{selected.source.toUpperCase()}</span>
              <span>REF: {selected.id.toUpperCase()}</span>
            </div>
          </div>

          <div
            className="p-4 relative"
            style={{
              backgroundColor: microform.paperWarm,
              backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 8%)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 0 30px rgba(139,119,89,0.04)',
              fontFamily: typography.serif,
              fontSize: typography.sizes.sm,
              lineHeight: 1.7,
              color: '#2a2620',
              maxHeight: '16rem',
              overflowY: 'auto',
            }}
          >
            {selected.content.split('\n\n').map((para, i) => (
              <p key={i} className="mb-3 last:mb-0">
                {para}
              </p>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};