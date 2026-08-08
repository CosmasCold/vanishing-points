'use client';

import { AnimatePresence } from 'framer-motion';
import { BootSequence } from '@/components/BootSequence';
import { DashboardShell } from '@/components/DashboardShell';
import { useWorkstationAudio } from '@/hooks/useWorkstationAudio';
import { useUIStore } from '@/state/uiStore';
import { useBootStore } from '@/state/bootStore';

export default function Home() {
  // 1. Pull the boot complete flag and status metrics from your stores
  const isComplete = useBootStore((s) => s.isComplete);
  const { status } = useUIStore();

  // 2. Initialize the ambient mixer hook at the root level.
  // This automatically coordinates ambient sounds, rain volume, and 
  // coordinates audio glitches based on Dust Index and Stability!
  const { triggerCrtPowerOn } = useWorkstationAudio({
    isBooted: isComplete,
    dustIndex: status.dustIndex,
    stability: status.observerStability,
  });

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#0a0908]">
      <AnimatePresence mode="wait">
        {!isComplete && (
          <BootSequence 
            key="boot" 
            onPowerOn={triggerCrtPowerOn} // We can pass this callback down to trigger the monitor hum!
          />
        )}
      </AnimatePresence>
      <DashboardShell />
    </main>
  );
}