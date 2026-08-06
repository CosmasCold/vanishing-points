import { CommandRegistry } from '../commandRegistry';
import { useArtifactStore } from '@/state/artifactStore';
import { PhysicalArtifact } from '@/types/artifacts';

export function registerArtifactCommands(registry: CommandRegistry) {
  registry.register({
    name: 'inventory',
    description: 'List quarantined artifacts',
    usage: 'inventory',
    aliases: ['artifacts', 'quarantine'],
    handler: () => {
      const { inventory } = useArtifactStore.getState();
      if (inventory.length === 0) {
        return { output: 'No items in quarantine.', type: 'info' as const };
      }

      let output = `QUARANTINE INVENTORY: ${inventory.length} ITEMS\n`;
      output += '══════════════════════════════════════\n\n';

      inventory.forEach((a) => {
        const statusColor = a.quarantineStatus === 'anomalous' ? '!' : a.quarantineStatus === 'pending' ? '?' : '-';
        output += `${statusColor} ${a.name}\n`;
        output += `    ${a.material} / ${a.weight} / ${a.condition}\n`;
        output += `    Origin: ${a.origin}\n\n`;
      });

      return { output, type: 'info' as const };
    },
  });

  registry.register({
    name: 'examine-artifact',
    description: 'Open artifact examination viewer',
    usage: 'examine-artifact <artifact-id>',
    handler: (args: string[]) => {
      const id = args[0];
      if (!id) return { output: 'Usage: examine-artifact <artifact-id>', type: 'error' as const };

      const { inventory, openArtifact } = useArtifactStore.getState();
      const artifact = inventory.find((a) => a.id === id);

      if (!artifact) {
        return { output: `Artifact ${id} not found in quarantine.`, type: 'error' as const };
      }

      openArtifact(artifact);
      return {
        output: `Opening examination chamber...\nArtifact: ${artifact.name}\nMaterial: ${artifact.material}\nCondition: ${artifact.condition}\nUse mouse to rotate. Select lamp mode for detailed inspection.`,
        type: 'success' as const,
      };
    },
  });

  registry.register({
    name: 'weigh',
    description: 'Record artifact weight',
    usage: 'weigh <artifact-id>',
    handler: (args: string[]) => {
      const id = args[0];
      if (!id) return { output: 'Usage: weigh <artifact-id>', type: 'error' as const };

      const { inventory, updateArtifact } = useArtifactStore.getState();
      const artifact = inventory.find((a) => a.id === id);
      if (!artifact) return { output: `Artifact ${id} not found.`, type: 'error' as const };

      updateArtifact(id, { hasBeenWeighed: true });
      return {
        output: `Weight recorded: ${artifact.weight}\nAnomalous density: ${artifact.material === 'unknown' ? 'DETECTED' : 'NEGATIVE'}`,
        type: 'success' as const,
      };
    },
  });
}