import type { Edge, Node } from '@xyflow/react';

export type BoardNodeType =
  | 'evidence'
  | 'place'
  | 'theory'
  | 'person'
  | 'signal';

export type BoardEdgeType =
  | 'resonance'
  | 'causation'
  | 'similarity'
  | 'contradiction'
  | 'reference';

export interface BoardNodeData
  extends Record<string, unknown> {
  label: string;
  type: BoardNodeType;
  status?: string;
  description?: string;
  sourceId?: string;
}

export interface BoardEdgeData
  extends Record<string, unknown> {
  type: BoardEdgeType;
  label?: string;
  confidence?: number;
  sourceId?: string;
}

export type EvidenceBoardNode =
  Node<BoardNodeData>;

export type EvidenceBoardEdge =
  Edge<BoardEdgeData>;