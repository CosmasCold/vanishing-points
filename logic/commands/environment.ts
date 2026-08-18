import { CommandRegistry } from '../commandRegistry';
import { useEnvironmentStore } from '@/state/environmentStore';
import { useProgressionStore } from '@/state/progressionStore';

export function registerEnvironmentCommands(registry: CommandRegistry) {
  registry.register({
    name: 'anomalies',
    description: 'List detected environmental anomalies',
    usage: 'anomalies',
    aliases: ['changes', 'drift'],
    handler: () => {
      const { changes } = useEnvironmentStore.getState();
      const applied = changes.filter((c) => c.applied);

      if (applied.length === 0) {
        return {
          output: 'No environmental anomalies detected.\nReality consensus: nominal.',
          type: 'success' as const,
        };
      }

      let output = `ENVIRONMENTAL ANOMALIES LOGGED: ${applied.length}\n`;
      output += '═══════════════════════════════════════\n\n';

      applied.forEach((c) => {
        output += `[${c.location.toUpperCase()}] ${c.description}\n`;
        output += `    Dust threshold: ${c.dustRequired} | Stability max: ${c.stabilityMax}%\n\n`;
      });

      const { observerStability } = useProgressionStore.getState();
      if (observerStability <= 40) {
        output += 'WARNING: Low stability may prevent detection of further anomalies.\n';
      }

      return { output, type: 'warning' as const };
    },
  });
}
