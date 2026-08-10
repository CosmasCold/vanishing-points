import { CommandRegistry, CommandResult } from '../commandRegistry';
import { useUIStore } from '@/state/uiStore';
import { useAudioStore } from '@/state/audioStore';

/**
 * Global Interactive Player Notebook Command Module (Phase 8)
 * Command: /notebook [--write <text> | --clear]
 * Allows players to keep track of geodetic bearings, coordinates, ciphers, and clues.
 * BUNKER_7 actively monitors entries for forbidden variables (4,211, 4.5Hz, Lebanon coordinates)
 * and intercepts typewriter logic under high cognitive drift!
 */
export function registerNotebookCommands(registry: CommandRegistry) {
  registry.register({
    name: 'notebook',
    description: 'Access the global investigator notebook or record geodetic coordinates, ciphers, and clues',
    usage: 'notebook OR notebook --write <text> OR notebook --clear',
    aliases: ['notes', 'diary', 'scratchpad'],
    handler: async (args: string[]): Promise<CommandResult> => {
      const { status, updateStatus } = useUIStore.getState();
      const { play } = useAudioStore.getState();

      const writeIndex = args.indexOf('--write');
      const clearIndex = args.indexOf('--clear');

      // Initialize notebook in localStorage if it doesn't exist
      const getNotes = (): string[] => {
        if (typeof window === 'undefined') return [];
        const saved = localStorage.getItem('vp_investigator_notebook');
        return saved ? JSON.parse(saved) : [];
      };

      const saveNotes = (notes: string[]) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem('vp_investigator_notebook', JSON.stringify(notes));
      };

      // CASE 1: Clear the entire notebook
      if (clearIndex !== -1 || args[0] === '--clear') {
        saveNotes([]);
        play('click');
        return {
          output: `NOTEBOOK SHEET CLEARED.\n------------------------------------------------\nAll local text segments and geodetic observations purged from cache memory banks.`,
          type: 'success',
        };
      }

      // CASE 2: Append a new text segment
      if (writeIndex !== -1 || (args[0] === '--write' && args.length > 1)) {
        let textContent = '';
        if (writeIndex !== -1) {
          textContent = args.slice(writeIndex + 1).join(' ').trim();
        } else {
          textContent = args.slice(1).join(' ').trim();
        }

        if (!textContent) {
          return {
            output: 'NOTEBOOK ERROR: Entry segment is empty. Usage: notebook --write <your observations...>',
            type: 'error',
          };
        }

        // --- SCANNING PATTERNS: BUNKER_7 INTERCEPT OF FORBIDDEN LOGS ---
        const lowerText = textContent.toLowerCase();
        const hasDays = lowerText.includes('4211') || lowerText.includes('4,211') || lowerText.includes('four thousand');
        const hasHertz = lowerText.includes('4.5') || lowerText.includes('4.5hz') || lowerText.includes('four point five');
        const hasNull = lowerText.includes('-97') || lowerText.includes('38n') || lowerText.includes('lebanon') || lowerText.includes('kansas') || lowerText.includes('null point');

        if (hasDays) {
          play('alert');
          // Increase Dust and Strain Stability for hitting cognitive paradox
          updateStatus({
            dustIndex: Math.min(100, status.dustIndex + 8),
            observerStability: Math.max(0, status.observerStability - 12),
          });
          return {
            output: `⚠️ COGNITIVE INTERCEPT: LOOP CORE BOUNDS EXCEEDED.\n------------------------------------------------\n"Subject completed exactly 4,211 days of continuous service."\n"Subject entered the basement carrel to perform a grounding ritual... and has not emerged."\n------------------------------------------------\nBUNKER_7: I hear the typewriter carriage striking itself in the vacant carrel behind you. The ribbon is dry, but the letters are matching your keyboard strokes.\nStop writing. You have been in this chair before. (+8 Dust, -12% Stability)`,
            type: 'error',
          };
        }

        if (hasHertz) {
          play('alert');
          updateStatus({
            dustIndex: Math.min(100, status.dustIndex + 5),
            observerStability: Math.max(0, status.observerStability - 8),
          });
          return {
            output: `⚠️ COGNITIVE INTERCEPT: FREQUENCY DRIVER ECHOING.\n------------------------------------------------\n"Mount Weather hums. Site R countdown loop aligned."\n"The Blue Ridge complexes are breathing."\n------------------------------------------------\nBUNKER_7: The 4.5 Hz frequency is not in the pylon. It is in the granite beneath your desk. It is vibrating your tea mug. It is recording your pulse. (+5 Dust, -8% Stability)`,
            type: 'warning',
          };
        }

        if (hasNull) {
          play('alert');
          updateStatus({
            dustIndex: Math.min(100, status.dustIndex + 12),
            observerStability: Math.max(0, status.observerStability - 15),
          });
          return {
            output: `⚠️ COGNITIVE INTERCEPT: GEODETIC NULL CONVERGENCE.\n------------------------------------------------\n"The lines cross precisely in an empty wheat field outside Lebanon."\n"The wheat grows in a counterclockwise spiral rotating 15 degrees annually."\n------------------------------------------------\nBUNKER_7: Do not map the lines on the felt board. The space has nowhere left to fold. The summer solstice of 2047 is bleeding backwards into your terminal glass.\nDo not touch the ground loops inside the centroid. (+12 Dust, -15% Stability)`,
            type: 'error',
          };
        }

        // Standard save
        const currentNotes = getNotes();
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        const newEntry = `[${timestamp}] ${textContent}`;
        
        saveNotes([...currentNotes, newEntry]);
        play('type');

        return {
          output: `ENTRY REGISTERED IN CACHE INDEX.\nTimestamp: ${timestamp}\nObservation: "${textContent}"\n\nType /notebook to view your complete diary.`,
          type: 'success',
        };
      }

      // CASE 3: View full notebook entries
      const notes = getNotes();
      if (notes.length === 0) {
        return {
          output: `GLOBAL INVESTIGATOR NOTEBOOK // VACANT\n------------------------------------------------\nNo geodetic observations or signal ciphers recorded yet.\nUse "notebook --write <text>" to log observations.`,
          type: 'info',
        };
      }

      const formatted = [
        'GLOBAL INVESTIGATOR NOTEBOOK // ACTIVE INDEX',
        '================================================',
        ...notes,
        '================================================',
        `Total observations compiled: ${notes.length}.`,
        'Use "notebook --clear" to erase database cache.'
      ].join('\n');

      play('click');
      return {
        output: formatted,
        type: 'system',
      };
    },
  });
}
