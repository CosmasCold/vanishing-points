import { create } from 'zustand';
import { BootPhase, BootPhaseConfig } from '@/types';

const BOOT_PHASES: BootPhaseConfig[] = [
  { id: 'POWER_RESTORED', label: 'POWER RESTORED', duration: 800, detail: 'Main bus online' },
  { id: 'KERNEL_LOAD', label: 'Loading Archive Kernel...', duration: 600, detail: 'v2.4.1-stable' },
  { id: 'ATLAS_INIT', label: 'Initializing Atlas...', duration: 900, detail: 'Geographic index loaded' },
  { id: 'INTEGRITY_CHECK', label: 'Checking Integrity...', duration: 700, detail: 'No corruption detected' },
  { id: 'INVESTIGATIONS_LOAD', label: 'Loading Investigations...', duration: 500, detail: '47 active cases' },
  { id: 'EVIDENCE_SYNC', label: 'Synchronizing Evidence...', duration: 800, detail: 'Remote repository synced' },
  { id: 'CACHE_LOAD', label: 'Loading Local Cache...', duration: 400, detail: '1.2 MB recovered' },
  { id: 'DUST_INDEX', label: 'Dust Index: Stable', duration: 600, detail: 'Accumulation within tolerance' },
  { id: 'COMPLETE', label: 'Good evening, Investigator.', duration: 0, detail: 'Archive ready' },
];

interface BootState {
  phase: BootPhase;
  phaseIndex: number;
  isComplete: boolean;
  phases: BootPhaseConfig[];
  startBoot: () => void;
  advancePhase: () => void;
  reset: () => void;
}

export const useBootStore = create<BootState>((set, get) => ({
  phase: 'POWER_RESTORED',
  phaseIndex: 0,
  isComplete: false,
  phases: BOOT_PHASES,
  
  startBoot: () => {
    set({ phase: 'POWER_RESTORED', phaseIndex: 0, isComplete: false });
    get().advancePhase();
  },
  
  advancePhase: () => {
    const { phaseIndex, phases } = get();
    if (phaseIndex >= phases.length - 1) {
      set({ isComplete: true });
      return;
    }
    
    const nextIndex = phaseIndex + 1;
    const nextPhase = phases[nextIndex];
    
    setTimeout(() => {
      set({ phase: nextPhase.id, phaseIndex: nextIndex });
      if (nextPhase.id !== 'COMPLETE') {
        get().advancePhase();
      } else {
        set({ isComplete: true });
      }
    }, phases[phaseIndex].duration);
  },
  
  reset: () => set({ phase: 'POWER_RESTORED', phaseIndex: 0, isComplete: false }),
}));