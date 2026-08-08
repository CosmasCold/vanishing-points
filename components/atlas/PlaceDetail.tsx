'use client';

import React from 'react';
import { Place } from '@/types/places';
import { useAtlasStore } from '@/state/atlasStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useAudioStore } from '@/state/audioStore';
import { useUIStore } from '@/state/uiStore';
import { colors, typography } from '@/styles/theme';

const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  const s = status || 'verified';
  const color = s === 'sealed' ? colors.archive.red : s === 'whispered' ? colors.archive.blue : s === 'mirage' ? colors.archive.white : colors.archive.green;
  return (
    <span className="px-2 py-0.5 text-xs border" style={{ color, borderColor: color, fontFamily: typography.mono }} >
      {s.toUpperCase()}
    </span>
  );
};

const DangerIndicator: React.FC<{ level?: number }> = ({ level = 0 }) => {
  const safeLevel = Math.max(0, Math.min(5, level));
  const color = safeLevel >= 4 ? colors.archive.red : safeLevel === 3 ? colors.archive.amber : colors.archive.green;
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
  const { openInvestigation } = useInvestigationStore();
  const { click } = useAudioStore();
  const { investigatePlace, status } = useUIStore();

  const dustIndex = status.dustIndex;
  
  // Progression gate check
  const isLocked = React.useMemo(() => {
    if (!place.unlockCondition) return false;
    if (place.unlockCondition.type === 'dust') {
      return dustIndex < Number(place.unlockCondition.value);
    }
    return false;
  }, [place.unlockCondition, dustIndex]);

  const handleOpenInvestigation = () => {
    if (isLocked) return;
    click();
    investigatePlace(place.slug);
    openInvestigation(place.slug, place.name);
  };

  const lat = place.coordinates?.[1];
  const lng = place.coordinates?.[0];

  return (
    <div className="space-y-4 pb-4">
      <div className="border-b pb-3" style={{ borderColor: colors.archive.gray }}>
        <div className="flex justify-between items-start gap-2">
          <h2 style={{ color: colors.archive.white, fontSize: typography.sizes.lg, fontWeight: typography.weights.medium }} >
            {place.name || 'Unknown Location'}
          </h2>
          <StatusBadge status={place.status} />
        </div>
        <div style={{ color: colors.archive.gray, fontSize: typography.sizes.xs, marginTop: '0.25rem', fontFamily: typography.mono }} >
          {place.address?.formatted || 'Address unverified'}
        </div>
        <div style={{ color: colors.archive.grayLight, fontSize: typography.sizes.xs, fontFamily: typography.mono }} >
          {typeof lat === 'number' ? `${lat.toFixed(4)}°N` : '--°N'}{' '}
          {typeof lng === 'number' ? `${lng.toFixed(4)}°E` : '--°E'}
        </div>
      </div>

      <div className="space-y-2">
        <div style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif', fontSize: typography.sizes.sm, color: colors.archive.grayLight, lineHeight: 1.6 }}>
          {place.history}
        </div>
      </div>

      <div className="space-y-2">
        <div style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs, letterSpacing: '0.05em' }}>
          DANGER INDEX
        </div>
        <div className="flex items-center gap-2">
          <DangerIndicator level={place.dangerLevel} />
          <span style={{ color: colors.archive.grayLight, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
            D{place.dangerLevel}
          </span>
        </div>
      </div>

      {place.unlockCondition && (
        <div className="p-3 border" style={{ borderColor: isLocked ? colors.archive.red : colors.archive.green, backgroundColor: 'rgba(20, 20, 18, 0.4)' }}>
          <div style={{ color: isLocked ? colors.archive.red : colors.archive.green, fontFamily: typography.mono, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold }}>
            {isLocked ? 'DECRYPTION LOCKED' : 'DECRYPTION CLEARED'}
          </div>
          <div style={{ color: colors.archive.white, fontFamily: typography.mono, fontSize: typography.sizes.xs, marginTop: '0.25rem' }}>
            {place.unlockCondition.message}
          </div>
          {place.unlockCondition.type === 'dust' && (
            <div className="mt-2 text-xs" style={{ fontFamily: typography.mono, color: colors.archive.gray }}>
              Current Dust: {dustIndex} / Required: {place.unlockCondition.value}
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleOpenInvestigation}
        disabled={isLocked}
        className="w-full py-2.5 border transition-all text-center tracking-wider"
        style={{
          borderColor: isLocked ? colors.archive.grayDark : colors.archive.amber,
          color: isLocked ? colors.archive.gray : colors.archive.amber,
          backgroundColor: isLocked ? 'transparent' : 'rgba(201, 169, 110, 0.05)',
          fontFamily: typography.mono,
          fontSize: typography.sizes.xs,
          cursor: isLocked ? 'not-allowed' : 'pointer'
        }}
      >
        {isLocked ? 'ENCRYPTED LOGS SEALED' : 'INITIALIZE FIELD DOSSIER'}
      </button>

      {place.connectedTo && place.connectedTo.length > 0 && (
        <div className="space-y-2">
          <div style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs, letterSpacing: '0.05em' }}>
            RESONANCE CONNECTIONS
          </div>
          <div className="flex flex-wrap gap-2">
            {place.connectedTo.map((slug) => (
              slug && <ConnectedPlaceButton key={slug} slug={slug} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
