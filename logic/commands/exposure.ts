import {
  CommandRegistry,
  CommandResult,
} from '../commandRegistry';

import {
  EXPOSURES,
  getExposure,
} from '@/data/exposures';

import {
  performExposure,
} from '@/logic/progression/exposure';

import { useAudioStore } from '@/state/audioStore';
import { useProgressionStore } from '@/state/progressionStore';

export function registerExposureCommands(
  registry: CommandRegistry
) {
  registry.register({
    name: 'expose',

    description:
      'Force a canonical hidden observation and consume Dust',

    usage:
      'expose <exposure-id>',

    aliases: [
      'exposure',
      'pierce',
    ],

    handler: async (
      args: string[]
    ): Promise<CommandResult> => {
      const id =
        args[0]?.trim();

      if (!id || id === 'list') {
        const dust =
          useProgressionStore.getState()
            .dustIndex;

        return {
          output: [
            'EXPOSURE REGISTER',
            '------------------------------------------------',

            ...EXPOSURES.map(
              (exposure) =>
                `${exposure.id} | ` +
                `${exposure.depth.toUpperCase()} | ` +
                `COST ${exposure.dustCost} | ` +
                `REQ_D ${exposure.minimumDust} | ` +
                `${
                  dust >= exposure.minimumDust
                    ? 'AVAILABLE'
                    : 'SEALED'
                }`
            ),

            '------------------------------------------------',
            'Thresholds govern perception. Costs consume Dust.',
            'Usage: expose <exposure-id>',
          ].join('\n'),

          type: 'info',
        };
      }

      const definition =
        getExposure(id);

      if (!definition) {
        return {
          output:
            `EXPOSURE REJECTED: '${id}' ` +
            `is not an authored exposure ` +
            `in the canonical register.`,

          type: 'error',
        };
      }

      const result =
        performExposure(definition);

      if (!result.allowed) {
        const reasonMessage =
          result.reason === 'ALREADY_EXPOSED'
            ? 'Exposure already committed for this case.'
            : result.reason === 'INSUFFICIENT_DUST'
              ? `Insufficient Dust. Required: ${definition.dustCost}.`
              : 'EXPOSURE REJECTED.';

        return {
          output: reasonMessage,
          type: 'warning',
        };
      }

      useAudioStore
        .getState()
        .play('alert');

      return {
        output: [
          'CANONICAL EXPOSURE COMMITTED',
          '------------------------------------------------',

          `TARGET: ${definition.title.toUpperCase()}`,
          `DEPTH: ${definition.depth.toUpperCase()}`,

          `DUST: ${result.dustBefore} -> ` +
          `${result.dustAfter} ` +
          `(-${definition.dustCost})`,

          `EVIDENCE: ${definition.resultEvidenceId}`,

          '------------------------------------------------',

          definition.resultDescription,

          '------------------------------------------------',

          'BUNKER_7: ' +
          'The observation is now part of the record.',
        ].join('\n'),

        type: 'success',
      };
    },
  });
}