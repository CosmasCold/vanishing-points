import { create } from 'zustand';

export const DUST_THRESHOLDS = {
  LOW: 10,
  MODERATE: 25,
  HIGH: 50,
  EXTREME: 75,
};

export const STABILITY_THRESHOLDS = {
  NOMINAL: 90,
  STABLE: 80,
  DEGRADED: 60,
  CRITICAL: 40,
  UNSTABLE: 20,
};

interface Status {
  dustIndex: number;
  observerStability: number;
  atlasCoverage: number;
  activeAlerts: number;
}

interface UIState {
  booted: boolean;
  activeModule: string | null;
  terminalOpen: boolean;
  prologueComplete: boolean;
  guideOpen: boolean;
  status: Status;

  setBooted: (booted: boolean) => void;
  setActiveModule: (module: string | null) => void;
  setTerminalOpen: (open: boolean) => void;
  setPrologueComplete: () => void;
  setGuideOpen: (open: boolean) => void;
  updateStatus: (status: Partial<Status>) => void;

  // Dust & stability mechanics
  investigatePlace: (slug: string) => void;
  ground: () => void;
  restoreStability: () => void;
  examineEvidence: (evidenceId: string) => void;
  catalogue: () => string;
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
    atlasCoverage: 0,
    activeAlerts: 0,
  },

  setBooted: (booted) => set({ booted }),
  setActiveModule: (activeModule) => set({ activeModule }),
  setTerminalOpen: (terminalOpen) => set({ terminalOpen }),
  setPrologueComplete: () => set({ prologueComplete: true }),
  setGuideOpen: (guideOpen) => set({ guideOpen }),
  updateStatus: (status) =>
    set((s) => ({ status: { ...s.status, ...status } })),

  investigatePlace: (slug) =>
    set((s) => ({
      status: {
        ...s.status,
        dustIndex: s.status.dustIndex + 3,
      },
    })),

  ground: () => {
    set((s) => ({
      status: {
        ...s.status,
        dustIndex: Math.max(0, s.status.dustIndex - 15),
        observerStability: Math.min(100, s.status.observerStability + 10),
      },
    }));
  },

  restoreStability: () => {
    set((s) => ({
      status: {
        ...s.status,
        observerStability: 100,
        dustIndex: Math.max(0, s.status.dustIndex - 5),
      },
    }));
  },

  examineEvidence: (evidenceId: string) => {
    set((s) => ({
      status: {
        ...s.status,
        dustIndex: s.status.dustIndex + 3,
        observerStability: Math.max(0, s.status.observerStability - 2),
      },
    }));
  },

  catalogue: () => {
    const { status } = get();
    const dustLevel =
      status.dustIndex >= DUST_THRESHOLDS.EXTREME ? 'EXTREME' :
      status.dustIndex >= DUST_THRESHOLDS.HIGH ? 'HIGH' :
      status.dustIndex >= DUST_THRESHOLDS.MODERATE ? 'MODERATE' :
      status.dustIndex >= DUST_THRESHOLDS.LOW ? 'LOW' : 'NOMINAL';

    const stabilityLevel =
      status.observerStability >= STABILITY_THRESHOLDS.NOMINAL ? 'NOMINAL' :
      status.observerStability >= STABILITY_THRESHOLDS.STABLE ? 'STABLE' :
      status.observerStability >= STABILITY_THRESHOLDS.DEGRADED ? 'DEGRADED' :
      status.observerStability >= STABILITY_THRESHOLDS.CRITICAL ? 'CRITICAL' : 'UNSTABLE';

    return `DUST INDEX: ${status.dustIndex} [${dustLevel}]\nSTABILITY: ${status.observerStability.toFixed(1)}% [${stabilityLevel}]\nCOVERAGE: ${status.atlasCoverage} km²\nALERTS: ${status.activeAlerts}`;
  },
}));