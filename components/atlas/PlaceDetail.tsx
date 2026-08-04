'use client';

import React from 'react';
import { Place } from '@/types/places';
import { useAtlasStore } from '@/state/atlasStore';
import { colors, typography } from '@/styles/theme';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const color =
    status === 'sealed' ? colors.archive.red :
    status === 'whispered' ? colors.archive.blue :
    status === 'mirage' ? colors.archive.white :
    colors.archive.green;

  return (
    <span className="px-2 py-0.5 text-xs border" style={{ color, borderColor: color, fontFamily: typography.mono }}>
      {status.toUpperCase()}
    </span>
  );
};

const DangerIndicator: React.FC<{ level: number }> = ({ level }) => {
  const color = level >= 4 ? colors.archive.red : level === 3 ? colors.archive.amber : colors.archive.green;
  return (
    <span style={{ color, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
      {'█'.repeat(level)}{'░'.repeat(5 - level)}
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
      {place ? place.name : `[${slug}]`}
    </button>
  );
};

export const PlaceDetail: React.FC<{ place: Place }> = ({ place }) => {
  return (
    <div className="space-y-4 pb-4">
      <div className="border-b pb-3" style={{ borderColor: colors.archive.gray }}>
        <div className="flex justify-between items-start gap-2">
          <h2 style={{ color: colors.archive.white, fontSize: typography.sizes.lg, fontWeight: typography.weights.medium }}>
            {place.name}
          </h2>
          <StatusBadge status={place.status} />
        </div>
        <div style={{ color: colors.archive.gray, fontSize: typography.sizes.xs, marginTop: '0.25rem', fontFamily: typography.mono }}>
          {place.address.formatted}
        </div>
        <div style={{ color: colors.archive.grayLight, fontSize: typography.sizes.xs, fontFamily: typography.mono }}>
          {place.coordinates[1].toFixed(4)}°N {place.coordinates[0].toFixed(4)}°E
        </div>
      </div>

      <div className="flex flex-wrap gap-3" style={{ fontSize: typography.sizes.xs, fontFamily: typography.mono }}>
        <span style={{ color: colors.archive.amber }}>DANGER <DangerIndicator level={place.dangerLevel} /></span>
        {place.yearAbandoned && <span style={{ color: colors.archive.gray }}>ABANDONED {place.yearAbandoned}</span>}
        <span style={{ color: colors.archive.green }}>{place.category.toUpperCase()}</span>
      </div>

      <div>
        <div style={{ color: colors.archive.amber, fontSize: typography.sizes.xs, fontFamily: typography.mono, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
          CASE HISTORY
        </div>
        <div style={{ color: colors.archive.white, fontSize: typography.sizes.sm, lineHeight: '1.6', opacity: 0.9, fontFamily: typography.serif }}>
          {place.history}
        </div>
      </div>

      {place.hauntingReports.length > 0 && (
        <div>
          <div style={{ color: colors.archive.redBright, fontSize: typography.sizes.xs, fontFamily: typography.mono, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
            WITNESS TESTIMONY / ANOMALY LOG
          </div>
          <div className="space-y-3">
            {place.hauntingReports.map((report, i) => (
              <div key={i} className="pl-3 border-l-2" style={{ borderColor: colors.archive.red }}>
                <p style={{ color: colors.archive.white, fontSize: typography.sizes.sm, opacity: 0.85, lineHeight: '1.5', fontFamily: typography.serif }}>
                  {report}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {place.connectedTo.length > 0 && (
        <div>
          <div style={{ color: colors.archive.blue, fontSize: typography.sizes.xs, fontFamily: typography.mono, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
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
        <div className="p-3 border" style={{ borderColor: colors.archive.amber, backgroundColor: 'rgba(184, 149, 106, 0.05)' }}>
          <div style={{ color: colors.archive.amber, fontSize: typography.sizes.xs, fontFamily: typography.mono }}>
            LOCKED — {place.unlockCondition.type.toUpperCase()}: {place.unlockCondition.value}
          </div>
          <p style={{ color: colors.archive.amber, fontSize: typography.sizes.sm, marginTop: '0.25rem', opacity: 0.8 }}>
            {place.unlockCondition.message}
          </p>
        </div>
      )}

      {place.resonanceNote && (
        <div className="p-3 border" style={{ borderColor: colors.archive.blue, backgroundColor: 'rgba(106, 122, 138, 0.05)' }}>
          <div style={{ color: colors.archive.blue, fontSize: typography.sizes.xs, fontFamily: typography.mono, letterSpacing: '0.05em' }}>
            BUNKER_7 RESONANCE NOTE
          </div>
          <p style={{ color: colors.archive.blueBright, fontSize: typography.sizes.sm, marginTop: '0.25rem', lineHeight: '1.5' }}>
            {place.resonanceNote}
          </p>
        </div>
      )}
    </div>
  );
};