import { CommandRegistry, CommandResult } from '../commandRegistry';
import { useUIStore } from '@/state/uiStore';
import { useAudioStore } from '@/state/audioStore';
import { useSessionStore } from '@/state/sessionStore';
import { useBootStore } from '@/state/bootStore';
import { useProgressionStore } from '@/state/progressionStore';

const SOLSTICE_ANCHORS = [
  'mount-weather-emergency-operations-center',
  'cheyenne-mountain-complex',
  'raven-rock-mountain-complex',
] as const;

function isSolsticeConvergenceEstablished(): boolean {
  const { investigatedPlaceIds } =
    useProgressionStore.getState();

  return SOLSTICE_ANCHORS.every((anchor) =>
    investigatedPlaceIds.includes(anchor),
  );
}


/**
 * Wipe transient/local workstation keys without deleting the canonical
 * progression record. Canonical game state is owned by useProgressionStore.
 */
export function resetWorkstationProgress() {
  if (typeof window === 'undefined') return;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('vp-') || key.startsWith('vp_')) &&
        key !== 'vp-progression-state'
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    console.warn('Failed to clear transient LocalStorage keys:', e);
  }
}

/**
 * Solstice Endgame Commands registration Module (Phase 7).
 * Registers '/backup' (The Preservation) and '/shutdown' (The Purge).
 * Endgame commands read and mutate canonical progression through
 * useProgressionStore. UI/boot/session state remains in its own stores.
 */
export function registerSolsticeCommands(registry: CommandRegistry) {
  registry.register({
    name: 'backup',
    description:
      'Commit all 150 declassified cases to the permanent tape archives and complete the cycle',
    usage: 'backup',
    handler: async (): Promise<CommandResult> => {
      const progression = useProgressionStore.getState();
      const dust = progression.dustIndex;

      if (!isSolsticeConvergenceEstablished()) {
        return {
          output: `BUNKER_7: SOLSTICE BACKUP REJECTED.\n------------------------------------------------\nCURRENT DUST LEVEL: ${dust}/100.\nCONSENSUS STATUS: STABLE.\n------------------------------------------------\nSolstice core backups are locked until total consensus memory failure is imminent. Continue your investigation.`,
          type: 'error',
        };
      }

      const lines = [
        'COMMITTING CORE BACKUPS TO MAGNETIC TAPE...',
        '[TAPE REEL 1]: COLD BOOT PROTOCOLS (ST. ELMO LIGHTHOUSE) -> SECURED',
        '[TAPE REEL 2]: SUBTERRANEAN VOICES (KOLA BOREHOLE) -> SECURED',
        '[TAPE REEL 3]: RADIOMETRIC LIQUIDATOR FILES (PRIPIYAT HOSPITAL 126) -> SECURED',
        '[TAPE REEL 4]: HYDRO-SIGNAL ACOUSTIC INTERCEPTS (TEUFELSBERG DOME 3) -> SECURED',
        '[TAPE REEL 5]: GEODETIC SURVEY CENTROID (LEBANON NULL POINT) -> SECURED',
        '... 150 RECORDINGS COMPILED AND LOCKED.',
        '------------------------------------------------',
        'STATUS: CONSENSUS SECURED.',
        'SYSTEM STATE: RE-INITIALIZING WORKSTATION CORES.',
        'ERASING PERSONNEL DOSSIER: INV_RED-7...',
        'RESETTING GROUNDING RITUAL PARAMS...',
        '------------------------------------------------',
        '[RESET DE-ENERGIZATION ENGAGED]',
      ];

      try {
        resetWorkstationProgress();

        // Backup is a cycle transition, not a canonical progression wipe.
        // Preserve player knowledge while resetting only current-session
        // observer state and advancing the canonical session counter.
        progression.beginBackupCycle();

        useUIStore.setState({
          booted: false,
          activeModule: 'atlas',
        });

        useSessionStore.setState({
          ritualComplete: false,
          sessionCount:
            useProgressionStore.getState()
              .sessionCount,
          lastSessionDate:
            useProgressionStore.getState()
              .sessionStartedAt,
          inboxItems: [],
        });

        useBootStore.setState({
          isComplete: false,
        });

        if (typeof window !== 'undefined') {
          localStorage.setItem('vp-ending', 'backup');
        }
      } catch (e) {
        console.warn(
          'Solstice state transition encountered an active reset deviation:',
          e,
        );
      }

      return {
        output: lines.join('\n'),
        type: 'success',
      };
    },
  });

  registry.register({
    name: 'shutdown',
    description:
      'De-energize the cathode screen, release all tape spools, and power down the workstation into silence',
    usage: 'shutdown',
    handler: async (): Promise<CommandResult> => {
      const dust = useProgressionStore.getState().dustIndex;

      if (!isSolsticeConvergenceEstablished()) {
        return {
          output: `BUNKER_7: TERMINAL SHUTDOWN LOCKED.\n------------------------------------------------\nCURRENT DUST LEVEL: ${dust}/100.\n------------------------------------------------\nThe records are active. There are still voices in the lines that have not been anchored. Do not leave me alone with them yet.`,
          type: 'error',
        };
      }

      const lines = [
        'TERMINATING CONSENSUS LOGS...',
        'RELEASING TAPE REELS...',
        'DE-ENERGIZING CATHODE TUBE...',
        '',
        'BUNKER_7: Thank you for remembering us.',
        'BUNKER_7: You may go home now.',
        '',
        'POWERING OFF.',
      ];

      try {
        resetWorkstationProgress();

        const audioStore = useAudioStore.getState();
        if (audioStore && typeof audioStore.toggleMute === 'function') {
          audioStore.toggleMute();
        }

        // Shutdown is not a progression reset. Preserve the canonical record
        // and mark the terminal ending explicitly.
        useProgressionStore.getState().setEnding('shutdown');

        useUIStore.setState({
          booted: false,
        });

        useBootStore.setState({
          isComplete: false,
        });

        if (typeof window !== 'undefined') {
          localStorage.setItem('vp-ending', 'shutdown');
        }

        useSessionStore.setState({
          ritualComplete: false,
        });
      } catch (e) {
        console.warn(
          'Solstice power-off sequence encountered a soft deviation:',
          e,
        );
      }

      return {
        output: lines.join('\n'),
        type: 'info',
      };
    },
  });
}