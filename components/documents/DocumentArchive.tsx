import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDocumentStore } from '@/state/documentStore';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography, microform } from '@/styles/theme';
import { DocumentArtifact } from '@/types/documents';
import { FileText, Search, Shield, Eye, BookOpen, AlertTriangle } from 'lucide-react';

// Static type-safe declassified manual entries to provide baseline lore
const STATIC_MANUALS: DocumentArtifact[] = [
  {
    id: 'memo-11-delta',
    slug: 'memo-11-delta',
    title: 'Research Memorandum 11-Δ: Dust Particulate',
    type: 'typed_report',
    date: '1983-10-14',
    source: 'Archive Research Division',
    author: 'Archival Board',
    condition: 'aged',
    tier: 0,
    placeSlug: 'global',
    content: `When a place is erased, something remains. Not the place itself. Not the people. Only the possibility that they once existed.

The Archive has observed this phenomenon across forty-seven documented Vanishing Points. In each case, the same residue was present: microscopic particulate that defies conventional analysis.

We have named this substance Dust.

Dust is not literal dust. It is the residue left behind when reality abandons a possibility. Every forgotten town. Every erased person. Every rewritten photograph. Every impossible event. Leaves behind an invisible sediment.

No laboratory has ever isolated it. No instrument can measure it directly. Its existence is inferred through its effects.

Most people pass through Dust without noticing. Investigators do not.

The implications are extraordinary. If Dust is the scar tissue of erased history, then the Archive is not merely preserving information. It is preserving the wounds themselves.

And wounds, properly attended, can teach us what happened here.`,
    pages: 3,
    paperType: 'typewriter',
    inkType: 'carbon',
    corruptionLevel: 0.1,
    recoveredAt: '1983-10-14T12:00:00Z',
    recoveredBy: 'system',
    verificationStatus: 'verified',
    relatedDocuments: [],
    dustReward: 5,
    readCount: 0,
    annotations: ['Dust is the residue of erased possibility. It accumulates inside your carrel as you perceive more reality.']
  },
  {
    id: 'field-manual-7',
    slug: 'field-manual-7',
    title: 'Field Manual 7: Observer Protocols',
    type: 'form',
    date: '1991-03-22',
    source: 'Training Division',
    author: 'Director Cosmas',
    condition: 'pristine',
    tier: 0,
    placeSlug: 'global',
    content: `GROUNDING PROCEDURES & COGNITIVE RISK MITIGATION

1. INVESTIGATIVE HYPOTHESIS
Maintain a strict analytical partition between subjective memories and recorded geo-data. Reality is unstable inside the grid; the instruments are your only anchor to consensus causality.

2. DUST REMOVAL (GROUNDING)
When experiencing cognitive drift, immediately execute the grounding ritual (/ground) to purge accumulated electrostatic charge and return to nominal observation baselines.

3. ADVISORIES & WARNINGS
* Do not investigate alone after midnight. The Archive is not indifferent. It is hungry.
* If you hear your name spoken by BUNKER_7 when you have not entered a command, log the incident immediately. Do not respond.
* Under extreme exposure, the text on your monitor may appear to rearrange. Trust the original typeface. The words are trying to adapt.`,
    pages: 2,
    paperType: 'bond',
    inkType: 'print',
    corruptionLevel: 0.0,
    recoveredAt: '1991-03-22T12:00:00Z',
    recoveredBy: 'system',
    verificationStatus: 'verified',
    relatedDocuments: [],
    dustReward: 3,
    readCount: 0,
    annotations: ['Ground yourself often. Trust the equipment. It remembers when you cannot.']
  },
  {
    id: 'personnel-447',
    slug: 'personnel-447',
    title: 'Personnel File 447: Disappearance Report',
    type: 'witness_statement',
    date: '1978-11-03',
    source: 'Internal Affairs Division',
    author: 'Agent Vale',
    condition: 'corrupted',
    tier: 1,
    placeSlug: 'global',
    content: `INVESTIGATOR REPORT — CASE 447 DISAPPEARANCE
ASSIGNED OBSERVER: [REDACTED]
INITIAL ACTIVE DATE: 1962-04-18
LAST CONTACT RECORDED: 1978-10-30
STATUS: UNRESOLVED / VACANT

Subject investigator did not retire. Subject did not submit a resignation or request for transfer. Subject simply stopped appearing in daily logs and physical workspace rosters.

Inquiry of basement carrel #7-B reveals all equipment powered on, empty coffee mug warm to touch, and typewriter carriage locked mid-sentence: "The Atlas is never complete. Its imperfections tell stories."

No signs of forced entry. Entrance locks require biometric validation matching subject only.

Of note: None of the surrounding personnel can recall the subject's name, face, or height, though all confirm that "someone has been sitting at that desk for sixteen years."

The database records have begun deleting references to subject's previous assignments, replacing them with standard VACANT index markers. Recommend complete quarantine of carrel and file declassification.`,
    pages: 1,
    paperType: 'carbon',
    inkType: 'ballpoint',
    corruptionLevel: 0.5,
    recoveredAt: '1978-11-03T12:00:00Z',
    recoveredBy: 'system',
    verificationStatus: 'disputed',
    relatedDocuments: [],
    dustReward: 10,
    readCount: 0,
    annotations: ['Subject\'s shadow was photographed in the background of three separate cases after this date.']
  }
];

