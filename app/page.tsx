'use client';

import { AnimatePresence } from 'framer-motion';
import { BootSequence } from '@/components/BootSequence';
import { DashboardShell } from '@/components/DashboardShell';
import { useWorkstationAudio } from '@/hooks/useWorkstationAudio';
import { useProgressionStore } from '@/state/progressionStore';
import { useBootStore } from '@/state/bootStore';

export default function Home() {
  // 1. Pull the boot complete flag and canonical progression metrics from their stores
  const isComplete = useBootStore((s) => s.isComplete);
  const dustIndex = useProgressionStore((s) => s.dustIndex);
  const observerStability = useProgressionStore((s) => s.observerStability);

  // 2. Initialize the ambient mixer hook at the root level.
  // This automatically coordinates ambient sounds, rain volume, and
  // coordinates audio glitches based on Dust Index and Stability!
  const { triggerCrtPowerOn } = useWorkstationAudio({
    isBooted: isComplete,
    dustIndex,
    stability: observerStability,
  });

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#0a0908]">
      <AnimatePresence mode="wait">
        {!isComplete && (
          <BootSequence
            key="boot"
            onPowerOn={triggerCrtPowerOn}
          />
        )}
      </AnimatePresence>
      <DashboardShell />
    </main>
  );
}