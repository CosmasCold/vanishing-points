import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  workspaceEvidenceIds: string[];
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
  addToWorkspace: (id: string) => void;
  removeFromWorkspace: (id: string) => void;
  setWorkspaceEvidenceIds: (ids: string[]) => void;
  setViewport: (zoom: number, pan: { x: number; y: number }) => void;
  resetBoard: () => void;
}

const INITIAL_WORKSPACE = [
  'stelmo-light',
  'doc-stelmo-001',
  'hyp-physical-record-drift',
];

export const useEvidenceBoardStore = create<EvidenceBoardState>()(
  persist(
    (set) => ({
      nodePositions: {},
      selectedNodeId: null,
      focusNodeId: null,
      viewMode: 'overview',
      filterMode: 'all',
      discoveredEdges: [],
      playerEdges: [],
      workspaceEvidenceIds: [...INITIAL_WORKSPACE],
      zoom: 1,
      pan: { x: 0, y: 0 },

      setNodePosition: (id, pos) =>
        set((state) => ({
          nodePositions: {
            ...state.nodePositions,
            [id]: pos,
          },
        })),

      selectNode: (id) => set({ selectedNodeId: id }),

      setFocusNode: (id) => set({ focusNodeId: id }),

      setViewMode: (mode) => set({ viewMode: mode }),

      setFilterMode: (mode) => set({ filterMode: mode }),

      discoverEdge: (edge) =>
        set((state) => {
          const exists = state.discoveredEdges.some(
            (existing) =>
              (existing.source === edge.source &&
                existing.target === edge.target) ||
              (existing.source === edge.target &&
                existing.target === edge.source),
          );

          return exists
            ? state
            : {
                discoveredEdges: [
                  ...state.discoveredEdges,
                  edge,
                ],
              };
        }),

      addPlayerEdge: (edge) =>
        set((state) => {
          const exists = state.playerEdges.some(
            (existing) =>
              (existing.source === edge.source &&
                existing.target === edge.target) ||
              (existing.source === edge.target &&
                existing.target === edge.source),
          );

          return exists
            ? state
            : {
                playerEdges: [
                  ...state.playerEdges,
                  edge,
                ],
              };
        }),

      removePlayerEdge: (id) =>
        set((state) => ({
          playerEdges: state.playerEdges.filter(
            (edge) => edge.id !== id,
          ),
        })),

      addToWorkspace: (id) =>
        set((state) => ({
          workspaceEvidenceIds:
            state.workspaceEvidenceIds.includes(id)
              ? state.workspaceEvidenceIds
              : [...state.workspaceEvidenceIds, id],
        })),

      removeFromWorkspace: (id) =>
        set((state) => ({
          workspaceEvidenceIds:
            state.workspaceEvidenceIds.filter(
              (candidate) => candidate !== id,
            ),
        })),

      setWorkspaceEvidenceIds: (ids) =>
        set({
          workspaceEvidenceIds: Array.from(
            new Set(ids),
          ),
        }),

      setViewport: (zoom, pan) =>
        set({
          zoom,
          pan,
        }),

      resetBoard: () =>
        set({
          discoveredEdges: [],
          playerEdges: [],
          selectedNodeId: null,
          focusNodeId: null,
          workspaceEvidenceIds: [
            ...INITIAL_WORKSPACE,
          ],
        }),
    }),
    {
      name: 'vp-evidence-station-state',
      partialize: (state) => ({
        nodePositions: state.nodePositions,
        playerEdges: state.playerEdges,
        discoveredEdges: state.discoveredEdges,
        workspaceEvidenceIds:
          state.workspaceEvidenceIds,
      }),
    },
  ),
);