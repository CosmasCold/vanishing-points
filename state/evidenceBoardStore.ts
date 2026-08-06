import { create } from 'zustand';

interface NodePosition {
  x: number;
  y: number;
}

interface BoardEdge {
  id: string;
  source: string;
  target: string;
  type: 'confirmed' | 'suspected' | 'unstable';
  label?: string;
}

interface EvidenceBoardState {
  nodePositions: Record<string, NodePosition>;
  selectedNodeId: string | null;
  discoveredEdges: BoardEdge[];
  playerEdges: BoardEdge[];
  zoom: number;
  pan: { x: number; y: number };

  setNodePosition: (id: string, pos: NodePosition) => void;
  selectNode: (id: string | null) => void;
  discoverEdge: (edge: BoardEdge) => void;
  addPlayerEdge: (edge: BoardEdge) => void;
  removePlayerEdge: (id: string) => void;
  setViewport: (zoom: number, pan: { x: number; y: number }) => void;
  resetBoard: () => void;
}

export const useEvidenceBoardStore = create<EvidenceBoardState>((set) => ({
  nodePositions: {},
  selectedNodeId: null,
  discoveredEdges: [],
  playerEdges: [],
  zoom: 1,
  pan: { x: 0, y: 0 },

  setNodePosition: (id, pos) =>
    set((s) => ({ nodePositions: { ...s.nodePositions, [id]: pos } })),

  selectNode: (id) => set({ selectedNodeId: id }),

  discoverEdge: (edge) =>
    set((s) => {
      const exists = s.discoveredEdges.some(
        (e) =>
          (e.source === edge.source && e.target === edge.target) ||
          (e.source === edge.target && e.target === edge.source)
      );
      if (exists) return s;
      return { discoveredEdges: [...s.discoveredEdges, edge] };
    }),

  addPlayerEdge: (edge) =>
    set((s) => {
      const exists = [...s.discoveredEdges, ...s.playerEdges].some(
        (e) =>
          (e.source === edge.source && e.target === edge.target) ||
          (e.source === edge.target && e.target === edge.source)
      );
      if (exists) return s;
      return { playerEdges: [...s.playerEdges, edge] };
    }),

  removePlayerEdge: (id) =>
    set((s) => ({
      playerEdges: s.playerEdges.filter((e) => e.id !== id),
    })),

  setViewport: (zoom, pan) => set({ zoom, pan }),

  resetBoard: () =>
    set({
      discoveredEdges: [],
      playerEdges: [],
      selectedNodeId: null,
    }),
}));