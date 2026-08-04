'use client';

import React, { useEffect } from 'react';
import { useAtlasStore } from '@/state/atlasStore';
import { fetchPlaces } from '@/data/places';
import { PlaceDetail } from './PlaceDetail';
import { colors, typography } from '@/styles/theme';

function getDangerColor(level: number): string {
  if (level >= 4) return colors.archive.red;
  if (level === 3) return colors.archive.amber;
  return colors.archive.green;
}

export const AtlasPanel: React.FC = () => {
  const {
    places,
    isLoading,
    setPlaces,
    setLoading,
    selectedPlaceId,
    selectPlace,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    clearFilters,
  } = useAtlasStore();

  useEffect(() => {
    setLoading(true);
    fetchPlaces().then((data) => {
      setPlaces(data);
      setLoading(false);
    });
  }, [setPlaces, setLoading]);

  const selectedPlace = places.find((p) => p.slug === selectedPlaceId);

  const filtered = places.filter((p) => {
    if (filterCategory && p.category !== filterCategory) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ fontFamily: typography.mono }}>
        <div style={{ color: colors.archive.amber }} className="animate-pulse">
          SYNCHRONIZING ARCHIVE...
        </div>
      </div>
    );
  }

  if (selectedPlace) {
    return (
      <div className="h-full flex flex-col">
        <button
          onClick={() => selectPlace(null)}
          className="mb-3 text-left hover:opacity-70 transition-opacity"
          style={{ color: colors.archive.gray, fontSize: typography.sizes.xs, fontFamily: typography.mono }}
        >
          ← RETURN TO ATLAS
        </button>
        <div className="flex-1 overflow-y-auto">
          <PlaceDetail place={selectedPlace} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 space-y-3">
        <div style={{ color: colors.archive.amber, fontSize: typography.sizes.xs, fontFamily: typography.mono, letterSpacing: '0.05em' }}>
          ATLAS FILTERS
        </div>

        <div className="space-y-2">
          <div style={{ color: colors.archive.grayLight, fontSize: typography.sizes.xs, fontFamily: typography.mono }}>
            CATEGORY
          </div>
          <div className="flex gap-1">
            {(['abandoned', 'haunted', 'both'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                className="px-2 py-1 text-xs border transition-colors"
                style={{
                  borderColor: filterCategory === cat ? colors.archive.amber : colors.archive.gray,
                  color: filterCategory === cat ? colors.archive.amber : colors.archive.grayLight,
                  backgroundColor: filterCategory === cat ? 'rgba(184, 149, 106, 0.1)' : 'transparent',
                  fontFamily: typography.mono,
                }}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div style={{ color: colors.archive.grayLight, fontSize: typography.sizes.xs, fontFamily: typography.mono }}>
            STATUS
          </div>
          <div className="flex flex-wrap gap-1">
            {(['verified', 'sealed', 'whispered', 'mirage'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(filterStatus === st ? null : st)}
                className="px-2 py-1 text-xs border transition-colors"
                style={{
                  borderColor: filterStatus === st ? colors.archive.blue : colors.archive.gray,
                  color: filterStatus === st ? colors.archive.blue : colors.archive.grayLight,
                  backgroundColor: filterStatus === st ? 'rgba(106, 122, 138, 0.1)' : 'transparent',
                  fontFamily: typography.mono,
                }}
              >
                {st.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {(filterCategory || filterStatus) && (
          <button
            onClick={clearFilters}
            className="hover:opacity-70 transition-opacity"
            style={{ color: colors.archive.gray, fontSize: typography.sizes.xs, fontFamily: typography.mono }}
          >
            [CLEAR FILTERS]
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        <div className="flex justify-between items-baseline mb-2" style={{ fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
          <span style={{ color: colors.archive.gray }}>LOCATIONS</span>
          <span style={{ color: colors.archive.amber }}>{filtered.length}</span>
        </div>

        {filtered.map((place) => (
          <button
            key={place.slug}
            onClick={() => selectPlace(place.slug)}
            className="w-full text-left p-2 border transition-colors hover:border-amber-700"
            style={{ borderColor: colors.archive.gray, backgroundColor: colors.archive.surface }}
          >
            <div className="flex justify-between items-start">
              <span style={{ color: colors.archive.white, fontSize: typography.sizes.sm }}>
                {place.name}
              </span>
              <span style={{ color: getDangerColor(place.dangerLevel), fontSize: typography.sizes.xs, fontFamily: typography.mono }}>
                D{place.dangerLevel}
              </span>
            </div>
            <div className="flex justify-between mt-1" style={{ fontSize: typography.sizes.xs, color: colors.archive.gray, fontFamily: typography.mono }}>
              <span>{place.address.country}</span>
              <span style={{ color: place.status !== 'verified' ? colors.archive.blue : colors.archive.gray }}>
                {place.status.toUpperCase()}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};