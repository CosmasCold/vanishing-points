// components/archive/BottomStatusCluster.tsx
'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Eye } from 'lucide-react';
import Link from 'next/link';
import { useGameState } from '@/logic/gameState';
import { type Place } from '@/logic/gameState';

interface BottomStatusClusterProps {
  booted: boolean;
  visibleCount: number;
  totalCount: number;
  hauntedCount: number;
  abandonedCount: number;
  hoveredPlace: Place | null;
}

export const BottomStatusCluster = memo(function BottomStatusCluster({
  booted,
  visibleCount,
  totalCount,
  hauntedCount,
  abandonedCount,
  hoveredPlace,
}: BottomStatusClusterProps) {
  const state = useGameState();
  const dust = state.dust;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: booted ? 1 : 0 }}
      transition={{ delay: 1.2, duration: 1 }}
      className="absolute bottom-3 md:bottom-8 left-4 md:left-8 z-40 pointer-events-none safe-bottom space-y-2 md:space-y-3"
    >
      {/* Archive stats & Hover Whisper */}
      <div
        className="inline-flex items-center gap-3 md:gap-4 font-mono text-[11px] md:text-xs tracking-wider uppercase px-3 py-2 rounded border"
        style={{
          color: '#9a8a72',
          borderColor: 'rgba(122,107,82,0.15)',
          background: 'rgba(12,10,8,0.6)',
          backdropFilter: 'blur(6px)',
          boxShadow: 'inset 0 1px 0 rgba(122,107,82,0.08)',
        }}
      >
        <StatItem
          icon={<Eye size={11} />}
          value={`${visibleCount} / ${totalCount} documented`}
        />
        <span className="w-px h-3 bg-[#9a8a72]/20" />

        {hoveredPlace?.resonanceNote ? (
          <span className="text-[#c4b8a4] italic text-[10px] max-w-[180px] md:max-w-[280px] truncate transition-all duration-300">
            &ldquo;{hoveredPlace.resonanceNote}&rdquo;
          </span>
        ) : (
          <>
            <span className="hidden sm:inline">{hauntedCount} spectral</span>
            <span className="w-px h-3 bg-[#9a8a72]/20 hidden sm:inline" />
            <span className="hidden sm:inline">{abandonedCount} forsaken</span>
          </>
        )}
      </div>

      {/* Dust accumulation */}
      <div
        className="inline-flex items-center gap-3 font-mono text-[11px] tracking-wider uppercase px-3 py-2 rounded border"
        style={{
          color: dust > 75 ? '#c4785a' : '#7a6e5e',
          borderColor:
            dust > 75 ? 'rgba(196,120,90,0.2)' : 'rgba(122,107,82,0.12)',
          background: 'rgba(12,10,8,0.6)',
          backdropFilter: 'blur(6px)',
          boxShadow: 'inset 0 1px 0 rgba(122,107,82,0.08)',
        }}
      >
        <Activity size={11} className="opacity-50" />
        <span className="opacity-60">Dust</span>
        <div
          className="w-14 h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(90,78,66,0.25)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(dust, 100)}%`,
              background: dust > 75 ? '#c4785a' : '#9a8a72',
              boxShadow: dust > 75 ? '0 0 6px rgba(196,120,90,0.4)' : 'none',
            }}
          />
        </div>
        <span className="tabular-nums font-bold">{dust}%</span>
      </div>

      {/* Anomalous Signal */}
      <div className="pointer-events-auto">
        <Link
          href="/echoes"
          className="group inline-flex items-center gap-2.5 font-mono text-[10px] md:text-[11px] tracking-[0.2em] uppercase px-3 py-2 rounded border transition-all duration-500"
          style={{
            color: '#c4785a',
            borderColor: 'rgba(196,120,90,0.18)',
            background: 'rgba(196,120,90,0.04)',
          }}
        >
          <span className="relative flex h-2 w-2">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40"
              style={{ background: '#c4785a' }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ background: '#c4785a' }}
            />
          </span>
          <span className="group-hover:opacity-100 transition-opacity">
            Signal detected — BUNKER_7
          </span>
          <span className="opacity-40 group-hover:opacity-80 transition-opacity">
            ↳
          </span>
        </Link>
      </div>
    </motion.div>
  );
});

function StatItem({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="opacity-50">{icon}</span>
      <span>{value}</span>
    </span>
  );
}