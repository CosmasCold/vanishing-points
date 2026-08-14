import type {
  Edge,
  Node,
  NodeProps,
  XYPosition,
} from "@xyflow/react";

/**
 * Generic Evidence Board node data.
 *
 * React Flow v12 constrains node data to Record<string, unknown>,
 * so the generic is explicitly constrained here.
 */
export type EvidenceNodeData = Record<string, unknown>;

/**
 * Standard evidence-board node.
 */
export type EvidenceNode<T extends EvidenceNodeData = EvidenceNodeData> =
  Node<T>;

/**
 * Standard evidence-board edge.
 */
export type EvidenceEdge = Edge;

/**
 * Position map used by the Evidence Board.
 */
export type EvidenceNodePositions = Record<
  string,
  XYPosition
>;

/**
 * Generic node props helper.
 */
export type EvidenceNodeProps<
  T extends EvidenceNodeData = EvidenceNodeData
> = NodeProps<EvidenceNode<T>>;

/**
 * Stable node ID helper.
 */
export function evidenceNodeId(
  type: string,
  id: string
): string {
  return `${type}:${id}`;
}

/**
 * Stable edge ID helper.
 */
export function evidenceEdgeId(
  source: string,
  target: string,
  relationship: string = "related"
): string {
  return `edge:${source}:${target}:${relationship}`;
}

/**
 * Canonical undirected relationship key.
 *
 * A -> B and B -> A resolve to the same key.
 */
export function evidenceConnectionKey(
  source: string,
  target: string
): string {
  return [source, target]
    .sort()
    .join("::");
}