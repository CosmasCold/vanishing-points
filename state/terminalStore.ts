import { create } from 'zustand';
import { TerminalCommand } from '@/types';

interface TerminalState {
  commands: TerminalCommand[];
  history: string[];
  historyIndex: number;
  
  addCommand: (cmd: TerminalCommand) => void;
  clearCommands: () => void;
  addHistory: (input: string) => void;
  setHistoryIndex: (index: number) => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  commands: [],
  history: [],
  historyIndex: -1,
  
  addCommand: (cmd) => set((s) => ({ commands: [...s.commands, cmd] })),
  clearCommands: () => set({ commands: [], historyIndex: -1 }),
  addHistory: (input) => set((s) => ({ 
    history: [...s.history, input],
    historyIndex: -1 
  })),
  setHistoryIndex: (index) => set({ historyIndex: index }),
}));