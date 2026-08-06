import { create } from 'zustand';

interface CacheState {
  discovered: number[]; // Which caches the player has unlocked
  listened: number[];   // Which caches they've played to completion
  drawerOpen: boolean;

  discoverCache: (id: number) => void;
  markListened: (id: number) => void;
  setDrawerOpen: (open: boolean) => void;
}

export const usePersonalCacheStore = create<CacheState>((set) => ({
  discovered: [],
  listened: [],
  drawerOpen: false,

  discoverCache: (id) =>
    set((s) => {
      if (s.discovered.includes(id)) return s;
      return { discovered: [...s.discovered, id] };
    }),

  markListened: (id) =>
    set((s) => {
      if (s.listened.includes(id)) return s;
      return { listened: [...s.listened, id] };
    }),

  setDrawerOpen: (open) => set({ drawerOpen: open }),
}));