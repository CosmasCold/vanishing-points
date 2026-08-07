'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography } from '@/styles/theme';

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
    <div className="h-full flex">
      {/* Sidebar list */}
      <div className="w-64 border-r overflow-y-auto shrink-0" style={{ borderColor: colors.archive.grayDark }}>
        <div className="p-4 border-b" style={{ borderColor: colors.archive.grayDark }}>
          <div style={{ color: colors.archive.amber, fontFamily: typography.mono, fontSize: typography.sizes.xs, letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
            DOCUMENT ARCHIVE
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full px-3 py-2 border bg-transparent outline-none focus:border-amber-700 transition-colors"
            style={{ borderColor: colors.archive.grayDark, color: colors.archive.white, fontFamily: typography.mono, fontSize: typography.sizes.xs }}
          />
          <div className="mt-2" style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
            {filtered.length} OF {DOCUMENTS.length} DOCUMENTS
          </div>
        </div>

        {filtered.map((doc, i) => (
          <motion.button
            key={doc.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => { click(); setSelectedId(doc.id); }}
            className="w-full text-left p-4 border-b transition-colors hover:bg-white/5"
            style={{
              borderColor: colors.archive.grayDark,
              backgroundColor: selectedId === doc.id ? 'rgba(201, 169, 110, 0.06)' : 'transparent',
            }}
          >
            <div className="flex justify-between items-start mb-1">
              <span style={{ color: colors.archive.white, fontFamily: typography.mono, fontSize: typography.sizes.sm }}>
                {doc.title}
              </span>
              <span
                className="px-1.5 py-0.5 text-xs border"
                style={{ borderColor: classColor(doc.classification), color: classColor(doc.classification), fontFamily: typography.mono }}
              >
                {doc.classification.toUpperCase()}
              </span>
            </div>
            <div style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
              {doc.date} • {doc.source}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Document viewer */}
      <div className="flex-1 overflow-y-auto p-6 min-w-0">
        {selected ? (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="mb-6 pb-4 border-b" style={{ borderColor: colors.archive.grayDark }}>
              <div className="flex justify-between items-start">
                <h1 style={{ color: colors.archive.white, fontFamily: typography.mono, fontSize: typography.sizes.lg }}>
                  {selected.title}
                </h1>
                <span
                  className="px-2 py-1 border text-xs"
                  style={{ borderColor: classColor(selected.classification), color: classColor(selected.classification), fontFamily: typography.mono }}
                >
                  {selected.classification.toUpperCase()}
                </span>
              </div>
              <div className="mt-2 flex gap-4" style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
                <span>DATE: {selected.date}</span>
                <span>SOURCE: {selected.source}</span>
                <span>ID: {selected.id.toUpperCase()}</span>
              </div>
            </div>

            <div
              className="leading-[1.8] space-y-4"
              style={{ color: colors.archive.grayLight, fontFamily: typography.serif, fontSize: typography.sizes.base }}
            >
              {selected.content.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-full" style={{ color: colors.archive.gray, fontFamily: typography.mono }}>
            <div className="text-center space-y-2">
              <div style={{ fontSize: typography.sizes.lg, opacity: 0.5 }}>▤</div>
              <div>Select a document from the archive</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};