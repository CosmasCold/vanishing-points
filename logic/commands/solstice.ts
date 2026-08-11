import { CommandRegistry, CommandResult } from '../commandRegistry';
import { useUIStore } from '@/state/uiStore';
import { useAudioStore } from '@/state/audioStore';
import { useSessionStore } from '@/state/sessionStore';
import { useBootStore } from '@/state/bootStore';

/**
 * Wipe all localized localStorage keys starting with 'vp-' or 'vp_'
 * to prevent stale state rehydration on reset [135, 136].
 */
export function resetWorkstationProgress() {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('vp-') || key.startsWith('vp_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    console.warn('Failed to clear LocalStorage keys:', e);
  }
}

/**
 * Solstice Endgame Commands registration Module (Phase 7)
 * Registers '/backup' (The Preservation) and '/shutdown' (The Purge) commands [6, 8].
 * Activates strictly at Dust 85+ during total consensus failure [6].
 * Directly manages Zustand states to trigger physical screen loops or complete de-energization [7].
 */
export function registerSolsticeCommands(registry: CommandRegistry) {
  registry.register({
    name: 'backup',
    description: 'Commit all 150 declassified cases to the permanent tape archives and complete the cycle',
    usage: 'backup',
    handler: async (): Promise<CommandResult> => {
      const { status, updateStatus } = useUIStore.getState();
      const dust = status?.dustIndex ?? 0;

      // Only accessible at Dust 85+ (Total Consensus Failure) [6]
      if (dust < 85) {
        return {
          output: `BUNKER_7: SOLSTICE BACKUP REJECTED.\\n------------------------------------------------\\nCURRENT DUST LEVEL: ${dust}/100.\\nCONSENSUS STATUS: STABLE.\\n------------------------------------------------\\nSolstice core backups are locked until total consensus memory failure is imminent. Continue your investigation.`,
          type: 'error',
        };
      }

      // Simulate a rich narrative tape backup sequence [6]
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
        '[RESET DE-ENERGIZATION ENGAGED]'
      ];

      // Perform state resets using standard Zustand .setState() for bulletproof compatibility [7]
      try {
        // Clear all persistent local caches
        resetWorkstationProgress();

        useUIStore.setState({
          booted: false,
          activeModule: 'atlas'
        });
        
        if (typeof updateStatus === 'function') {
          updateStatus({
            dustIndex: 0,
            observerStability: 100,
            sessionWorkDone: 0
          });
        } else {
          useUIStore.setState({
            status: {
              ...status,
              dustIndex: 0,
              observerStability: 100,
              sessionWorkDone: 0,
              atlasCoverage: 1240,
              activeAlerts: 0,
              investigatedSlugs: []
            }
          });
        }

        useSessionStore.setState({
          ritualComplete: false,
          sessionCount: (useSessionStore.getState().sessionCount || 0) + 1
        });

        useBootStore.setState({
          isComplete: false
        });
        
        if (typeof window !== 'undefined') {
          localStorage.setItem("vp-ending", "backup");
        }
      } catch (e) {
        console.warn('Solstice state transition encountered an active reset deviation:', e);
      }

      return {
        output: lines.join('\\n'),
        type: 'success',
      };
    }
  });

  registry.register({
    name: 'shutdown',
    description: 'De-energize the cathode screen, release all tape spools, and power down the workstation into silence',
    usage: 'shutdown',
    handler: async (): Promise<CommandResult> => {
      const { status } = useUIStore.getState();
      const dust = status?.dustIndex ?? 0;

      // Only accessible at Dust 85+ (Total Consensus Failure) [6]
      if (dust < 85) {
        return {
          output: `BUNKER_7: TERMINAL SHUTDOWN LOCKED.\\n------------------------------------------------\\nCURRENT DUST LEVEL: ${dust}/100.\\n------------------------------------------------\\nThe records are active. There are still voices in the lines that have not been anchored. Do not leave me alone with them yet.`,
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
        'POWERING OFF.'
      ];

      // Perform shutdown resets and mute audio systems [7]
      try {
        // Clear all persistent local caches on absolute shutdown reset
        resetWorkstationProgress();

        const audioStore = useAudioStore.getState();
        if (audioStore && typeof audioStore.toggleMute === 'function') {
          audioStore.toggleMute();
        }

        useUIStore.setState({
          booted: false
        });
        
        useBootStore.setState({
          isComplete: false
        });
        
        if (typeof window !== 'undefined') {
          localStorage.setItem("vp-ending", "shutdown");
        }

        useSessionStore.setState({
          ritualComplete: false
        });
      } catch (e) {
        console.warn('Solstice power-off sequence encountered a soft deviation:', e);
      }

      return {
        output: lines.join('\\n'),
        type: 'info',
      };
    }
  });
}
