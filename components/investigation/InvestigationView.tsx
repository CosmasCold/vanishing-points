'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInvestigationStore } from '@/state/investigationStore';
import { useAtlasStore } from '@/state/atlasStore';
import { useUIStore } from '@/state/uiStore';
import { useAudioStore } from '@/state/audioStore';
import { Place } from '@/types/places';
import { EvidenceItem, TimelineEvent } from '@/types/investigation';
import { CaseHeader } from './CaseHeader';
import { EvidenceGrid } from './EvidenceGrid';
import { TimelineView } from './TimelineView';
import { NotesPanel } from './NotesPanel';
import { colors, typography, spacing } from '@/styles/theme';

type InvestigationTab = 'overview' | 'evidence' | 'timeline' | 'notes' | 'connections';

const TAB_LABELS: Record<InvestigationTab, string> = {
  overview: 'OVERVIEW',
  evidence: 'EVIDENCE',
  timeline: 'TIMELINE',
  notes: 'NOTES',
  connections: 'CONNECTIONS',
};

interface InvestigationViewProps {
  place: Place;
}

function seedEvidenceFromPlace(place: Place): EvidenceItem[] {
  const items: EvidenceItem[] = [];

  items.push({
    id: `${place.slug}-archive-entry`,
    type: 'document',
    title: 'Archive Entry',
    description: `Primary classification: ${place.category}. Status: ${place.status}. Coordinates logged.`,
    source: 'BUNKER_7 Archive',
    status: 'collected',
    relatedTo: place.connectedTo,
  });

  if (place.history) {
    items.push({
      id: `${place.slug}-field-report`,
      type: 'document',
      title: 'Field Report',
      description: place.history.substring(0, 180) + '...',
      source: place.verifiedBy,
      status: 'analyzed',
      relatedTo: [],
    });
  }

  place.hauntingReports.forEach((report, i) => {
    items.push({
      id: `${place.slug}-witness-${i}`,
      type: 'witness',
      title: `Witness Testimony #${i + 1}`,
      description: report,
      status: 'collected',
      relatedTo: [],
    });
  });

  if (place.resonanceNote) {
    items.push({
      id: `${place.slug}-resonance`,
      type: 'signal',
      title: 'Resonance Transmission',
      description: place.resonanceNote,
      source: 'BUNKER_7',
      status: 'analyzing',
      relatedTo: place.connectedTo,
    });
  }

  if (place.photos.length > 0) {
    items.push({
      id: `${place.slug}-photo-1`,
      type: 'photo',
      title: 'Site Photography',
      description: 'Recovered photographic evidence from initial survey.',
      status: 'collected',
      relatedTo: [],
      mediaUrl: place.photos[0],
    });
  }

  return items;
}

