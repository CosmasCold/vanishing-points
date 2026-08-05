import { CommandRegistry } from '../commandRegistry';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { useUIStore } from '@/state/uiStore';

export function registerEvidenceBoardCommands(registry: CommandRegistry) {
  registry.register({
    name: 'board',
    description: 'Open evidence board',
    usage: 'board',
    handler: () => {
      useUIStore.getState().setActiveModule('evidence');
      const { nodes, edges } = useEvidenceBoardStore.getState();
      return {
        output: `Evidence board initialized.\nNodes: ${nodes.length}\nConnections: ${edges.length}\nDrag to pan. Scroll to zoom. Drag node handles to connect.`,
        type: 'success' as const,
      };
    },
  });

  registry.register({
    name: 'theory',
    description: 'Add a theory node to the evidence board',
    usage: 'theory <text>',
    handler: (args: string[]) => {
      const text = args.join(' ');
      if (!text) return { output: 'Usage: theory <text>', type: 'error' as const };
      
      useEvidenceBoardStore.getState().addNode({
        id: `theory-${Date.now()}`,
        type: 'theory',
        position: { x: 400, y: 300 },
        data: {
          label: text,
          type: 'theory',
          createdAt: new Date().toISOString(),
        },
      });
      
      return { output: `Theory node added: "${text}"`, type: 'success' as const };
    },
  });

  registry.register({
    name: 'connect',
    description: 'Connect two nodes by ID',
    usage: 'connect <source-id> <target-id>',
    handler: (args: string[]) => {
      const [source, target] = args;
      if (!source || !target) {
        return { output: 'Usage: connect <source-id> <target-id>', type: 'error' as const };
      }
      
      const { nodes } = useEvidenceBoardStore.getState();
      if (!nodes.some((n) => n.id === source)) {
        return { output: `Source node not found: ${source}`, type: 'error' as const };
      }
      if (!nodes.some((n) => n.id === target)) {
        return { output: `Target node not found: ${target}`, type: 'error' as const };
      }
      
      useEvidenceBoardStore.getState().addEdge({
        id: `edge-${source}-${target}`,
        source,
        target,
        type: 'default',
        data: {
          type: 'resonance',
          label: 'MANUAL LINK',
          createdAt: new Date().toISOString(),
        },
      });
      
      return { output: `Connected ${source} → ${target}`, type: 'success' as const };
    },
  });

  registry.register({
    name: 'clear-board',
    description: 'Clear all nodes and connections from the board',
    usage: 'clear-board',
    handler: () => {
      useEvidenceBoardStore.getState().clearBoard();
      return { output: 'Evidence board cleared.', type: 'warning' as const };
    },
  });
}