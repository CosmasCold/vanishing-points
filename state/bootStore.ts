import { create } from 'zustand';

interface BootState {
  isComplete: boolean;
  markComplete: () => void;
  reset: () => void;
}

export const useBootStore = create<BootState>((set) => ({
  isComplete: false,
  markComplete: () => set({ isComplete: true }),
  reset: () => set({ isComplete: false }),
}));