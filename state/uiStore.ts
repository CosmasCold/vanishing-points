import { create } from 'zustand';

export interface SystemStatus {
  dustIndex: number;
  observerStability: number;
  atlasCoverage: number;
  activeAlerts: number;
}

export const DUST_THRESHOLDS = {
  LOW: 15,
  MODERATE: 30,
  HIGH: 45,
  EXTREME: 60,
} as const;

export const STABILITY_THRESHOLDS = {
  NOMINAL: 80,
  DEGRADED: 60,
  CRITICAL: 40,
  UNSTABLE: 20,
} as const;

const DUST_AWARDS = {
  document: 1,
  witness: 2,
  signal: 1,
  photo: 2,
  audio: 3,
  video: 3,
  personal: 4,
} as const;

interface UIState {
  booted: boolean;
  activeModule: string | null;
  terminalOpen: boolean;
  status: SystemStatus;

  // Dust tracking
  lastGroundedAt: number;
  cataloguedToday: number;
  examinedEvidence: string[];
  investigatedPlaces: string[];

  setBooted: (booted: boolean) => void;
  setActiveModule: (module: string | null) => void;
  setTerminalOpen: (open: boolean) => void;
  toggleTerminal: () => void;
  updateStatus: (partial: Partial<SystemStatus>) => void;

  // Dust mechanics
  addDust: (amount: number) => void;
  restoreStability: (amount: number) => void;
  ground: () => { success: boolean; amount: number; message: string };
  catalogue: () => { success: boolean; amount: number; message: string };
  examineEvidence: (id: string, type: string) => number;
  investigatePlace: (slug: string) => number;
  resetDust: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  booted: false,
  activeModule: null,
  terminalOpen: false,
  status: {
    dustIndex: 0,
    observerStability: 100,
    atlasCoverage: 0,
    activeAlerts: 0,
  },
  lastGroundedAt: 0,
  cataloguedToday: 0,
  examinedEvidence: [],
  investigatedPlaces: [],

  setBooted: (booted) => set({ booted }),
  setActiveModule: (activeModule) => set({ activeModule }),
  setTerminalOpen: (terminalOpen) => set({ terminalOpen }),
  toggleTerminal: () => set((s) => ({ terminalOpen: !s.terminalOpen })),
  updateStatus: (partial) =>
    set((s) => ({ status: { ...s.status, ...partial } })),

  addDust: (amount) => {
    const current = get();
    const newDust = current.status.dustIndex + amount;
    const stabilityLoss = amount * 0.5;
    const newStability = Math.max(0, current.status.observerStability - stabilityLoss);

    set({
      status: {
        ...current.status,
        dustIndex: newDust,
        observerStability: newStability,
      },
    });
  },

  restoreStability: (amount) => {
    set((s) => ({
      status: {
        ...s.status,
        observerStability: Math.min(100, s.status.observerStability + amount),
      },
    }));
  },

  ground: () => {
    const now = Date.now();
    const last = get().lastGroundedAt;
    const hoursSince = (now - last) / (1000 * 60 * 60);

    if (hoursSince < 1) {
      return {
        success: false,
        amount: 0,
        message: `Grounding ritual unavailable. ${Math.ceil(60 - hoursSince * 60)} minutes remaining.`,
      };
    }

    const restoreAmount = 25;
    const current = get();
    set({
      lastGroundedAt: now,
      status: {
        ...current.status,
        observerStability: Math.min(100, current.status.observerStability + restoreAmount),
      },
    });

    return {
      success: true,
      amount: restoreAmount,
      message: `Grounding complete. Observer Stability restored by ${restoreAmount}.`,
    };
  },

  catalogue: () => {
    const current = get();
    if (current.cataloguedToday >= 5) {
      return {
        success: false,
        amount: 0,
        message: 'Daily catalogue limit reached. Organize tomorrow.',
      };
    }

    const restoreAmount = 5;
    set({
      cataloguedToday: current.cataloguedToday + 1,
      status: {
        ...current.status,
        observerStability: Math.min(100, current.status.observerStability + restoreAmount),
      },
    });

    return {
      success: true,
      amount: restoreAmount,
      message: `Catalogued ${current.cataloguedToday + 1}/5. Stability +${restoreAmount}.`,
    };
  },

  examineEvidence: (id, type) => {
    const current = get();
    if (current.examinedEvidence.includes(id)) return 0;

    const award = DUST_AWARDS[type as keyof typeof DUST_AWARDS] || 1;
    const stabilityLoss = award * 0.5;

    set({
      status: {
        ...current.status,
        dustIndex: current.status.dustIndex + award,
        observerStability: Math.max(0, current.status.observerStability - stabilityLoss),
      },
      examinedEvidence: [...current.examinedEvidence, id],
    });

    return award;
  },

  investigatePlace: (slug) => {
    const current = get();
    if (current.investigatedPlaces.includes(slug)) return 0;

    const award = 3;
    const stabilityLoss = award * 0.5;

    set({
      status: {
        ...current.status,
        dustIndex: current.status.dustIndex + award,
        observerStability: Math.max(0, current.status.observerStability - stabilityLoss),
      },
      investigatedPlaces: [...current.investigatedPlaces, slug],
    });

    return award;
  },

  resetDust: () =>
    set({
      status: { ...get().status, dustIndex: 0, observerStability: 100 },
      lastGroundedAt: 0,
      cataloguedToday: 0,
      examinedEvidence: [],
      investigatedPlaces: [],
    }),
}));