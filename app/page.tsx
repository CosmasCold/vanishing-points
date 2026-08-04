'use client';

import { BootSequence } from '@/components/BootSequence';
import { DashboardShell } from '@/components/DashboardShell';
import { CRTOverlay } from '@/components/CRTOverlay';
import { AudioEngine } from '@/components/AudioEngine';
import { KeyboardManager } from '@/components/KeyboardManager';
import { CommandProvider } from '@/components/CommandProvider';

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-[#1a1a18]">
      <AudioEngine />
      <CommandProvider />
      <KeyboardManager />
      <CRTOverlay />
      <BootSequence />
      <DashboardShell />
    </main>
  );
}