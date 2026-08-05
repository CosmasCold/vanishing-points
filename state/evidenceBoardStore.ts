import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Connection } from 'reactflow';
import { EvidenceBoardNode, EvidenceBoardEdge } from '@/types/evidenceBoard';

interface EvidenceBoardState {
  nodes: EvidenceBoardNode[];
  edges: EvidenceBoardEdge[];
  activeBoardId: string | null;
  selectedNodeId: string | null;
  
  setNodes: (nodes: EvidenceBoardNode[]) => void;
  setEdges: (edges: EvidenceBoardEdge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  addNode: (node: EvidenceBoardNode) => void;
  addEdge: (edge: EvidenceBoardEdge) => void;
  onConnect: (connection: Connection) => void;
  removeNode: (id: string) => void;
  removeEdge: (id: string) => void;
  selectNode: (id: string | null) => void;
  clearBoard: () => void;
  
  populateFromInvestigation: (investigationId: string, evidenceItems: any[], place: any) => void;
}

export const useEvidenceBoardStore = create<EvidenceBoardState>((set, get) => ({
  nodes: [],
  edges: [],
  activeBoardId: null,
  selectedNodeId: null,
  
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  onNodesChange: (changes) => set((s) => ({ 
    nodes: applyNodeChanges(changes, s.nodes) as EvidenceBoardNode[] 
  })),
  
  onEdgesChange: (changes) => set((s) => ({ 
    edges: applyEdgeChanges(changes, s.edges) as EvidenceBoardEdge[] 
  })),
  
  addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] })),
  
  addEdge: (edge) => set((s) => ({ edges: [...s.edges, edge] })),
  
  onConnect: (connection) => {
    if (!connection.source || !connection.target) return;
    const edge: EvidenceBoardEdge = {
      id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
      source: connection.source,
      target: connection.target,
      type: 'default',
      data: {
        type: 'resonance',
        label: 'RESONANCE',
        createdAt: new Date().toISOString(),
      },
    };
    set((s) => ({ edges: [...s.edges, edge] }));
  },
  
  removeNode: (id) => set((s) => ({ 
    nodes: s.nodes.filter((n) => n.id !== id),
    edges: s.edges.filter((e) => e.source !== id && e.target !== id),
    selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
  })),
  
  removeEdge: (id) => set((s) => ({ edges: s.edges.filter((e) => e.id !== id) })),
  
  selectNode: (id) => set({ selectedNodeId: id }),
  
  clearBoard: () => set({ nodes: [], edges: [], selectedNodeId: null, activeBoardId: null }),
  
  populateFromInvestigation: (invId, evidenceItems, place) => {
    const existing = get().nodes.some((n) => n.data?.sourceId === place.slug);
    if (existing) return;
    
    const newNodes: EvidenceBoardNode[] = [];
    const newEdges: EvidenceBoardEdge[] = [];
    
    const placeNodeId = `place-${place.slug}`;
    newNodes.push({
      id: placeNodeId,
      type: 'place',
      position: { x: 400, y: 300 },
      data: {
        label: place.name,
        type: 'place',
        status: place.status,
        description: place.address.formatted,
        sourceId: place.slug,
        createdAt: new Date().toISOString(),
      },
    });
    
    evidenceItems.forEach((item: any, i: number) => {
      const angle = (i / Math.max(evidenceItems.length, 1)) * 2 * Math.PI;
      const radius = 220;
      const nodeId = `ev-${invId}-${item.id}`;
      newNodes.push({
        id: nodeId,
        type: 'evidence',
        position: { 
          x: 400 + Math.cos(angle) * radius, 
          y: 300 + Math.sin(angle) * radius 
        },
        data: {
          label: item.title,
          type: 'evidence',
          status: item.status,
          description: item.description,
          sourceId: item.id,
          mediaUrl: item.mediaUrl,
          createdAt: new Date().toISOString(),
        },
      });
      
      newEdges.push({
        id: `edge-${placeNodeId}-${nodeId}`,
        source: placeNodeId,
        target: nodeId,
        type: 'default',
        data: {
          type: 'reference',
          createdAt: new Date().toISOString(),
        },
      });
    });
    
    place.connectedTo?.forEach((slug: string, i: number) => {
      const angle = Math.PI + (i / Math.max(place.connectedTo.length, 1)) * Math.PI;
      const radius = 340;
      const nodeId = `place-ref-${slug}`;
      if (get().nodes.some((n) => n.id === nodeId)) return;
      
      newNodes.push({
        id: nodeId,
        type: 'place',
        position: { 
          x: 400 + Math.cos(angle) * radius, 
          y: 300 + Math.sin(angle) * radius 
        },
        data: {
          label: slug,
          type: 'place',
          status: 'unknown',
          sourceId: slug,
          createdAt: new Date().toISOString(),
        },
      });
      
      newEdges.push({
        id: `edge-${placeNodeId}-${nodeId}`,
        source: placeNodeId,
        target: nodeId,
        type: 'default',
        data: {
          type: 'resonance',
          label: 'RESONANCE',
          createdAt: new Date().toISOString(),
        },
      });
    });
    
    set((s) => ({
      nodes: [...s.nodes, ...newNodes],
      edges: [...s.edges, ...newEdges],
      activeBoardId: invId,
    }));
  },
}));