import { CommandRegistry, CommandResult } from '../commandRegistry';
import { useAudioStore } from '@/state/audioStore';

/**
 * Global Interactive Player Notebook Command Module (Phase 8)
 * Command: /notebook [--write <text> | --clear]
 * Allows players to keep track of geodetic bearings, coordinates, ciphers, and clues.
 * BUNKER_7 actively monitors entries for forbidden variables (4,211, 4.5Hz, Lebanon coordinates)
 * and intercepts typewriter logic under high cognitive drift!
 */
export function registerNotebookCommands(
  registry: CommandRegistry
) {
  registry.register({
    name: 'notebook',
    description:
      'Access the global investigator notebook or record geodetic coordinates, ciphers, and clues',
    usage:
      'notebook OR notebook --write <text> OR notebook --clear',
    aliases: ['notes', 'diary', 'scratchpad'],

    handler: async (
      args: string[]
    ): Promise<CommandResult> => {
      const { play } = useAudioStore.getState();

      const writeIndex = args.indexOf('--write');
      const clearIndex = args.indexOf('--clear');

      // Initialize notebook in localStorage if it doesn't exist
      const getNotes = (): string[] => {
        if (typeof window === 'undefined') {
          return [];
        }

        const saved = localStorage.getItem(
          'vp_investigator_notebook'
        );

        return saved ? JSON.parse(saved) : [];
      };

      const saveNotes = (notes: string[]) => {
        if (typeof window === 'undefined') {
          return;
        }

        localStorage.setItem(
          'vp_investigator_notebook',
          JSON.stringify(notes)
        );
      };

      // CASE 1: Clear the entire notebook
      if (
        clearIndex !== -1 ||
        args[0] === '--clear'
      ) {
        saveNotes([]);

        if (typeof play === 'function') {
          play('click');
        }

        return {
          output:
            `NOTEBOOK SHEET CLEARED.\n` +
            `------------------------------------------------\n` +
            `All local text segments and geodetic observations ` +
            `purged from cache memory banks.`,
          type: 'success',
        };
      }

      // CASE 2: Append a new text segment
      if (
        writeIndex !== -1 ||
        (args[0] === '--write' &&
          args.length > 1)
      ) {
        let textContent = '';

        if (writeIndex !== -1) {
          textContent = args
            .slice(writeIndex + 1)
            .join(' ')
            .trim();
        } else {
          textContent = args
            .slice(1)
            .join(' ')
            .trim();
        }

        if (textContent) {
          const currentNotes = getNotes();

          currentNotes.push(textContent);
          saveNotes(currentNotes);

          if (typeof play === 'function') {
            play('click');
          }

          // Check for diegetic intercepts for high cognitive drift
          const lowerText =
            textContent.toLowerCase();

          const isForbidden =
            lowerText.includes('4211') ||
            lowerText.includes('4,211') ||
            lowerText.includes('4.5hz') ||
            lowerText.includes('38°n') ||
            lowerText.includes('97°w') ||
            lowerText.includes('lebanon') ||
            lowerText.includes('kansas');

          if (isForbidden) {
            return {
              output:
                `OBSERVATION RECOGNIZED // CAUTION ADVISED\n` +
                `------------------------------------------------\n` +
                `Observation: "${textContent}"\n\n` +
                `BUNKER_7: Entries contain variables locked ` +
                `under cognitive drift protocols. The keys are ` +
                `striking without ink. The carriage is writing ` +
                `to an empty field.`,
              type: 'warning',
            };
          }

          return {
            output:
              `OBSERVATION RECORDED: "${textContent}"\n` +
              `------------------------------------------------\n` +
              `Observation logged successfully in archival memory banks.`,
            type: 'success',
          };
        }
      }

      // CASE 3: View full notebook entries
      const notes = getNotes();

      if (notes.length === 0) {
        return {
          output:
            `GLOBAL INVESTIGATOR NOTEBOOK // VACANT\n` +
            `------------------------------------------------\n` +
            `No geodetic observations or signal ciphers recorded yet.\n` +
            `Use "notebook --write <text>" to log observations.`,
          type: 'info',
        };
      }

      const formatted = [
        'GLOBAL INVESTIGATOR NOTEBOOK // ACTIVE INDEX',
        '================================================',
        ...notes.map(
          (note, index) =>
            `[Observation #${String(index + 1).padStart(
              2,
              '0'
            )}]: ${note}`
        ),
        '================================================',
        `Total observations compiled: ${notes.length}.`,
        'Use "notebook --clear" to erase database cache.',
      ].join('\n');

      if (typeof play === 'function') {
        play('click');
      }

      return {
        output: formatted,
        type: 'system',
      };
    },
  });
}