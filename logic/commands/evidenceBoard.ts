import { CommandRegistry } from '../commandRegistry';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { useAtlasStore } from '@/state/atlasStore';
import { normalizeBoardConnection, useProgressionStore } from '@/state/progressionStore';
import { resolveBoardRelationship } from '@/lib/evidenceBoard/relationshipResolver';
import { useUIStore } from '@/state/uiStore';

export function registerEvidenceBoardCommands(registry: CommandRegistry) {
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

      useEvidenceBoardStore.getState().selectNode(place.slug);
      useUIStore.getState().setActiveModule('evidence');

      return {
        output: `Focused: ${place.name}`,
        type: 'success' as const,
      };
    },
  });

  registry.register({
    name: 'connect',
    description: 'Create a suspected or canonically established connection between two cases',
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
          p.name.toLowerCase().includes(args[0].toLowerCase()),
      );
      const b = places.find(
        (p) =>
          p.slug === args[1] ||
          p.name.toLowerCase().includes(args[1].toLowerCase()),
      );

      if (!a || !b) {
        return {
          output: 'One or both cases not found.',
          type: 'error' as const,
        };
      }

      if (a.slug === b.slug) {
        return {
          output: 'A case cannot be connected to itself.',
          type: 'error' as const,
        };
      }

      const progression = useProgressionStore.getState();
      const resolution = resolveBoardRelationship(
        a.slug,
        b.slug,
        progression.investigatedPlaceIds,
      );

            const canonicalId = resolution.canonicalId;

      const canonical =
        resolution.canonical && canonicalId !== null;

      const alreadyCanonical =
        canonical &&
        canonicalId !== null &&
        progression.boardConnections.includes(canonicalId);

      if (canonical && canonicalId !== null && !alreadyCanonical) {
        progression.addBoardConnection(canonicalId);
      }

      const edgeId =
        `player-${canonicalId ?? `${a.slug}-${b.slug}`}`;

      const existing = useEvidenceBoardStore
        .getState()
        .playerEdges.find((edge) => edge.id === edgeId);

      if (!existing) {
        useEvidenceBoardStore.getState().addPlayerEdge({
          id: edgeId,
          source: a.slug,
          target: b.slug,
          type: canonical ? 'confirmed' : 'suspected',
          label:
            resolution.relationship?.relationship ??
            'SUSPECTED',
        });
      }

      if (canonical) {
        return {
          output:
            `Canonical connection recorded: ${a.name} ↔ ${b.name}\n` +
            `Status: CONFIRMED\n` +
            `Key: ${canonicalId}`,
          type: alreadyCanonical
            ? 'warning' as const
            : 'success' as const,
        };
      }

      const reason =
        resolution.reason === 'authored-proposed'
          ? 'The authored relationship is still proposed.'
          : resolution.reason === 'case-not-investigated'
            ? 'Both cases must be investigated before this source relationship becomes canonical.'
            : 'No authored relationship matches these cases.';

      return {
        output:
          `Player connection recorded: ${a.name} ↔ ${b.name}\n` +
          `Status: SUSPECTED\n` +
          `${reason}`,
        type: 'success' as const,
      };
    },
  });

  registry.register({
    name: 'disconnect',
    description: 'Remove a player-created connection',
    usage: 'disconnect <edge-id>',
    handler: (args: string[]) => {
      const id = args[0];

      if (!id) {
        return {
          output: 'Usage: disconnect <edge-id>',
          type: 'error' as const,
        };
      }

      const board = useEvidenceBoardStore.getState();
      const edge = board.playerEdges.find((candidate) => candidate.id === id);
      const canonicalId = edge
        ? `${edge.source}::${edge.target}`
        : id.replace(/^player-/, '').replaceAll('-', '::');

      const progression = useProgressionStore.getState();
      const normalizedId = normalizeBoardConnection(canonicalId);
      const isCanonical = progression.boardConnections.includes(normalizedId);
      const removedCanonical = isCanonical
        ? progression.removeBoardConnection(normalizedId)
        : false;

      if (edge) {
        board.removePlayerEdge(id);
      }

      if (!removedCanonical && !edge) {
        return {
          output: `Connection not found: ${id}`,
          type: 'warning' as const,
        };
      }

      return {
        output: removedCanonical
          ? `Canonical connection removed: ${normalizedId}`
          : `Player connection removed: ${id}`,
        type: 'success' as const,
      };
    },
  });
}
