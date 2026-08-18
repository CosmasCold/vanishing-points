import { create } from 'zustand';
import { ModuleId } from '@/types';
import { useProgressionStore } from '@/state/progressionStore';

export const DUST_THRESHOLDS = {
  NOMINAL: 0,
  LOW: 15,
  MODERATE: 40,
  HIGH: 70,
  EXTREME: 90,
};

export const STABILITY_THRESHOLDS = {
  NOMINAL: 90,
  STABLE: 70,
  DEGRADED: 45,
  CRITICAL: 20,
  UNSTABLE: 0,
};

export const BUNKER7_THRESHOLDS = {
  STABLE: 15,
  UNSTABLE: 50,
};

/**
 * UI-only status projection.
 *
 * Canonical progression data does NOT live here.
 *
 * Progression state is owned by progressionStore.ts:
 * - dustIndex
 * - observerStability
 * - investigatedPlaceIds
 * - sessionWorkDone
 * - atlasCoverage
 *
 * Active alerts remain UI presentation state.
 */
export interface Status {
  activeAlerts: number;
}

interface UIState {
  booted: boolean;
  activeModule: ModuleId | null;
  terminalOpen: boolean;
  prologueComplete: boolean;
  guideOpen: boolean;

  /**
   * UI-only presentation state.
   *
   * Do not use this as a source of progression truth.
   */
  status: Status;

  setBooted: (booted: boolean) => void;
  setActiveModule: (module: ModuleId | null) => void;
  setTerminalOpen: (open: boolean) => void;
  setPrologueComplete: () => void;
  setGuideOpen: (open: boolean) => void;

  catalogue: () => string;
  profile: () => string;
}

export const useUIStore = create<UIState>((set, get) => ({
  booted: false,
  activeModule: null,
  terminalOpen: false,
  prologueComplete: false,
  guideOpen: false,

  status: {
    activeAlerts: 0,
  },

  setBooted: (booted) =>
    set({ booted }),

  setActiveModule: (activeModule) =>
    set({ activeModule }),

  setTerminalOpen: (terminalOpen) =>
    set({ terminalOpen }),

  setPrologueComplete: () =>
    set({ prologueComplete: true }),

  setGuideOpen: (guideOpen) =>
    set({ guideOpen }),

  catalogue: () => {
    /*
     * Dust is canonical in progressionStore.
     *
     * Never read Dust from UI state.
     */
    const dustIndex =
      useProgressionStore.getState().dustIndex;

    if (
      dustIndex >=
      DUST_THRESHOLDS.EXTREME
    ) {
      return 'EXTREME';
    }

    if (
      dustIndex >=
      DUST_THRESHOLDS.HIGH
    ) {
      return 'HIGH';
    }

    if (
      dustIndex >=
      DUST_THRESHOLDS.MODERATE
    ) {
      return 'MODERATE';
    }

    if (
      dustIndex >=
      DUST_THRESHOLDS.LOW
    ) {
      return 'LOW';
    }

    return 'NOMINAL';
  },

  profile: () =>
    'INV_RED-7',
}));