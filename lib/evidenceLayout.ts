import dagre from 'dagre';
import { Node, Edge } from 'reactflow';

interface LayoutOptions {
  direction?: 'TB' | 'LR'; // Top-Bottom or Left-Right
  nodeWidth?: number;
  nodeHeight?: number;
  ranksep?: number; // vertical gap
  nodesep?: number; // horizontal gap
}

export function layoutEvidenceGraph<T>(
  nodes: Node<T>[],
  edges: Edge[],
  options: LayoutOptions = {}
): { nodes: Node<T>[]; edges: Edge[] } {
  const {
    direction = 'TB',
    nodeWidth = 220,
    nodeHeight = 80,
    ranksep = 60,
    nodesep = 40,
  } = options;

  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: direction, ranksep, nodesep });

  nodes.forEach((node) => {
    graph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
      graph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(graph);

  const positionedNodes = nodes.map((node) => {
    const pos = graph.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - nodeWidth / 2,
        y: pos.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: positionedNodes, edges };
}