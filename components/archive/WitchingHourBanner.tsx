// components/archive/WitchingHourBanner.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useWitchingHour } from '@/hooks/useWitchingHour';

export function WitchingHourBanner() {
  const isWitching = useWitchingHour();

  return (
    <AnimatePresence>
      {isWitching && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-[72px] md:top-[88px] left-1/2 -translate-x-1/2 z-50 px-6 py-2 border border-[#c4785a] bg-[#1a0e08]/90 backdrop-blur-sm text-[#c4785a] font-mono text-[10px] tracking-[0.3em] uppercase whitespace-nowrap pointer-events-none shadow-[0_0_30px_rgba(196,120,90,0.15)]"
        >
          ⚡ The grid resonates. Coordinates shift. ⚡
        </motion.div>
      )}
    </AnimatePresence>
  );
}