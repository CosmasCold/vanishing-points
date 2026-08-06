import { create } from 'zustand';
import { PhysicalArtifact, ArtifactMarking } from '@/types/artifacts';

interface ArtifactState {
  activeArtifact: PhysicalArtifact | null;
  rotation: number;
  zoom: number;
  lampMode: 'standard' | 'magnify' | 'uv' | 'measure';
  activeMarking: ArtifactMarking | null;
  inventory: PhysicalArtifact[];

  openArtifact: (artifact: PhysicalArtifact) => void;
  closeArtifact: () => void;
  rotate: (degrees: number) => void;
  setZoom: (zoom: number) => void;
  adjustZoom: (delta: number) => void;
  setLampMode: (mode: 'standard' | 'magnify' | 'uv' | 'measure') => void;
  inspectMarking: (marking: ArtifactMarking | null) => void;
  addToInventory: (artifact: PhysicalArtifact) => void;
  updateArtifact: (id: string, partial: Partial<PhysicalArtifact>) => void;
}

export const useArtifactStore = create<ArtifactState>((set, get) => ({
  activeArtifact: null,
  rotation: 0,
  zoom: 1,
  lampMode: 'standard',
  activeMarking: null,
  inventory: [],

  openArtifact: (artifact) => set({
    activeArtifact: artifact,
    rotation: 0,
    zoom: 1,
    lampMode: 'standard',
    activeMarking: null,
  }),

  closeArtifact: () => set({ activeArtifact: null, activeMarking: null }),

  rotate: (degrees) => set((s) => ({
    rotation: (s.rotation + degrees) % 360,
  })),

  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(4, zoom)) }),

  adjustZoom: (delta) => set((s) => ({
    zoom: Math.max(0.5, Math.min(4, s.zoom + delta)),
  })),

  setLampMode: (lampMode) => set({ lampMode }),

  inspectMarking: (activeMarking) => set({ activeMarking }),

  addToInventory: (artifact) =>
    set((s) => {
      if (s.inventory.find((a) => a.id === artifact.id)) return s;
      return { inventory: [...s.inventory, artifact] };
    }),

  updateArtifact: (id, partial) =>
    set((s) => ({
      inventory: s.inventory.map((a) =>
        a.id === id ? { ...a, ...partial } : a
      ),
      activeArtifact:
        s.activeArtifact?.id === id
          ? { ...s.activeArtifact, ...partial }
          : s.activeArtifact,
    })),
}));