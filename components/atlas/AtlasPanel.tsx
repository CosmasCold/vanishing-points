'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAtlasStore } from '@/state/atlasStore';
import { PlaceDetail } from './PlaceDetail';
import { colors, typography, microform } from '@/styles/theme';

function getDangerColor(level: number): string {
  if (level >= 4) return colors.archive.red;
  if (level === 3) return colors.archive.amber;
  return colors.archive.green;
}

export const AtlasPanel: React.FC = () => {
  const {
    places,
    selectedPlaceSlug,
    filterCategory,
    filterStatus,
    selectPlace,
    setFilterCategory,
    setFilterStatus,
    clearFilters,
  } = useAtlasStore();

  const selectedPlace = places.find(
    (place) => place.slug === selectedPlaceSlug
  );

  const filtered = places.filter((place) => {
    if (filterCategory && place.category !== filterCategory) {
      return false;
    }

    if (filterStatus && place.status !== filterStatus) {
      return false;
    }

    return true;
  });

  if (selectedPlace) {
    return (
      <div className="h-full flex flex-col">
        <button
          onClick={() => selectPlace(null)}
          className="mb-3 text-left transition-all hover:opacity-70 px-2 py-1"
          style={{
            color: colors.archive.gray,
            fontSize: typography.sizes.xs,
            fontFamily: typography.mono,
            border: `1px solid ${microform.iron}`,
            background: microform.mahogany,
            width: 'fit-content',
          }}
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
      {/* Stamped header */}
      <div
        className="mb-4 pb-3"
        style={{
          borderBottom: `1px solid ${microform.mahoganyLight}`,
        }}
      >
        <div
          className="text-[10px] tracking-[0.15em] mb-3"
          style={{
            color: microform.halogen,
            fontFamily: typography.mono,
            textShadow: microform.halogenText,
          }}
        >
          ATLAS FILTERS
        </div>

        {/* Category toggles */}
        <div className="mb-3">
          <div
            className="mb-1.5"
            style={{
              color: colors.archive.gray,
              fontSize: '0.5625rem',
              fontFamily: typography.mono,
              letterSpacing: '0.06em',
            }}
          >
            CATEGORY
          </div>

          <div className="flex gap-1">
            {(['abandoned', 'haunted', 'both'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  setFilterCategory(
                    filterCategory === cat ? null : cat
                  )
                }
                className="px-2 py-1 text-[10px] transition-all duration-150"
                style={{
                  border: `1px solid ${
                    filterCategory === cat
                      ? colors.archive.amber
                      : microform.iron
                  }`,
                  color:
                    filterCategory === cat
                      ? colors.archive.amber
                      : colors.archive.gray,
                  background:
                    filterCategory === cat
                      ? `linear-gradient(
                          180deg,
                          ${microform.mahogany} 0%,
                          ${microform.iron} 100%
                        )`
                      : microform.iron,
                  fontFamily: typography.mono,
                  letterSpacing: '0.04em',
                  boxShadow:
                    filterCategory === cat
                      ? `inset 0 0 8px ${microform.halogenDim}`
                      : 'none',
                }}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Status toggles */}
        <div className="mb-3">
          <div
            className="mb-1.5"
            style={{
              color: colors.archive.gray,
              fontSize: '0.5625rem',
              fontFamily: typography.mono,
              letterSpacing: '0.06em',
            }}
          >
            STATUS
          </div>

          <div className="flex flex-wrap gap-1">
            {(['verified', 'sealed', 'whispered', 'mirage'] as const).map(
              (st) => (
                <button
                  key={st}
                  onClick={() =>
                    setFilterStatus(
                      filterStatus === st ? null : st
                    )
                  }
                  className="px-2 py-1 text-[10px] transition-all duration-150"
                  style={{
                    border: `1px solid ${
                      filterStatus === st
                        ? colors.archive.blue
                        : microform.iron
                    }`,
                    color:
                      filterStatus === st
                        ? colors.archive.blue
                        : colors.archive.gray,
                    background:
                      filterStatus === st
                        ? `linear-gradient(
                            180deg,
                            ${microform.mahogany} 0%,
                            ${microform.iron} 100%
                          )`
                        : microform.iron,
                    fontFamily: typography.mono,
                    letterSpacing: '0.04em',
                    boxShadow:
                      filterStatus === st
                        ? 'inset 0 0 8px rgba(107, 143, 163, 0.15)'
                        : 'none',
                  }}
                >
                  {st.toUpperCase()}
                </button>
              )
            )}
          </div>
        </div>

        {(filterCategory || filterStatus) && (
          <button
            onClick={clearFilters}
            className="transition-opacity hover:opacity-70"
            style={{
              color: colors.archive.gray,
              fontSize: typography.sizes.xs,
              fontFamily: typography.mono,
            }}
          >
            [CLEAR FILTERS]
          </button>
        )}
      </div>

      {/* Location index cards */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        <div
          className="flex justify-between items-baseline mb-2 pb-1"
          style={{
            borderBottom: `1px solid ${microform.iron}`,
          }}
        >
          <span
            style={{
              color: colors.archive.gray,
              fontFamily: typography.mono,
              fontSize: '0.5625rem',
              letterSpacing: '0.06em',
            }}
          >
            LOCATIONS
          </span>

          <span
            style={{
              color: microform.halogen,
              fontFamily: typography.mono,
              fontSize: '0.5625rem',
            }}
          >
            {filtered.length}
          </span>
        </div>

        {filtered.map((place, i) => (
          <motion.button
            key={place.slug}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: i * 0.02,
              duration: 0.2,
            }}
            onClick={() => selectPlace(place.slug)}
            className="w-full text-left transition-all duration-200"
            style={{
              padding: '0.625rem',
              background: `linear-gradient(
                180deg,
                ${colors.archive.surfaceRaised} 0%,
                ${colors.archive.surface} 100%
              )`,
              border: `1px solid ${microform.iron}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
            whileHover={{
              borderColor: microform.mahoganyLight,
              boxShadow: `0 2px 8px rgba(0,0,0,0.4),
                inset 0 0 8px ${microform.halogenDim}`,
            }}
          >
            <div className="flex justify-between items-start">
              <span
                style={{
                  color: colors.archive.white,
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.sm,
                }}
              >
                {place.name}
              </span>

              <span
                className="px-1.5 py-0.5 text-[10px] border shrink-0 ml-2"
                style={{
                  borderColor: getDangerColor(place.dangerLevel),
                  color: getDangerColor(place.dangerLevel),
                  fontFamily: typography.mono,
                  backgroundColor: 'rgba(20,20,18,0.6)',
                }}
              >
                D{place.dangerLevel}
              </span>
            </div>

            <div
              className="flex justify-between mt-1.5"
              style={{
                fontSize: '0.5625rem',
                color: colors.archive.gray,
                fontFamily: typography.mono,
                letterSpacing: '0.04em',
              }}
            >
              <span>
                {place.address?.country || 'UNKNOWN'}
              </span>

              <span
                style={{
                  color:
                    place.status !== 'verified'
                      ? colors.archive.blue
                      : colors.archive.gray,
                }}
              >
                {place.status.toUpperCase()}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default AtlasPanel;