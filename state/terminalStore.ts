import { create } from 'zustand';
import { CommandOutputType } from '@/types';

export interface CommandEntry {
  id: string;
  input: string;
  output: string;
  timestamp: number;
  type: CommandOutputType;
}

interface TerminalState {
  history: CommandEntry[];
  addCommand: (entry: CommandEntry) => void;
  clearHistory: () => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  history: [],

  addCommand: (entry) =>
    set((s) => ({
      history: [...s.history, entry],
    })),

  clearHistory: () => set({ history: [] }),
}));