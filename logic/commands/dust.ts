import { CommandRegistry, CommandResult } from '../commandRegistry';
import { useUIStore } from '@/state/uiStore';
import { useAudioStore } from '@/state/audioStore';

export function registerDustCommands(registry: CommandRegistry) {
  registry.register({
    name: 'ground',
    description: 'Perform grounding ritual to reduce observer dust levels',
    usage: 'ground',
    aliases: ['cleanse', 'anchor'],
    handler: async (): Promise<CommandResult> => {
      const audio = useAudioStore.getState();
      const ui = useUIStore.getState();
      const dustBefore = ui.status.dustIndex;

      // Execute grounding logic inside our refactored store
      const result = ui.ground();

      if (!result.success) {
        audio.play('error'); // Play hardware block noise
        return {
          output: result.message,
          type: 'warning',
        };
      }

      // Successful grounding sequence
      audio.play('return'); // Heavy gear rotation click sound
      const dustAfter = ui.status.dustIndex;

      return {
        output: `${result.message}\nDust compression ratio: ${dustBefore}% → ${dustAfter}%`,
        type: 'success',
      };
    },
  });

  registry.register({
    name: 'restore',
    description: 'Recalibrate observer stability metric to baseline safety',
    usage: 'restore',
    aliases: ['calibrate', 'stabilize'],
    handler: async (): Promise<CommandResult> => {
      const audio = useAudioStore.getState();
      const ui = useUIStore.getState();

      const result = ui.restoreStability();

      if (!result.success) {
        audio.play('error');
        return {
          output: result.message,
          type: 'warning',
        };
      }

      audio.play('alert'); // Deep bell chime
      const currentStability = ui.status.observerStability;

      return {
        output: `${result.message}\nCalibration metric locked at: ${currentStability.toFixed(0)}%`,
        type: 'success',
      };
    },
  });
}