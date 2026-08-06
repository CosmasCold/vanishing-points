'use client';
import { AnimatePresence } from 'framer-motion';
import { BootSequence } from '@/components/BootSequence';
import { DashboardShell } from '@/components/DashboardShell';

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-[#0a0908]">
      <AnimatePresence mode="wait">
        <BootSequence key="boot" />
      </AnimatePresence>
      <DashboardShell />
    </main>
  );
}