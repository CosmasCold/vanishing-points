// components/archive/WitnessCounter.tsx
'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

interface WitnessCounterProps {
  booted: boolean;
  witnessCount: number;
  ghostWitness: boolean;
}

export const WitnessCounter = memo(function WitnessCounter({
  booted,
  witnessCount,
  ghostWitness,
}: WitnessCounterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: booted ? 1 : 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      className="absolute top-[72px] md:top-[88px] right-4 md:right-8 z-40 pointer-events-none"
    >
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded border text-[9px] font-mono uppercase tracking-wider"
        style={{
          color: witnessCount > 0 ? '#c4785a' : '#5a4e42',
          borderColor:
            witnessCount > 0
              ? 'rgba(196,120,90,0.25)'
              : 'rgba(122,107,82,0.12)',
          background: 'rgba(12,10,8,0.5)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <Users size={10} className="opacity-50" />
        <span>
          {witnessCount} {witnessCount === 1 ? 'witness' : 'witnesses'}
        </span>
        {ghostWitness && (
          <span className="text-[7px] text-[#c4785a] animate-pulse ml-1">
            +
          </span>
        )}
      </div>
    </motion.div>
  );
});