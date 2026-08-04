import { create } from 'zustand';
import { ModuleId, SystemStatus } from '@/types';

interface UIState {
  activeModule: ModuleId | null;
  terminalOpen: boolean;
  terminalHeight: number;
  status: SystemStatus;
  booted: boolean;
  
  setActiveModule: (module: ModuleId | null) => void;
  toggleTerminal: () => void;
  setTerminalOpen: (open: boolean) => void;
  setBooted: (booted: boolean) => void;
  updateStatus: (status: Partial<SystemStatus>) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeModule: null,
  terminalOpen: false,
  terminalHeight: 192,
  status: {
    dustIndex: 12,
    atlasCoverage: 2847,
    activeInvestigations: 3,
    unreadMessages: 2,
    systemIntegrity: 'stable',
    lastSync: new Date().toISOString(),
  },
  booted: false,
  
  setActiveModule: (module) => set({ activeModule: module }),
  toggleTerminal: () => set((s) => ({ terminalOpen: !s.terminalOpen })),
  setTerminalOpen: (open) => set({ terminalOpen: open }),
  setBooted: (booted) => set({ booted }),
  updateStatus: (status) => set((s) => ({ status: { ...s.status, ...status } })),
}));