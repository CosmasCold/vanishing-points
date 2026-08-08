'use client';

import React from 'react';
import { Place } from '@/types/places';
import { useAtlasStore } from '@/state/atlasStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useAudioStore } from '@/state/audioStore';
import { useUIStore } from '@/state/uiStore';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { colors, typography } from '@/styles/theme';

const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  const s = status || 'verified';
  const color =
    s === 'sealed'
      ? colors.archive.red
      : s === 'whispered'
      ? colors.archive.blue
      : s === 'mirage'
      ? colors.archive.white
      : colors.archive.green;

  return (
    <span
      className="px-2 py-0.5 text-xs border"
      style={{ color, borderColor: color, fontFamily: typography.mono }}
    >
      {s.toUpperCase()}
    </span>
  );
};

const DangerIndicator: React.FC<{ level?: number }> = ({ level = 0 }) => {
  const safeLevel = Math.max(0, Math.min(5, level));
  const color =
    safeLevel >= 4 ? colors.archive.red : safeLevel === 3 ? colors.archive.amber : colors.archive.green;
  return (
    <span style={{ color, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
      {'█'.repeat(safeLevel)}
      {'░'.repeat(5 - safeLevel)}
    </span>
  );
};

const ConnectedPlaceButton: React.FC<{ slug: string }> = ({ slug }) => {
  const { places, selectPlace } = useAtlasStore();
  const place = places.find((p) => p.slug === slug);

  return (
    <button
      onClick={() => place && selectPlace(slug)}
      className="px-2 py-1 text-xs border transition-colors"
      style={{
        borderColor: place ? colors.archive.blue : colors.archive.gray,
        color: place ? colors.archive.blue : colors.archive.gray,
        opacity: place ? 1 : 0.5,
        cursor: place ? 'pointer' : 'default',
        fontFamily: typography.mono,
      }}
    >
      {place ? place.name : `[${slug || 'unknown'}]`}
    </button>
  );
};

export const PlaceDetail: React.FC<{ place: Place }> = ({ place }) => {
  const { openInvestigation, addEvidence, addTimelineEvent, evidence } = useInvestigationStore();
  const { click } = useAudioStore();
  const { investigatePlace } = useUIStore();
  const { selectPlace } = useAtlasStore();
  const { selectNode, setFocusNode, setViewMode } = useEvidenceBoardStore();

  const handleOpenInvestigation = () => {
    click();
    investigatePlace(place.slug);
    selectPlace(place.slug);
    selectNode(place.slug);
    setFocusNode(place.slug);
    setViewMode('detail');
    openInvestigation(place.slug, place.name);

    const generated = evidence[place.slug] || [];
    const hasInitialEntry = generated.some((item) => item.id === `${place.slug}-archive-entry`);

    if (!hasInitialEntry) {
      const connected = (place.connectedTo || []).filter(Boolean);
      const archiveEntry = {
        id: `${place.slug}-archive-entry`,
        type: 'document' as const,
        title: 'Archive Entry',
        description: `Field notes for ${place.name} have been indexed and linked to the active case file.`,
        status: 'available' as const,
        relatedTo: connected,
        dustCost: 1,
        metadata: { source: 'BUNKER_7', state: place.status },
      };

      addEvidence(place.slug, archiveEntry);

      if (connected.length > 0) {
        addEvidence(place.slug, {
          id: `${place.slug}-resonance-thread`,
          type: 'signal' as const,
          title: 'Resonance Thread',
          description: `The archive has linked ${place.name} to ${connected.length} nearby sites.`,
          status: 'available' as const,
          relatedTo: connected,
          dustCost: 2,
        });
      }

      addTimelineEvent(place.slug, {
        id: `${place.slug}-first-contact`,
        date: new Date().toISOString().slice(0, 10),
        title: 'Initial scan complete',
        description: `The archive established a stable link with ${place.name}.`,
        evidenceIds: [archiveEntry.id],
        certainty: 'confirmed' as const,
        category: 'discovery' as const,
      });
    }
  };

  const lat = place.coordinates?.[1];
  const lng = place.coordinates?.[0];

  return (
    <div className="space-y-4 pb-4">
      <div className="border-b pb-3" style={{ borderColor: colors.archive.gray }}>
        <div className="flex justify-between items-start gap-2">
          <h2
            style={{
              color: colors.archive.white,
              fontSize: typography.sizes.lg,
              fontWeight: typography.weights.medium,
            }}
          >
            {place.name || 'Unknown Location'}
          </h2>
          <StatusBadge status={place.status} />
        </div>
        <div
          style={{
            color: colors.archive.gray,
            fontSize: typography.sizes.xs,
            marginTop: '0.25rem',
            fontFamily: typography.mono,
          }}
        >
          {place.address?.formatted || 'Address unverified'}
        </div>
        <div
          style={{
            color: colors.archive.grayLight,
            fontSize: typography.sizes.xs,
            fontFamily: typography.mono,
          }}
        >
          {typeof lat === 'number' ? `${lat.toFixed(4)}°N` : '--°N'}{' '}
          {typeof lng === 'number' ? `${lng.toFixed(4)}°E` : '--°E'}
        </div>
      </div>

      <div
        className="flex flex-wrap gap-3"
        style={{ fontSize: typography.sizes.xs, fontFamily: typography.mono }}
      >
        <span style={{ color: colors.archive.amber }}>
          DANGER <DangerIndicator level={place.dangerLevel} />
        </span>
        {place.yearAbandoned && (
          <span style={{ color: colors.archive.gray }}>
            ABANDONED {place.yearAbandoned}
          </span>
        )}
        <span style={{ color: colors.archive.green }}>
          {(place.category || 'unknown').toUpperCase()}
        </span>
      </div>

      <div>
        <div
          style={{
            color: colors.archive.amber,
            fontSize: typography.sizes.xs,
            fontFamily: typography.mono,
            marginBottom: '0.5rem',
            letterSpacing: '0.05em',
          }}
        >
          CASE HISTORY
        </div>
        <div
          style={{
            color: colors.archive.white,
            fontSize: typography.sizes.sm,
            lineHeight: '1.6',
            opacity: 0.9,
            fontFamily: typography.serif,
          }}
        >
          {place.history || 'No historical records available.'}
        </div>
      </div>

      {place.hauntingReports && place.hauntingReports.length > 0 && (
        <div>
          <div
            style={{
              color: colors.archive.redBright,
              fontSize: typography.sizes.xs,
              fontFamily: typography.mono,
              marginBottom: '0.5rem',
              letterSpacing: '0.05em',
            }}
          >
            WITNESS TESTIMONY / ANOMALY LOG
          </div>
          <div className="space-y-3">
            {place.hauntingReports.map((report, i) => (
              <div
                key={i}
                className="pl-3 border-l-2"
                style={{ borderColor: colors.archive.red }}
              >
                <p
                  style={{
                    color: colors.archive.white,
                    fontSize: typography.sizes.sm,
                    opacity: 0.85,
                    lineHeight: '1.5',
                    fontFamily: typography.serif,
                  }}
                >
                  {report}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {place.connectedTo && place.connectedTo.length > 0 && (
        <div>
          <div
            style={{
              color: colors.archive.blue,
              fontSize: typography.sizes.xs,
              fontFamily: typography.mono,
              marginBottom: '0.5rem',
              letterSpacing: '0.05em',
            }}
          >
            RESONANCE CONNECTIONS
          </div>
          <div className="flex flex-wrap gap-2">
            {place.connectedTo.map((slug) => (
              <ConnectedPlaceButton key={slug} slug={slug} />
            ))}
          </div>
        </div>
      )}

      {place.unlockCondition && (
        <div
          className="p-3 border"
          style={{
            borderColor: colors.archive.amber,
            backgroundColor: 'rgba(184, 149, 106, 0.05)',
          }}
        >
          <div
            style={{
              color: colors.archive.amber,
              fontSize: typography.sizes.xs,
              fontFamily: typography.mono,
            }}
          >
            LOCKED — {(place.unlockCondition.type || 'unknown').toUpperCase()}: {place.unlockCondition.value || '?'}
          </div>
          <p
            style={{
              color: colors.archive.amber,
              fontSize: typography.sizes.sm,
              marginTop: '0.25rem',
              opacity: 0.8,
            }}
          >
            {place.unlockCondition.message || 'Access denied.'}
          </p>
        </div>
      )}

      {place.resonanceNote && (
        <div
          className="p-3 border"
          style={{
            borderColor: colors.archive.blue,
            backgroundColor: 'rgba(106, 122, 138, 0.05)',
          }}
        >
          <div
            style={{
              color: colors.archive.blue,
              fontSize: typography.sizes.xs,
              fontFamily: typography.mono,
              letterSpacing: '0.05em',
            }}
          >
            BUNKER_7 RESONANCE NOTE
          </div>
          <p
            style={{
              color: colors.archive.blueBright,
              fontSize: typography.sizes.sm,
              marginTop: '0.25rem',
              lineHeight: '1.5',
            }}
          >
            {place.resonanceNote}
          </p>
        </div>
      )}

      <button
        onClick={handleOpenInvestigation}
        className="w-full py-2 border transition-colors hover:border-amber-700"
        style={{
          borderColor: colors.archive.amber,
          color: colors.archive.amber,
          fontFamily: typography.mono,
          fontSize: typography.sizes.sm,
          letterSpacing: '0.05em',
        }}
      >
        OPEN INVESTIGATION
      </button>
    </div>
  );
};