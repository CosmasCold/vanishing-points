'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Place } from '@/types/places';
import { useInvestigationStore } from '@/state/investigationStore';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography } from '@/styles/theme';
import { PhotoViewer } from '@/components/media/PhotoViewer';

const TABS = ['OVERVIEW', 'EVIDENCE', 'TIMELINE', 'NOTES', 'CONNECTIONS'] as const;

export const InvestigationView: React.FC<{ place: Place }> = ({ place }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const { click } = useAudioStore();
  const { closeInvestigation } = useInvestigationStore();

  return (
    <div className="absolute inset-0 flex flex-col z-10" style={{ backgroundColor: colors.archive.black }}>
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
                    ))}
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
              </div>

              {/* Right: metadata, photos, connections */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
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
                      DANGER LEVEL
                    </div>
                    <div
                      style={{
                        color:
                          place.dangerLevel >= 4
                            ? colors.archive.red
                            : place.dangerLevel >= 3
                            ? colors.archive.amber
                            : colors.archive.green,
                        fontFamily: typography.mono,
                        fontSize: typography.sizes.xl,
                      }}
                    >
                      {place.dangerLevel}/5
                    </div>
                  </div>

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
                      STATUS
                    </div>
                    <div
                      style={{
                        color: colors.archive.white,
                        fontFamily: typography.mono,
                        fontSize: typography.sizes.lg,
                      }}
                    >
                      {(place.status || 'verified').toUpperCase()}
                    </div>
                  </div>

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
                      YEAR
                    </div>
                    <div
                      style={{
                        color: colors.archive.white,
                        fontFamily: typography.mono,
                        fontSize: typography.sizes.lg,
                      }}
                    >
                      {place.yearAbandoned || 'UNKNOWN'}
                    </div>
                  </div>

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
                      EVIDENCE
                    </div>
                    <div
                      style={{
                        color: colors.archive.green,
                        fontFamily: typography.mono,
                        fontSize: typography.sizes.lg,
                      }}
                    >
                      {(place.photos?.length || 0) + (place.hauntingReports?.length || 0)}
                    </div>
                  </div>
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
                  <div
                    style={{
                      color: colors.archive.grayLight,
                      fontFamily: typography.mono,
                      fontSize: typography.sizes.sm,
                    }}
                  >
                    {place.coordinates?.[1]?.toFixed(4)}°N, {place.coordinates?.[0]?.toFixed(4)}°E
                  </div>
                  <div
                    className="mt-1"
                    style={{
                      color: colors.archive.gray,
                      fontFamily: typography.mono,
                      fontSize: typography.sizes.xs,
                    }}
                  >
                    {place.address?.formatted}
                  </div>
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
                {place.connectedTo && place.connectedTo.length > 0 && (
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
                      {place.connectedTo.map((slug) => (
                        <div
                          key={slug}
                          className="px-3 py-2 border text-xs"
                          style={{
                            borderColor: colors.archive.grayDark,
                            color: colors.archive.grayLight,
                            fontFamily: typography.mono,
                          }}
                        >
                          → {slug.replace(/-/g, ' ').toUpperCase()}
                        </div>
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

          {activeTab !== 0 && (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-64"
              style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.sm }}
            >
              <div className="text-center space-y-2">
                <div>{TABS[activeTab]} MODULE INITIALIZING...</div>
                <div style={{ fontSize: typography.sizes.xs, opacity: 0.6 }}>
                  Data sync pending for {place.name}
                </div>
              </div>
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
    </div>
  );
};