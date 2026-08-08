import { create } from 'zustand';
import { useAtlasStore } from '@/state/atlasStore';
import { useSessionStore } from '@/state/sessionStore';
import { useUIStore } from '@/state/uiStore';

export interface NodePosition {
  x: number;
  y: number;
}

export interface BoardEdge {
  id: string;
  source: string;
  target: string;
  type: 'confirmed' | 'suspected' | 'unstable';
  label?: string;
}

export type EvidenceBoardViewMode = 'overview' | 'focus' | 'detail';

export type EvidenceBoardFilterMode =
  | 'all'
  | 'visited'
  | 'sealed'
  | 'whispered'
  | 'mirage'
  | 'suspected';

interface EvidenceBoardState {
  nodePositions: Record<string, NodePosition>;
  selectedNodeId: string | null;
  focusNodeId: string | null;
  viewMode: EvidenceBoardViewMode;
  filterMode: EvidenceBoardFilterMode;
  discoveredEdges: BoardEdge[];
  playerEdges: BoardEdge[];
  zoom: number;
  pan: { x: number; y: number };

  setNodePosition: (id: string, pos: NodePosition) => void;
  selectNode: (id: string | null) => void;
  setFocusNode: (id: string | null) => void;
  setViewMode: (mode: EvidenceBoardViewMode) => void;
  setFilterMode: (mode: EvidenceBoardFilterMode) => void;
  discoverEdge: (edge: BoardEdge) => void;
  addPlayerEdge: (edge: BoardEdge) => void;
  removePlayerEdge: (id: string) => void;
  setViewport: (zoom: number, pan: { x: number; y: number }) => void;
  resetBoard: () => void;
}

export const useEvidenceBoardStore = create<EvidenceBoardState>((set, get) => ({
  nodePositions: {},
  selectedNodeId: null,
  focusNodeId: null,
  viewMode: 'overview',
  filterMode: 'all',
  discoveredEdges: [],
  playerEdges: [],
  zoom: 1,
  pan: { x: 0, y: 0 },

  setNodePosition: (id, pos) =>
    set((s) => ({
      nodePositions: { ...s.nodePositions, [id]: pos },
    })),

  selectNode: (id) => set({ selectedNodeId: id }),

  setFocusNode: (id) => set({ focusNodeId: id }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setFilterMode: (mode) => set({ filterMode: mode }),

  discoverEdge: (edge) =>
    set((s) => {
      const exists = s.discoveredEdges.some(
        (e) =>
          (e.source === edge.source && e.target === edge.target) ||
          (e.source === edge.target && e.target === edge.source)
      );

      if (exists) return s;

      return {
        discoveredEdges: [...s.discoveredEdges, edge],
      };
    }),

  addPlayerEdge: (edge) => {
    const state = get();

    const exists = [...state.discoveredEdges, ...state.playerEdges].some(
      (e) =>
        (e.source === edge.source && e.target === edge.target) ||
        (e.source === edge.target && e.target === edge.source)
    );

    if (exists) return;

    const { places } = useAtlasStore.getState();
    const sourcePlace = places.find((p) => p.slug === edge.source);
    const targetPlace = places.find((p) => p.slug === edge.target);

    const isValidConnection =
      sourcePlace?.connectedTo?.includes(edge.target) ||
      targetPlace?.connectedTo?.includes(edge.source);

    if (isValidConnection) {
      const confirmedEdge: BoardEdge = {
        ...edge,
        type: 'confirmed',
        label: 'VERIFIED LINK',
      };

      set((s) => ({
        discoveredEdges: [...s.discoveredEdges, confirmedEdge],
      }));

      const uiState = useUIStore.getState();

      uiState.updateStatus({
        observerStability: Math.min(
          100,
          uiState.status.observerStability + 15
        ),
      });

      const now = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });

      const inboxItems = useSessionStore.getState().inboxItems;
      const connectionId = `conn-${Date.now()}`;

      useSessionStore.setState({
        inboxItems: [
          ...inboxItems,
          {
            id: connectionId,
            type: 'system',
            title: 'Resonance Link Confirmed',
            body: `BUNKER_7: Correlation verified between Case "${
              sourcePlace?.name || edge.source
            }" and Case "${
              targetPlace?.name || edge.target
            }". Spatial matrix aligned. Observer stability increased by 15%.`,
            timestamp: now,
            read: false,
          },
        ],
      });
    } else {
      set((s) => ({
        playerEdges: [...s.playerEdges, edge],
      }));
    }
  },

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