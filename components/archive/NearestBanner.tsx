// components/archive/NearestBanner.tsx
'use client';

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Place } from '@/logic/gameState';

interface NearestBannerProps {
  nearest: { place: Place; distance: number } | null;
  onOpenPlace: (place: Place) => void;
  onClear: () => void;
}

export const NearestBanner = memo(function NearestBanner({
  nearest,
  onOpenPlace,
  onClear,
}: NearestBannerProps) {
  return (
    <AnimatePresence>
      {nearest && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-20 md:top-28 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-40 rounded-lg px-4 md:px-6 py-3 md:py-4 max-w-md"
          style={{
            background:
              'linear-gradient(180deg, rgba(18,14,10,0.95), rgba(12,10,8,0.95))',
            border: '1px solid rgba(122,107,82,0.2)',
            borderLeft: '3px solid #9a8a72',
            boxShadow:
              '0 12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(122,107,82,0.08)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[9px] md:text-[10px] font-mono uppercase tracking-[0.2em] text-[#9a8a72] mb-1">
                Nearest documented ruin
              </p>
              <p className="font-cinzel text-sm md:text-base text-[#ddd0bc] truncate leading-tight">
                {nearest.place.name}
              </p>
              <p className="text-[10px] md:text-[11px] font-mono text-[#7a6e5e] mt-1 tracking-wider">
                {Math.round(nearest.distance)} km away
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
              <button
                onClick={() => {
                  onOpenPlace(nearest.place);
                  onClear();
                }}
                className="px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider transition-all active:scale-95"
                style={{
                  color: '#c4b8a4',
                  background: 'rgba(122,107,82,0.12)',
                  border: '1px solid rgba(122,107,82,0.2)',
                }}
              >
                Open
              </button>
              <button
                onClick={onClear}
                className="text-[#9a8a72] hover:text-[#ddd0bc] text-lg leading-none px-1 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});