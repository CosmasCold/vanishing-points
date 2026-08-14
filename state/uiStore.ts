import { create } from 'zustand';
import { ModuleId } from '@/types';

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

export interface Status {
  dustIndex: number;
  observerStability: number;
  investigatedSlugs: string[];
  activeAlerts: number;
  sessionWorkDone: number; // Tracker for active grounding/calibration checks
  atlasCoverage: number;     // Restored to resolve compilation requirements
}

interface UIState {
  booted: boolean;
  activeModule: ModuleId | null;
  terminalOpen: boolean;
  prologueComplete: boolean;
  guideOpen: boolean;
  status: Status;
  setBooted: (booted: boolean) => void;
  setActiveModule: (module: ModuleId | null) => void;
  setTerminalOpen: (open: boolean) => void;
  setPrologueComplete: () => void;
  setGuideOpen: (open: boolean) => void;
  updateStatus: (status: Partial<Status>) => void;
  investigatePlace: (slug: string) => void;
  ground: () => { success: boolean; message: string };
  restoreStability: () => { success: boolean; message: string };
  examineEvidence: (evidenceId: string, isVerified?: boolean) => void;
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
    dustIndex: 0,
    observerStability: 100,
    investigatedSlugs: [],
    activeAlerts: 0,
    sessionWorkDone: 0,
    atlasCoverage: 1240, // Baseline declassified military grid mapping in km²
  },

  setBooted: (booted) => set({ booted }),
  setActiveModule: (activeModule) => set({ activeModule }),
  setTerminalOpen: (terminalOpen) => set({ terminalOpen }),
  setPrologueComplete: () => set({ prologueComplete: true }),
  setGuideOpen: (guideOpen) => set({ guideOpen }),
  
  updateStatus: (newStatus) => set((s) => ({ status: { ...s.status, ...newStatus } })),
  
  investigatePlace: (slug) => set((s) => {
    if (s.status.investigatedSlugs.includes(slug)) {
      return s; // The Archive remembers double-dipping
    }
    // Slower, cerebral exposure increments (Slow Burn: +2 Dust instead of +5)
    return {
      status: {
        ...s.status,
        dustIndex: Math.min(100, s.status.dustIndex + 2),
        investigatedSlugs: [...s.status.investigatedSlugs, slug],
        sessionWorkDone: s.status.sessionWorkDone + 1, // Log progress
        atlasCoverage: s.status.atlasCoverage + 42.8,
      },
    };
  }),

  // Grounding loop: bleeding off electrostatic charge into copper vents
  ground: () => {
    const { status } = get();
    if (status.dustIndex <= 0) {
      return {
        success: false,
        message: "BUNKER_7: No electrostatic load detected on terminal chassis contact plates."
      };
    }
    set((s) => ({
      status: {
        ...s.status,
        dustIndex: Math.max(0, s.status.dustIndex - 12),
        observerStability: Math.min(100, s.status.observerStability + 5),
      }
    }));
    return {
      success: true,
      message: "BUNKER_7: Grounding loop complete. Bled off -12% electrostatic static load into Wing C copper drains."
    };
  },

  restoreStability: () => {
    const { status } = get();
    if (status.sessionWorkDone < 2) {
      return {
        success: false,
        message: "BUNKER_7: Recalibration rejected. Insufficient cognitive focus. Analyze at least 2 case materials in this session to align calibration vectors. Current: " + status.sessionWorkDone + "."
      };
    }
    if (status.observerStability >= 100) {
      return {
        success: false,
        message: "BUNKER_7: Observer cognitive alignment is already at nominal ceiling (100%)."
      };
    }
    set((s) => ({
      status: {
        ...s.status,
        observerStability: Math.min(100, s.status.observerStability + 15),
        sessionWorkDone: Math.max(0, s.status.sessionWorkDone - 2), // Consume 2 session units!
      }
    }));
    return {
      success: true,
      message: "BUNKER_7: Calibration sequence complete. Focus alignment secured (+15% Stability). Consumed 2 progress units."
    };
  },

  examineEvidence: (evidenceId, isVerified = false) => {
    set((s) => {
      if (isVerified) {
        // Active grounding: studying verified history purges dust and grounds mind
        return {
          status: {
            ...s.status,
            dustIndex: Math.max(0, s.status.dustIndex - 1), // Tighter balance metrics
            observerStability: Math.min(100, s.status.observerStability + 2),
            sessionWorkDone: s.status.sessionWorkDone + 1, // CORRECTLY SYNCHRONIZED PROGRESS VARIABLE
          }
        };
      } else {
        // Breaking open sealed, dusty folders releases particulate and strains stability
        return {
          status: {
            ...s.status,
            dustIndex: Math.min(100, s.status.dustIndex + 1), // Slow Burn: +1 instead of +4
            observerStability: Math.max(0, s.status.observerStability - 1), // Gentle drain: -1 instead of -3
            sessionWorkDone: s.status.sessionWorkDone + 1, // CORRECTLY SYNCHRONIZED PROGRESS VARIABLE
          }
        };
      }
    });
  },

  catalogue: () => {
    const { status } = get();
    if (status.dustIndex >= DUST_THRESHOLDS.EXTREME) return 'EXTREME';
    if (status.dustIndex >= DUST_THRESHOLDS.HIGH) return 'HIGH';
    if (status.dustIndex >= DUST_THRESHOLDS.MODERATE) return 'MODERATE';
    if (status.dustIndex >= DUST_THRESHOLDS.LOW) return 'LOW';
    return 'NOMINAL';
  },

  profile: () => 'INV_RED-7',
}));