function seedTimelineFromPlace(place: Place): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  if (place.yearAbandoned) {
    events.push({
      id: `${place.slug}-abandonment`,
      date: `${place.yearAbandoned}-01-01`,
      title: 'Site Abandoned',
      description: `Primary records indicate ${place.name} was abandoned in ${place.yearAbandoned}.`,
      evidenceIds: [],
      certainty: 'confirmed',
      category: 'incident',
    });
  }

  events.push({
    id: `${place.slug}-submitted`,
    date: place.submittedAt,
    title: 'Archive Submission',
    description: 'Location entered into BUNKER_7 database.',
    evidenceIds: [],
    certainty: 'confirmed',
    category: 'discovery',
  });

  events.push({
    id: `${place.slug}-verified`,
    date: place.verifiedAt,
    title: 'Verification Complete',
    description: `Verified by ${place.verifiedBy}. Status: ${place.status}.`,
    evidenceIds: [],
    certainty: 'confirmed',
    category: 'discovery',
  });

  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export const InvestigationView: React.FC<InvestigationViewProps> = ({ place }) => {
  const [activeTab, setActiveTab] = useState<InvestigationTab>('overview');
  const { click } = useAudioStore();
  const {
    activeInvestigationId,
    openInvestigation,
    closeInvestigation,
    evidence,
    timelines,
    notes,
    setNotes,
    addEvidence,
    addTimelineEvent,
  } = useInvestigationStore();

  const invId = place.slug;
  const placeEvidence = evidence[invId] || [];
  const placeTimeline = timelines[invId] || [];
  const placeNotes = notes[invId] || '';

  useEffect(() => {
    if (activeInvestigationId !== invId) {
      openInvestigation(invId, place.name);
      const seededEvidence = seedEvidenceFromPlace(place);
      const seededTimeline = seedTimelineFromPlace(place);
      seededEvidence.forEach((item) => addEvidence(invId, item));
      seededTimeline.forEach((event) => addTimelineEvent(invId, event));
    }
  }, [invId, place.name, activeInvestigationId, openInvestigation, addEvidence, addTimelineEvent]);

  const handleClose = () => {
    click();
    closeInvestigation();
    useUIStore.getState().setActiveModule(null);
  };

  const handleTabChange = (tab: InvestigationTab) => {
    click();
    setActiveTab(tab);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-10 flex flex-col"
      style={{
        marginLeft: spacing.rail,
        marginBottom: useUIStore.getState().terminalOpen
          ? `calc(${spacing.statusBar} + ${spacing.terminalHeight})`
          : spacing.statusBar,
        backgroundColor: colors.archive.black,
      }}
    >
      <CaseHeader place={place} onClose={handleClose} evidenceCount={placeEvidence.length} />

      {/* Tab bar */}
      <div
        className="flex items-center px-4 h-9 border-b gap-1 shrink-0"
        style={{ borderColor: colors.archive.gray, backgroundColor: colors.archive.surface }}
      >
        {(Object.keys(TAB_LABELS) as InvestigationTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className="px-3 h-full border-b-2 transition-colors"
            style={{
              borderColor: activeTab === tab ? colors.archive.amber : 'transparent',
              color: activeTab === tab ? colors.archive.amber : colors.archive.gray,
              fontFamily: typography.mono,
              fontSize: typography.sizes.xs,
              letterSpacing: '0.05em',
            }}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <div
                style={{
                  color: colors.archive.amber,
                  fontSize: typography.sizes.xs,
                  fontFamily: typography.mono,
                  letterSpacing: '0.05em',
                  marginBottom: '0.5rem',
                }}
              >
                CASE SUMMARY
              </div>
              <p
                style={{
                  color: colors.archive.white,
                  fontSize: typography.sizes.base,
                  lineHeight: '1.7',
                  opacity: 0.9,
                  fontFamily: typography.serif,
                }}
              >
                {place.history}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 border" style={{ borderColor: colors.archive.gray }}>
                <div style={{ color: colors.archive.gray, fontSize: typography.sizes.xs, fontFamily: typography.mono }}>
                  DANGER LEVEL
                </div>
                <div style={{ color: place.dangerLevel >= 4 ? colors.archive.red : colors.archive.amber, fontSize: typography.sizes.lg, fontFamily: typography.mono, marginTop: '0.25rem' }}>
                  {place.dangerLevel}/5
                </div>
              </div>
              <div className="p-3 border" style={{ borderColor: colors.archive.gray }}>
                <div style={{ color: colors.archive.gray, fontSize: typography.sizes.xs, fontFamily: typography.mono }}>
                  STATUS
                </div>
                <div style={{ color: colors.archive.white, fontSize: typography.sizes.lg, fontFamily: typography.mono, marginTop: '0.25rem' }}>
                  {place.status.toUpperCase()}
                </div>
              </div>
              <div className="p-3 border" style={{ borderColor: colors.archive.gray }}>
                <div style={{ color: colors.archive.gray, fontSize: typography.sizes.xs, fontFamily: typography.mono }}>
                  EVIDENCE
                </div>
                <div style={{ color: colors.archive.green, fontSize: typography.sizes.lg, fontFamily: typography.mono, marginTop: '0.25rem' }}>
                  {placeEvidence.length}
                </div>
              </div>
            </div>

            {place.unlockCondition && (
              <div
                className="p-4 border"
                style={{ borderColor: colors.archive.red, backgroundColor: 'rgba(138, 90, 90, 0.05)' }}
              >
                <div style={{ color: colors.archive.red, fontSize: typography.sizes.xs, fontFamily: typography.mono, letterSpacing: '0.05em' }}>
                  CASE LOCKED
                </div>
                <p style={{ color: colors.archive.redBright, fontSize: typography.sizes.sm, marginTop: '0.25rem' }}>
                  {place.unlockCondition.message}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'evidence' && <EvidenceGrid evidence={placeEvidence} investigationId={invId} />}

        {activeTab === 'timeline' && <TimelineView events={placeTimeline} />}

        {activeTab === 'notes' && (
          <NotesPanel notes={placeNotes} onChange={(v) => setNotes(invId, v)} />
        )}

        {activeTab === 'connections' && (
          <div className="max-w-3xl">
            <div style={{ color: colors.archive.blue, fontSize: typography.sizes.xs, fontFamily: typography.mono, letterSpacing: '0.05em', marginBottom: '1rem' }}>
              RESONANCE CONNECTIONS
            </div>
            {place.connectedTo.length === 0 ? (
              <div style={{ color: colors.archive.gray, fontFamily: typography.mono }}>NO CONNECTIONS RECORDED</div>
            ) : (
              <div className="space-y-2">
                {place.connectedTo.map((slug) => (
                  <div
                    key={slug}
                    className="p-3 border flex items-center justify-between"
                    style={{ borderColor: colors.archive.gray, backgroundColor: colors.archive.surface }}
                  >
                    <span style={{ color: colors.archive.white, fontSize: typography.sizes.sm, fontFamily: typography.mono }}>
                      {slug}
                    </span>
                    <span style={{ color: colors.archive.blue, fontSize: typography.sizes.xs, fontFamily: typography.mono }}>
                      [UNRESOLVED]
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};