export const DocumentArchive: React.FC = () => {
  const { click } = useAudioStore();
  const { openDocument, documents: storeDocuments } = useDocumentStore();
  const [search, setSearch] = useState('');

  // Symmetrically merge static references with actively declassified documents from the global store
  const allDocuments = useMemo(() => {
    const merged = [...STATIC_MANUALS];
    storeDocuments.forEach((doc) => {
      if (!merged.some((m) => m.id === doc.id)) {
        merged.push(doc);
      }
    });
    return merged;
  }, [storeDocuments]);

  // Apply strict regex-safe search matching against title, date, or author
  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return allDocuments.filter((d) => 
      d.title.toLowerCase().includes(query) ||
      d.source.toLowerCase().includes(query) ||
      d.author.toLowerCase().includes(query) ||
      d.content.toLowerCase().includes(query)
    );
  }, [allDocuments, search]);

  const handleOpenDocument = (doc: DocumentArtifact) => {
    click();
    openDocument(doc);
  };

  const getConditionColor = (cond: string) => {
    switch (cond) {
      case 'corrupted':
        return colors.archive.red;
      case 'damaged':
        return colors.archive.amber;
      case 'aged':
        return '#bf9f62'; // Warm sepia/halogen
      default:
        return colors.archive.green;
    }
  };

  return (
    <div className="h-full flex flex-col p-4 font-mono text-xs select-none">
      {/* 1. Stamped brass search header */}
      <div 
        className="mb-4 pb-4 shrink-0" 
        style={{ borderBottom: `1px solid ${microform.mahoganyLight || '#2a1a15'}` }}
      >
        <div 
          className="mb-3 text-[10px] tracking-[0.15em] font-bold flex items-center gap-2" 
          style={{ color: microform.halogen, textShadow: microform.halogenText }}
        >
          <BookOpen size={12} />
          <span>DECLASSIFIED REFERENCE FILES INDEX</span>
        </div>

        {/* Tactical Search input bezel */}
        <div className="relative flex items-center">
          <Search 
            size={12} 
            className="absolute left-3 pointer-events-none" 
            style={{ color: colors.archive.gray }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            placeholder="FILTER BY TITLE, CODEX, AUTHOR, SOURCE..."
            spellCheck={false}
            className="w-full pl-8 pr-3 h-8 border outline-none transition-all uppercase placeholder-stone-600"
            style={{
              backgroundColor: 'rgba(10, 8, 6, 0.95)',
              borderColor: colors.archive.grayDark || '#2d251e',
              color: colors.archive.white,
              fontSize: '10px',
              fontFamily: typography.mono,
            }}
          />
        </div>
      </div>

      {/* 2. Scrollable Search Results Directory */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1" style={{ scrollbarWidth: 'thin' }}>
        {filtered.length === 0 ? (
          <div 
            className="flex flex-col items-center justify-center gap-2 py-12 text-stone-500 border border-dashed text-center px-4"
            style={{ borderColor: colors.archive.grayDark }}
          >
            <AlertTriangle size={16} className="text-amber-600 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest leading-relaxed">
              No matching records found.<br />Check search query parameters.
            </span>
          </div>
        ) : (
          filtered.map((doc) => (
            <div
              key={doc.id}
              onClick={() => handleOpenDocument(doc)}
              className="p-3 border cursor-pointer transition-all duration-200 hover:border-amber-800/40 relative group"
              style={{
                borderColor: colors.archive.grayDark || '#2d251e',
                backgroundColor: 'rgba(15, 12, 10, 0.65)',
              }}
            >
              {/* Halogen-amber hover highlighting bezel */}
              <div 
                className="absolute inset-0 border border-amber-500/0 group-hover:border-amber-500/10 pointer-events-none transition-colors duration-150" 
              />

              {/* Document Registry Title Block */}
              <div className="flex justify-between items-baseline mb-1.5">
                <span 
                  className="font-bold tracking-wide truncate pr-2 uppercase"
                  style={{ color: colors.archive.white }}
                >
                  {doc.title}
                </span>
                <span className="text-[9px] shrink-0 text-stone-500 uppercase">
                  {doc.date}
                </span>
              </div>

              {/* Summary snippet with typography limits */}
              <p 
                className="text-[10px] leading-relaxed mb-3 line-clamp-2 text-stone-400 select-none pointer-events-none"
                style={{ fontFamily: typography.serif }}
              >
                {doc.content.substring(0, 140)}...
              </p>

              {/* Bottom metadata tags */}
              <div className="flex justify-between items-center text-[8px] font-mono tracking-wider text-stone-500">
                <div className="flex gap-3">
                  <span>
                    SOURCE: <strong className="text-stone-300">{doc.source.toUpperCase()}</strong>
                  </span>
                  <span>
                    TYPE: <strong className="text-stone-300">{doc.type.toUpperCase()}</strong>
                  </span>
                </div>
                
                {/* Visual Condition Indicator Light */}
                <div className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: getConditionColor(doc.condition) }} />
                  <span style={{ color: getConditionColor(doc.condition) }}>{doc.condition.toUpperCase()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Panel Footnote Stamp */}
      <div 
        className="mt-3 pt-3 border-t text-[8px] tracking-wider text-stone-600 flex justify-between uppercase"
        style={{ borderColor: colors.archive.grayDark }}
      >
        <span>Index Volume: VP-DOC-MASTER</span>
        <span>Records Indexed: {allDocuments.length} units</span>
      </div>
    </div>
  );
};

export default DocumentArchive;
