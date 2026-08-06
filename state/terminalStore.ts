import { create } from 'zustand';

export interface TerminalLine {
  id: string;
  text: string;
  type: 'input' | 'output' | 'system' | 'error' | 'warning';
  timestamp: number;
}

interface TerminalState {
  isOpen: boolean;
  lines: TerminalLine[];
  inputBuffer: string;
  cursorPosition: number;
  history: string[];
  historyIndex: number;
  scrollOffset: number;
  isPrinting: boolean;

  // Actions
  setOpen: (open: boolean) => void;
  toggle: () => void;
  addLine: (line: Omit<TerminalLine, 'id' | 'timestamp'>) => void;
  setInput: (input: string) => void;
  moveCursor: (delta: number) => void;
  submitInput: () => void;
  historyPrev: () => void;
  historyNext: () => void;
  clear: () => void;
  setPrinting: (printing: boolean) => void;
  setScrollOffset: (offset: number) => void;
}

let lineId = 0;

export const useTerminalStore = create<TerminalState>((set, get) => ({
  isOpen: false,
  lines: [
    { id: 'init-0', text: 'Archive Terminal v7.2 — Type "help" for available commands', type: 'system', timestamp: Date.now() },
  ],
  inputBuffer: '',
  cursorPosition: 0,
  history: [],
  historyIndex: -1,
  scrollOffset: 0,
  isPrinting: false,

  setOpen: (open) => set({ isOpen: open }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),

  addLine: (line) => set((s) => ({
    lines: [...s.lines, { ...line, id: `line-${++lineId}`, timestamp: Date.now() }],
  })),

  setInput: (input) => set((s) => ({
    inputBuffer: input,
    cursorPosition: Math.min(s.cursorPosition, input.length),
  })),

  moveCursor: (delta) => set((s) => ({
    cursorPosition: Math.max(0, Math.min(s.inputBuffer.length, s.cursorPosition + delta)),
  })),

  submitInput: () => set((s) => {
    const cmd = s.inputBuffer.trim();
    if (!cmd) return s;
    return {
      inputBuffer: '',
      cursorPosition: 0,
      history: [cmd, ...s.history].slice(0, 100),
      historyIndex: -1,
      lines: [...s.lines, { id: `line-${++lineId}`, text: `> ${cmd}`, type: 'input', timestamp: Date.now() }],
    };
  }),

  historyPrev: () => set((s) => {
    if (s.history.length === 0) return s;
    const newIndex = Math.min(s.historyIndex + 1, s.history.length - 1);
    return {
      historyIndex: newIndex,
      inputBuffer: s.history[newIndex] || '',
      cursorPosition: (s.history[newIndex] || '').length,
    };
  }),

  historyNext: () => set((s) => {
    if (s.historyIndex <= 0) {
      return { historyIndex: -1, inputBuffer: '', cursorPosition: 0 };
    }
    const newIndex = s.historyIndex - 1;
    return {
      historyIndex: newIndex,
      inputBuffer: s.history[newIndex] || '',
      cursorPosition: (s.history[newIndex] || '').length,
    };
  }),

  clear: () => set({ lines: [], inputBuffer: '', cursorPosition: 0 }),
  setPrinting: (printing) => set({ isPrinting: printing }),
  setScrollOffset: (offset) => set({ scrollOffset: offset }),
}));