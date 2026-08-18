import { CommandRegistry } from '../commandRegistry';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { useAtlasStore } from '@/state/atlasStore';
import { useUIStore } from '@/state/uiStore';

export function registerEvidenceBoardCommands(
  registry: CommandRegistry,
) {
  registry.register({
    name: 'board',
    description: 'Open the Evidence Board',
    usage: 'board',
    handler: () => {
      useUIStore.getState().setActiveModule('evidence');

      return {
        output: 'Evidence Board initialized.',
        type: 'success' as const,
      };
    },
  });

  registry.register({
    name: 'focus',
    description: 'Focus the Evidence Board on a specific case',
    usage: 'focus <case-name>',
    handler: (args: string[]) => {
      const query = args.join(' ').toLowerCase();

      if (!query) {
        return {
          output: 'Usage: focus <case-name>',
          type: 'error' as const,
        };
      }

      const { places } = useAtlasStore.getState();

      const place = places.find(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.slug.includes(query),
      );

      if (!place) {
        return {
          output: `Case not found: "${query}"`,
          type: 'error' as const,
        };
      }

      useEvidenceBoardStore
        .getState()
        .selectNode(place.slug);

      useUIStore
        .getState()
        .setActiveModule('evidence');

      return {
        output: `Focused: ${place.name}`,
        type: 'success' as const,
      };
    },
  });

  registry.register({
    name: 'connect',
    description:
      'Create a suspected player connection between two cases',
    usage: 'connect <case-a> <case-b>',
    handler: (args: string[]) => {
      if (args.length < 2) {
        return {
          output: 'Usage: connect <case-a> <case-b>',
          type: 'error' as const,
        };
      }

      const { places } = useAtlasStore.getState();

      const a = places.find(
        (p) =>
          p.slug === args[0] ||
          p.name
            .toLowerCase()
            .includes(args[0].toLowerCase()),
      );

      const b = places.find(
        (p) =>
          p.slug === args[1] ||
          p.name
            .toLowerCase()
            .includes(args[1].toLowerCase()),
      );

      if (!a || !b) {
        return {
          output: 'One or both cases not found.',
          type: 'error' as const,
        };
      }

      if (a.slug === b.slug) {
        return {
          output:
            'A case cannot be connected to itself.',
          type: 'error' as const,
        };
      }

      const edgeId = `player-${a.slug}-${b.slug}`;

      const board =
        useEvidenceBoardStore.getState();

      const exists = board.playerEdges.some(
        (edge) =>
          (edge.source === a.slug &&
            edge.target === b.slug) ||
          (edge.source === b.slug &&
            edge.target === a.slug),
      );

      if (exists) {
        return {
          output:
            `Player connection already exists: ${a.name} ↔ ${b.name}\n` +
            `Status: SUSPECTED`,
          type: 'warning' as const,
        };
      }

      /*
       * IMPORTANT:
       *
       * This is deliberately a workspace/player relationship.
       * It does NOT modify progressionStore.boardConnections.
       *
       * Canonical relationships may only be established by
       * authored investigation/progression logic.
       */
      board.addPlayerEdge({
        id: edgeId,
        source: a.slug,
        target: b.slug,
        type: 'suspected',
        label: 'SUSPECTED',
      });

      return {
        output:
          `Player connection recorded: ${a.name} ↔ ${b.name}\n` +
          `Status: SUSPECTED\n` +
          `Key: ${edgeId}`,
        type: 'success' as const,
      };
    },
  });

  registry.register({
    name: 'disconnect',
    description:
      'Remove a player-created connection',
    usage: 'disconnect <edge-id>',
    handler: (args: string[]) => {
      const id = args[0];

      if (!id) {
        return {
          output: 'Usage: disconnect <edge-id>',
          type: 'error' as const,
        };
      }

      const board =
        useEvidenceBoardStore.getState();

      const edge = board.playerEdges.find(
        (candidate) => candidate.id === id,
      );

      if (!edge) {
        return {
          output:
            `Player connection not found: ${id}`,
          type: 'warning' as const,
        };
      }

      /*
       * IMPORTANT:
       *
       * Removing a player relationship must NEVER mutate
       * canonical progression.
       *
       * Canonical boardConnections are owned exclusively by
       * progressionStore and can only be changed by
       * legitimate investigation/progression logic.
       */
      board.removePlayerEdge(id);

      return {
        output:
          `Player connection removed: ${edge.source} ↔ ${edge.target}\n` +
          `Key: ${id}`,
        type: 'success' as const,
      };
    },
  });
}