'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Place } from '@/types/places';
import { EvidenceItem } from '@/types/investigation';
import { useInvestigationStore } from '@/state/investigationStore';
import { useAtlasStore } from '@/state/atlasStore';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography } from '@/styles/theme';
import { EvidenceGrid } from './EvidenceGrid';
import { PhotoViewer } from '@/components/media/PhotoViewer';
import { EvidenceDetail } from './EvidenceDetail';
import { BODIE_WEATHERING_RECORD } from '@/data/investigationEvidence';
import { BODIE_EXPOSURE_RESULT } from '@/data/bodieExposure';
import { BodieExposurePanel } from './BodieExposurePanel';
import { useProgressionStore } from '@/state/progressionStore';

const TABS = ['OVERVIEW', 'EVIDENCE', 'TIMELINE', 'NOTES', 'CONNECTIONS'] as const;

type InvestigationSubject =
  Pick<Place, 'slug' | 'name'> &
  Partial<Omit<Place, 'slug' | 'name'>>;

export const InvestigationView: React.FC<{
  place: InvestigationSubject;
}> = ({ place }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const { click } = useAudioStore();
  const dustIndex = useProgressionStore((state) => state.dustIndex);
  const spendDust = useProgressionStore((state) => state.spendDust);
  const {
    closeInvestigation,
    catalogueEvidence,
    updateEvidenceStatus,
  } = useInvestigationStore();
  const { selectPlace } = useAtlasStore();

  // Notes local state synced with store
  const { notes, setNotes, timelines, evidence: storeEvidence, exposures, recordExposure } = useInvestigationStore();
  const [localNotes, setLocalNotes] = useState(notes[place.slug] || '');

  const handleNotesBlur = () => {
    setNotes(place.slug, localNotes);
  };

  // Evidence is authored/catalogued investigation material, not a projection of every photo or witness report.
  const evidenceItems = useMemo(() => {
    return storeEvidence[place.slug] || [];
  }, [place.slug, storeEvidence]);

  // Derive timeline from place data + store
  const timelineEvents = useMemo(() => {
    const events: { date: string; title: string; body: string }[] = [];

    if (place.yearAbandoned) {
      events.push({
        date: `${place.yearAbandoned}-01-01`,
        title: 'Site Abandoned',
        body: `${place.name} was officially abandoned or sealed.`,
      });
    }

    const stored = timelines[place.slug] || [];
    stored.forEach((e) => events.push({ date: e.date, title: e.title, body: e.description || '' }));

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [place, timelines]);

  // Defensive: filter null/undefined from connectedTo to prevent runtime crashes
  const safeConnections = useMemo(() => {
    return (place.connectedTo || [])
      .filter((placeId) => typeof placeId === 'string' && placeId.length > 0)
      .map((placeId) => placeId.replace(/^place:/, ''));
  }, [place.connectedTo]);

  const progressionSummary = useMemo(() => {
    const unlockedCount = evidenceItems.filter((item) => ['available', 'collected', 'analyzing', 'analyzed', 'viewed'].includes(item.status)).length;
    return {
      unlockedCount,
      timelineCount: timelineEvents.length,
      resonanceCount: safeConnections.length,
    };
  }, [evidenceItems, safeConnections.length, timelineEvents.length]);

  return (
    <div className="absolute inset-0 flex flex-col z-10 mahogany-console">
      {/* Header */}
      <div
        className="shrink-0 border-b px-6 py-4 flex items-center justify-between"
        style={{ borderColor: colors.archive.grayDark }}
      >
        <div>
          <div
            style={{
              color: colors.archive.gray,
              fontFamily: typography.mono,
              fontSize: typography.sizes.xs,
              letterSpacing: '0.1em',
            }}
          >
            CASE FILE
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h1
              style={{
                color: colors.archive.white,
                fontFamily: typography.mono,
                fontSize: typography.sizes.lg,
              }}
            >
              {place.name}
            </h1>
            <span
              className="px-2 py-0.5 border text-xs"
              style={{
                borderColor: colors.archive.amber,
                color: colors.archive.amber,
                fontFamily: typography.mono,
              }}
            >
              {(place.status || 'verified').toUpperCase()}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            click();
            closeInvestigation();
          }}
          className="px-3 py-1 border hover:border-red-700 transition-colors"
          style={{
            borderColor: colors.archive.grayDark,
            color: colors.archive.gray,
            fontFamily: typography.mono,
            fontSize: typography.sizes.xs,
          }}
        >
          CLOSE CASE
        </button>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex border-b" style={{ borderColor: colors.archive.grayDark }}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => {
              click();
              setActiveTab(i);
            }}
            className="px-6 py-3 transition-colors relative"
            style={{
              color: activeTab === i ? colors.archive.amber : colors.archive.gray,
              fontFamily: typography.mono,
              fontSize: typography.sizes.xs,
              letterSpacing: '0.05em',
              borderBottom: activeTab === i ? `2px solid ${colors.archive.amber}` : '2px solid transparent',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 0 && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-8"
            >
              {/* Left: narrative */}
              <div className="lg:col-span-3 space-y-8">
                <section>
                  <h2
                    style={{
                      color: colors.archive.amber,
                      fontFamily: typography.mono,
                      fontSize: typography.sizes.xs,
                      letterSpacing: '0.1em',
                      marginBottom: '1rem',
                    }}
                  >
                    CASE SUMMARY
                  </h2>
                  <div
                    className="leading-relaxed space-y-4"
                    style={{
                      color: colors.archive.grayLight,
                      fontFamily: typography.serif,
                      fontSize: typography.sizes.base,
                    }}
                  >
                    {place.history?.split('\n\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    )) || <p>No historical records available.</p>}
                  </div>
                </section>

                {place.hauntingReports && place.hauntingReports.length > 0 && (
                  <section>
                    <h2
                      style={{
                        color: colors.archive.redBright,
                        fontFamily: typography.mono,
                        fontSize: typography.sizes.xs,
                        letterSpacing: '0.1em',
                        marginBottom: '1rem',
                      }}
                    >
                      WITNESS TESTIMONY
                    </h2>
                    <div className="space-y-3">
                      {place.hauntingReports.map((report, i) => (
                        <div
                          key={i}
                          className="p-4 border-l-2"
                          style={{
                            borderColor: colors.archive.red,
                            backgroundColor: 'rgba(168, 93, 93, 0.05)',
                          }}
                        >
                          <p
                            style={{
                              color: colors.archive.grayLight,
                              fontFamily: typography.serif,
                              fontSize: typography.sizes.sm,
                            }}
                          >
                            "{report}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {place.resonanceNote && (
                  <section
                    className="p-4 border"
                    style={{
                      borderColor: colors.archive.blue,
                      backgroundColor: 'rgba(107, 143, 163, 0.05)',
                    }}
                  >
                    <div
                      style={{
                        color: colors.archive.blue,
                        fontFamily: typography.mono,
                        fontSize: typography.sizes.xs,
                        marginBottom: '0.5rem',
                        letterSpacing: '0.05em',
                      }}
                    >
                      BUNKER_7 RESONANCE LOG
                    </div>
                    <p
                      style={{
                        color: colors.archive.blueBright,
                        fontFamily: typography.serif,
                        fontSize: typography.sizes.sm,
                        fontStyle: 'italic',
                      }}
                    >
                      {place.resonanceNote}
                    </p>
                  </section>
                )}

                {place.slug === 'bodie-ghost-town' && (
                  <section
                    className="p-4 border"
                    style={{
                      borderColor: colors.archive.grayDark,
                      backgroundColor: colors.archive.surface,
                    }}
                  >
                    <div
                      style={{
                        color: colors.archive.gray,
                        fontFamily: typography.mono,
                        fontSize: typography.sizes.xs,
                        marginBottom: '0.75rem',
                        letterSpacing: '0.05em',
                      }}
                    >
                      FIELD REVIEW
                    </div>
                    <p
                      style={{
                        color: colors.archive.grayLight,
                        fontFamily: typography.serif,
                        fontSize: typography.sizes.sm,
                        lineHeight: '1.6',
                        marginBottom: '1rem',
                      }}
                    >
                      The resonance log references weathering records that have not yet been entered into the investigation file.
                    </p>

                    {!evidenceItems.some((item) => item.id === BODIE_WEATHERING_RECORD.id) && (
                      <button
                        onClick={() => {
                          click();
                          catalogueEvidence(place.slug, BODIE_WEATHERING_RECORD);
                        }}
                        className="px-3 py-2 border hover:border-amber-700 transition-colors"
                        style={{
                          borderColor: colors.archive.gray,
                          color: colors.archive.amber,
                          backgroundColor: colors.archive.surfaceRaised,
                          fontFamily: typography.mono,
                          fontSize: typography.sizes.xs,
                          letterSpacing: '0.05em',
                        }}
                      >
                        CATALOGUE WEATHERING RECORD
                      </button>
                    )}

                    {evidenceItems.some((item) => item.id === BODIE_WEATHERING_RECORD.id) && (
                      <div
                        style={{
                          color: colors.archive.green,
                          fontFamily: typography.mono,
                          fontSize: typography.sizes.xs,
                        }}
                      >
                        RECORD CATALOGUED
                      </div>
                    )}
                  </section>
                )}

                {place.slug === 'bodie-ghost-town' &&
                  evidenceItems.some((item) => item.id === BODIE_WEATHERING_RECORD.id) && (
                    <BodieExposurePanel
                      dustIndex={dustIndex}
                      cost={BODIE_EXPOSURE_RESULT.cost}
                      completed={(exposures[place.slug] || []).includes(BODIE_EXPOSURE_RESULT.exposureId)}
                      onInduce={() => {
                        if ((exposures[place.slug] || []).includes(BODIE_EXPOSURE_RESULT.exposureId)) {
                          return {
                            success: false,
                            message: 'Exposure has already been recorded for this case.',
                          };
                        }

                        const spent = spendDust(BODIE_EXPOSURE_RESULT.cost);

                        if (!spent) {
                          return {
                            success: false,
                            message: `BUNKER_7: Exposure request rejected. Insufficient Dust Index. Required: ${BODIE_EXPOSURE_RESULT.cost}. Current: ${dustIndex}.`,
                          };
                        }

                        const recorded = recordExposure(
                          place.slug,
                          BODIE_EXPOSURE_RESULT.exposureId,
                        );

                        if (recorded) {
                          catalogueEvidence(
                            place.slug,
                            BODIE_EXPOSURE_RESULT.resultEvidence,
                          );
                        }

                        return {
                          success: true,
                          message: 'Exposure recorded. A second pattern has been catalogued.',
                        };
                      }}
                    />
                  )}
              </div>

              {/* Right: metadata, photos, connections */}
              <div className="lg:col-span-2 space-y-6">
                <div
                  className="p-4 border"
                  style={{ borderColor: colors.archive.amber, backgroundColor: 'rgba(201, 169, 110, 0.08)' }}
                >
                  <div
                    style={{
                      color: colors.archive.amber,
                      fontFamily: typography.mono,
                      fontSize: typography.sizes.xs,
                      letterSpacing: '0.1em',
                      marginBottom: '0.75rem',
                    }}
                  >
                    ARCHIVE PROGRESSION
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <ProgressPill label="UNLOCKED" value={String(progressionSummary.unlockedCount)} color={colors.archive.green} />
                    <ProgressPill label="TIMELINE" value={String(progressionSummary.timelineCount)} color={colors.archive.blue} />
                    <ProgressPill label="LINKS" value={String(progressionSummary.resonanceCount)} color={colors.archive.amber} />
                    <ProgressPill label="STATE" value="ACTIVE" color={colors.archive.white} />
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  <StatBox
                    label="DANGER LEVEL"
                    value={place.dangerLevel !== undefined ? `${place.dangerLevel}/5` : 'UNKNOWN'}
                    color={
                      place.dangerLevel !== undefined && place.dangerLevel >= 4
                        ? colors.archive.red
                        : place.dangerLevel !== undefined && place.dangerLevel >= 3
                          ? colors.archive.amber
                          : colors.archive.green
                    }
                  />
                  <StatBox
                    label="STATUS"
                    value={(place.status || 'unresolved').toUpperCase()}
                    color={colors.archive.white}
                  />
                  <StatBox label="YEAR" value={place.yearAbandoned ? String(place.yearAbandoned) : 'UNKNOWN'} color={colors.archive.white} />
                  <StatBox label="EVIDENCE" value={String(evidenceItems.length)} color={colors.archive.green} />
                </div>

                {/* Coordinates */}
                <div
                  className="p-4 border"
                  style={{ borderColor: colors.archive.grayDark, backgroundColor: colors.archive.surface }}
                >
                  <div
                    style={{
                      color: colors.archive.gray,
                      fontFamily: typography.mono,
                      fontSize: typography.sizes.xs,
                      marginBottom: '0.5rem',
                    }}
                  >
                    COORDINATES
                  </div>
                  {place.coordinates ? (
                    <>
                      <div
                        style={{
                          color: colors.archive.grayLight,
                          fontFamily: typography.mono,
                          fontSize: typography.sizes.sm,
                        }}
                      >
                        {place.coordinates[1].toFixed(4)}°N, {place.coordinates[0].toFixed(4)}°E
                      </div>
                      {place.address?.formatted && (
                        <div
                          className="mt-1"
                          style={{
                            color: colors.archive.gray,
                            fontFamily: typography.mono,
                            fontSize: typography.sizes.xs,
                          }}
                        >
                          {place.address.formatted}
                        </div>
                      )}
                    </>
                  ) : (
                    <div
                      style={{
                        color: colors.archive.redBright,
                        fontFamily: typography.mono,
                        fontSize: typography.sizes.xs,
                      }}
                    >
                      GEOGRAPHIC RECORD UNRESOLVED
                    </div>
                  )}
                </div>

                {/* Photos */}
                {place.photos && place.photos.length > 0 && (
                  <div>
                    <div
                      style={{
                        color: colors.archive.amber,
                        fontFamily: typography.mono,
                        fontSize: typography.sizes.xs,
                        letterSpacing: '0.1em',
                        marginBottom: '0.75rem',
                      }}
                    >
                      ARCHIVE PHOTOS
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {place.photos.map((src, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            click();
                            setViewingPhoto(src);
                          }}
                          className="relative aspect-video border overflow-hidden group"
                          style={{ borderColor: colors.archive.grayDark }}
                        >
                          <img
                            src={src}
                            alt={`${place.name} ${i + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            style={{ filter: 'sepia(0.3) contrast(1.05)' }}
                            loading="lazy"
                          />
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(20, 20, 18, 0.6)' }}
                          >
                            <span style={{ color: colors.archive.amber, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
                              VIEW
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connected locations */}
                {safeConnections.length > 0 && (
                  <div>
                    <div
                      style={{
                        color: colors.archive.blue,
                        fontFamily: typography.mono,
                        fontSize: typography.sizes.xs,
                        letterSpacing: '0.1em',
                        marginBottom: '0.75rem',
                      }}
                    >
                      RESONANCE LINKS
                    </div>
                    <div className="space-y-2">
                      {safeConnections.map((slug) => (
                        <button
                          key={slug}
                          onClick={() => {
                            click();
                            selectPlace(slug);
                          }}
                          className="w-full text-left px-3 py-2 border text-xs hover:border-blue-700 transition-colors"
                          style={{
                            borderColor: colors.archive.grayDark,
                            color: colors.archive.grayLight,
                            fontFamily: typography.mono,
                          }}
                        >
                          → {(slug ? slug.replace(/-/g, ' ').toUpperCase() : 'UNKNOWN CORES')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unlock condition */}
                {place.unlockCondition && (
                  <div
                    className="p-4 border"
                    style={{
                      borderColor: colors.archive.red,
                      backgroundColor: 'rgba(168, 93, 93, 0.08)',
                    }}
                  >
                    <div
                      style={{
                        color: colors.archive.red,
                        fontFamily: typography.mono,
                        fontSize: typography.sizes.xs,
                        marginBottom: '0.5rem',
                      }}
                    >
                      ACCESS RESTRICTED
                    </div>
                    <p
                      style={{
                        color: colors.archive.redBright,
                        fontFamily: typography.serif,
                        fontSize: typography.sizes.sm,
                      }}
                    >
                      {place.unlockCondition.message}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 1 && (
            <motion.div
              key="evidence"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="mb-4 flex justify-between items-center">
                <h2
                  style={{
                    color: colors.archive.amber,
                    fontFamily: typography.mono,
                    fontSize: typography.sizes.xs,
                    letterSpacing: '0.1em',
                  }}
                >
                  EVIDENCE LOCKER
                </h2>
                <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
                  {evidenceItems.length} ITEMS
                </span>
              </div>
              {evidenceItems.length > 0 ? (
                <EvidenceGrid
                  evidence={evidenceItems}
                  onSelect={(item) => {
                    click();

                    if (item.status !== 'viewed') {
                      updateEvidenceStatus(place.slug, item.id, 'viewed');
                    }

                    setSelectedEvidence({
                      ...item,
                      status: 'viewed',
                    });
                  }}
                />
              ) : (
                <div
                  className="flex items-center justify-center h-48 border"
                  style={{ borderColor: colors.archive.grayDark, color: colors.archive.gray, fontFamily: typography.mono }}
                >
                  No evidence catalogued for this location.
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 2 && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-3xl"
            >
              <h2
                className="mb-6"
                style={{
                  color: colors.archive.amber,
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.xs,
                  letterSpacing: '0.1em',
                }}
              >
                INVESTIGATION TIMELINE
              </h2>
              {timelineEvents.length > 0 ? (
                <div className="relative pl-8 border-l" style={{ borderColor: colors.archive.grayDark }}>
                  {timelineEvents.map((event, i) => (
                    <div key={i} className="mb-8 relative">
                      <div
                        className="absolute -left-[33px] w-3 h-3 rounded-full border"
                        style={{
                          borderColor: colors.archive.amber,
                          backgroundColor: colors.archive.black,
                          top: '0.25rem',
                        }}
                      />
                      <div
                        style={{
                          color: colors.archive.gray,
                          fontFamily: typography.mono,
                          fontSize: typography.sizes.xs,
                          marginBottom: '0.25rem',
                        }}
                      >
                        {event.date}
                      </div>
                      <div
                        style={{
                          color: colors.archive.white,
                          fontFamily: typography.mono,
                          fontSize: typography.sizes.sm,
                          marginBottom: '0.25rem',
                        }}
                      >
                        {event.title}
                      </div>
                      <p
                        style={{
                          color: colors.archive.grayLight,
                          fontFamily: typography.serif,
                          fontSize: typography.sizes.base,
                        }}
                      >
                        {event.body}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="flex items-center justify-center h-48 border"
                  style={{ borderColor: colors.archive.grayDark, color: colors.archive.gray, fontFamily: typography.mono }}
                >
                  No timeline events recorded.
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 3 && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-3xl"
            >
              <h2
                className="mb-4"
                style={{
                  color: colors.archive.amber,
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.xs,
                  letterSpacing: '0.1em',
                }}
              >
                FIELD NOTES
              </h2>
              <textarea
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                onBlur={handleNotesBlur}
                placeholder="Record observations, theories, and connections..."
                className="w-full h-96 p-4 border resize-none focus:outline-none focus:border-amber-700 transition-colors"
                style={{
                  borderColor: colors.archive.grayDark,
                  backgroundColor: colors.archive.surface,
                  color: colors.archive.grayLight,
                  fontFamily: typography.serif,
                  fontSize: typography.sizes.base,
                  lineHeight: '1.7',
                }}
              />
              <div
                className="mt-2 text-right"
                style={{
                  color: colors.archive.gray,
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.xs,
                }}
              >
                {localNotes.length} CHARACTERS • AUTO-SAVED
              </div>
            </motion.div>
          )}

          {activeTab === 4 && (
            <motion.div
              key="connections"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-3xl"
            >
              <h2
                className="mb-6"
                style={{
                  color: colors.archive.blue,
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.xs,
                  letterSpacing: '0.1em',
                }}
              >
                RESONANCE CONNECTIONS
              </h2>
              {safeConnections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {safeConnections.map((slug) => (
                    <ConnectedCard key={slug} slug={slug} onClick={() => { click(); selectPlace(slug); }} />
                  ))}
                </div>
              ) : (
                <div
                  className="flex items-center justify-center h-48 border"
                  style={{ borderColor: colors.archive.grayDark, color: colors.archive.gray, fontFamily: typography.mono }}
                >
                  No resonance links detected.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {viewingPhoto && (
        <PhotoViewer
          src={viewingPhoto}
          title={place.name}
          onClose={() => setViewingPhoto(null)}
        />
      )}

      {selectedEvidence && (
        <EvidenceDetail
          evidence={selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
        />
      )}
    </div>
  );
};

/* Subcomponents */

const ProgressPill: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className="p-3 border" style={{ borderColor: colors.archive.grayDark, backgroundColor: colors.archive.surface }}>
    <div style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs, marginBottom: '0.3rem' }}>
      {label}
    </div>
    <div style={{ color, fontFamily: typography.mono, fontSize: typography.sizes.lg }}>{value}</div>
  </div>
);

const StatBox: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div
    className="p-4 border"
    style={{ borderColor: colors.archive.grayDark, backgroundColor: colors.archive.surface }}
  >
    <div
      style={{
        color: colors.archive.gray,
        fontFamily: typography.mono,
        fontSize: typography.sizes.xs,
        marginBottom: '0.5rem',
      }}
    >
      {label}
    </div>
    <div
      style={{
        color,
        fontFamily: typography.mono,
        fontSize: typography.sizes.xl,
      }}
    >
      {value}
    </div>
  </div>
);

const ConnectedCard: React.FC<{ slug: string; onClick: () => void }> = ({ slug, onClick }) => {
  const { places } = useAtlasStore();
  const target = places.find((p) => p.slug === slug);

  return (
    <button
      onClick={onClick}
      className="p-4 border text-left transition-all hover:-translate-y-0.5 btn-tactile"
      style={{ borderColor: colors.archive.grayDark, backgroundColor: colors.archive.surface }}
    >
      <div
        style={{
          color: colors.archive.white,
          fontFamily: typography.mono,
          fontSize: typography.sizes.sm,
          marginBottom: '0.5rem',
        }}
      >
        {target ? target.name : slug.replace(/-/g, ' ').toUpperCase()}
      </div>
      {target && (
        <div className="flex gap-3" style={{ fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
          <span style={{ color: target.status === 'sealed' ? colors.archive.red : colors.archive.green }}>
            {(target.status || 'verified').toUpperCase()}
          </span>
          <span style={{ color: colors.archive.gray }}>
            D{target.dangerLevel || 0}
          </span>
        </div>
      )}
      {!target && (
        <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
          COORDINATES UNVERIFIED
        </span>
      )}
    </button>
  )}