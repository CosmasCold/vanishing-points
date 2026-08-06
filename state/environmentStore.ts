import { create } from 'zustand';

export type ImpossibleChange = {
  id: string;
  description: string;
  dustRequired: number;
  stabilityMax: number;
  applied: boolean;
  location: 'desktop' | 'terminal' | 'atlas' | 'evidence' | 'global';
};

interface EnvironmentState {
  changes: ImpossibleChange[];
  sessionCount: number;
  lastChangeAt: number;

  applyChange: (changeId: string) => void;
  checkForChanges: (dust: number, stability: number) => ImpossibleChange[];
  incrementSession: () => void;
}

const CHANGE_POOL: Omit<ImpossibleChange, 'applied'>[] = [
  {
    id: 'photo-drift',
    description: 'A photograph on the desk has shifted three inches left.',
    dustRequired: 20,
    stabilityMax: 70,
    location: 'desktop',
  },
  {
    id: 'terminal-extra-line',
    description: 'The terminal boot sequence contains one additional line not present yesterday.',
    dustRequired: 25,
    stabilityMax: 65,
    location: 'terminal',
  },
  {
    id: 'atlas-coord-drift',
    description: 'Atlas sector 7-B has shifted 0.3km from last known position.',
    dustRequired: 30,
    stabilityMax: 60,
    location: 'atlas',
  },
  {
    id: 'evidence-reorder',
    description: 'Evidence item #3 in Case #2847 has moved to position #1.',
    dustRequired: 35,
    stabilityMax: 55,
    location: 'evidence',
  },
  {
    id: 'chair-closer',
    description: 'The desk chair is slightly closer than yesterday.',
    dustRequired: 40,
    stabilityMax: 50,
    location: 'desktop',
  },
  {
    id: 'bunker7-name',
    description: 'BUNKER_7 referenced an investigator not found in personnel records.',
    dustRequired: 45,
    stabilityMax: 45,
    location: 'terminal',
  },
  {
    id: 'duplicate-document',
    description: 'A document exists in two folders simultaneously with different contents.',
    dustRequired: 50,
    stabilityMax: 40,
    location: 'evidence',
  },
  {
    id: 'hallway-longer',
    description: 'The hallway outside the office seems one light longer than before.',
    dustRequired: 55,
    stabilityMax: 35,
    location: 'global',
  },
  {
    id: 'reflection-lingers',
    description: 'The CRT reflection lingers after the player moves.',
    dustRequired: 60,
    stabilityMax: 30,
    location: 'desktop',
  },
];

export const useEnvironmentStore = create<EnvironmentState>((set, get) => ({
  changes: CHANGE_POOL.map((c) => ({ ...c, applied: false })),
  sessionCount: 0,
  lastChangeAt: 0,

  applyChange: (changeId) =>
    set((s) => ({
      changes: s.changes.map((c) => (c.id === changeId ? { ...c, applied: true } : c)),
      lastChangeAt: Date.now(),
    })),

  checkForChanges: (dust, stability) => {
    const { changes, sessionCount, lastChangeAt } = get();
    const hoursSince = (Date.now() - lastChangeAt) / (1000 * 60 * 60);

    // Maximum one change per session, minimum 2 hours between changes
    if (hoursSince < 2) return [];

    const candidates = changes.filter(
      (c) =>
        !c.applied &&
        dust >= c.dustRequired &&
        stability <= c.stabilityMax &&
        Math.random() < 0.3 // 30% chance per eligible candidate per check
    );

    // Return at most one change per check
    return candidates.slice(0, 1);
  },

  incrementSession: () => set((s) => ({ sessionCount: s.sessionCount + 1 })),
}));