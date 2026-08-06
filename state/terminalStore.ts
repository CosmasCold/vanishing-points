import { create } from "zustand";

interface TerminalLine {
  id: string;
  type: "input" | "output" | "system" | "error";
  text: string;
}

interface TerminalState {
  isOpen: boolean;
  lines: TerminalLine[];
  toggle: () => void;
  setOpen: (v: boolean) => void;
  addLine: (line: TerminalLine) => void;
  clearLines: () => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  isOpen: false,
  lines: [],
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  setOpen: (v) => set({ isOpen: v }),
  addLine: (line) => set((s) => ({ lines: [...s.lines, line] })),
  clearLines: () => set({ lines: [] }),
}));