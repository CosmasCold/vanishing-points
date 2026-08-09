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
  sessionWorkDone: number; // Tracker for active grounding gate checks
  atlasCoverage: number;     // Restored to resolve the Vercel compilation error
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
  
  updateStatus: (newStatus) => set((s) => ({
    status: { ...s.status, ...newStatus }
  })),

  investigatePlace: (slug) => set((s) => {
    if (s.status.investigatedSlugs.includes(slug)) {
      return s; // The Archive remembers double-dipping
    }
    return {
      status: {
        ...s.status,
        dustIndex: Math.min(100, s.status.dustIndex + 5),
        investigatedSlugs: [...s.status.investigatedSlugs, slug],
        sessionWorkDone: s.status.sessionWorkDone + 1, // Log progress
        // Increment coverage by +42.8 km² per newly mapped sector
        atlasCoverage: s.status.atlasCoverage + 42.8, 
      },
    };
  }),

  // Grounding loop: Grounding requires reference work
  ground: () => {
    const { status } = get();
    
    if (status.sessionWorkDone < 2 && status.dustIndex > 10) {
      return {
        success: false,
        message: `BUNKER_7: Grounding failed. Calibration requires physical focus. Organize the Archive, review unread documents, or record notes inside case files to ground your perception before attempting reset.`
      };
    }

    set((s) => ({
      status: {
        ...s.status,
        dustIndex: Math.max(0, s.status.dustIndex - 20),
        observerStability: Math.min(100, s.status.observerStability + 15),
        sessionWorkDone: 0, // Reset the grounding charge
      },
    }));

    return {
      success: true,
      message: `BUNKER_7: Grounding sequence complete. Particulate levels neutralized. Observer focus aligned.`
    };
  },

  restoreStability: () => {
    const { status } = get();
    
    if (status.investigatedSlugs.length === 0) {
      return {
        success: false,
        message: `BUNKER_7: Stability lock denied. You have not logged any geodetic points this session. A physical coordinate anchor is required to lock focus.`
      };
    }

    set((s) => ({
      status: {
        ...s.status,
        observerStability: 100,
        dustIndex: Math.max(0, s.status.dustIndex - 5),
      },
    }));

    return {
      success: true,
      message: `BUNKER_7: Observer calibration reset to 100%. Neural sync: secure.`
    };
  },

  examineEvidence: (evidenceId, isVerified = false) => {
    set((s) => {
      if (isVerified) {
        // Active grounding: studying verified history purges dust and grounds mind
        return {
          status: {
            ...s.status,
            dustIndex: Math.max(0, s.status.dustIndex - 2),
            observerStability: Math.min(100, s.status.observerStability + 3),
            sessionWorkDone: s.status.sessionWorkDone + 1,
          }
        };
      } else {
        // Breaking open sealed, dusty folders releases particulate and strains stability
        return {
          status: {
            ...s.status,
            dustIndex: Math.min(100, s.status.dustIndex + 4),
            observerStability: Math.max(0, s.status.observerStability - 3),
            sessionWorkDone: s.status.sessionWorkDone + 1,
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