import { CommandRegistry, CommandResult } from '../commandRegistry';
import { useProgressionStore } from '@/state/progressionStore';

export function registerDustCommands(registry: CommandRegistry) {
  /*
   * Development-only instrumentation.
   *
   * The canonical gameplay commands `ground` and `restore` live in
   * investigation.ts. This module must not register duplicate copies.
   */
  if (process.env.NODE_ENV === 'development') {
    registry.register({
      name: 'dev-dust',
      description: 'Development-only Dust instrumentation',
      usage: 'dev-dust <amount>',
      aliases: ['dust-test'],
      handler: async (args: string[]): Promise<CommandResult> => {
        const rawAmount = args[0];
        const amount = Number(rawAmount);

        if (!rawAmount || !Number.isFinite(amount) || amount === 0) {
          return {
            output:
              'DEV DUST ERROR.\nUsage: dev-dust <amount>\nExample: dev-dust 12',
            type: 'error',
          };
        }

        const progression = useProgressionStore.getState();
        const after = progression.addDust(amount);

        return {
          output: [
            'DEVELOPMENT INSTRUMENTATION',
            '────────────────────────────',
            `Dust after adjustment: ${after}`,
            'Authority: progressionStore',
          ].join('\n'),
          type: 'success',
        };
      },
    });
  }
}