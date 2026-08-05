import { Node, Edge } from 'reactflow';

export type BoardNodeType = 'evidence' | 'place' | 'theory' | 'person' | 'signal';

export type BoardEdgeType = 'resonance' | 'causation' | 'similarity' | 'contradiction' | 'reference';

export interface BoardNodeData {
  label: string;
  type: BoardNodeType;
  status?: string;
  description?: string;
  sourceId?: string;
  mediaUrl?: string;
  createdAt: string;
}

export interface BoardEdgeData {
  type: BoardEdgeType;
  label?: string;
  createdAt: string;
}

export type EvidenceBoardNode = Node<BoardNodeData>;
export type EvidenceBoardEdge = Edge<BoardEdgeData>;