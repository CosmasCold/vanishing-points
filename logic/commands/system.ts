import { CommandRegistry, CommandDefinition } from '../commandRegistry';
import { useUIStore } from '@/state/uiStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useSessionStore } from '@/state/sessionStore';

/**
 * Standard Station Core Commands Registration Module
 * Registers declassified terminal utilities (/help, /guide, /whoami, /clear, /date) [11, 246, 255].
 * Employs immersive Cold-War military-grade descriptors to bypass gamified language.
 */
export function registerSystemCommands(registry: CommandRegistry) {
  
  // 1. /guide command: triggers the operator guide modal
  registry.register({
    name: 'guide',
    description: 'Load declassified Operator Field Briefing Form-7B',
    usage: 'guide',
    aliases: ['tutorial', 'help-start'],
    handler: () => {
      useUIStore.getState().setGuideOpen(true);
      return {
        output: 'BUNKER_7: Operator Field Briefing energized. Close the overlay to return to the CLI.',
        type: 'info' as const,
      };
    },
  });

  // 2. /help command: redone to look like a declassified Operations manual
  registry.register({
    name: 'help',
    description: 'Retrieve declassified Carrel 7-B operations manual and registry commands',
    usage: 'help',
    aliases: ['?', 'commands'],
    handler: () => {
      const manual = [
        '====================================================================',
        '  DEPARTMENT OF DEFENSE // FEMA ARCHIVAL DIVISION -- FIELD OPERATIONS',
        '  CLASSIFICATION: RESTRICTED // OBSERVER CAUTION EXTREMELY RECOMMENDED',
        '  SUBJECT: CARREL 7-B ARCHIVAL TERMINAL PROTOCOLS (MDL-11A)',
        '====================================================================',
        '',
        'You are monitoring the Vanishing Points Archive. Your workstation is',
        'an active link to geodetic coordinate pylons and signal intercepts.',
        'Your objective is to observe, connect, and verify.',
        '',
        'THE DIRECTORY COMMANDS:',
        '  /open <module>       - Energize individual panel loops on the rail.',
        '                        Modules: inbox, atlas, investigations, evidence,',
        '                                 signals, documents, research, inventory,',
        '                                 discoveries, system',
        '  /status              - Retrieve terminal telemetry and observe current state.',
        '  /whoami              - Retrieve personnel verification records.',
        '',
        'THE ALIGNMENT COMMANDS:',
        '  /ground              - Discharge electrostatic buildup into the copper drains.',
        '                        (Requires active session work to anchor focus)',
        '  /restore             - Recalibrate cognitive alignment to baseline safety.',
        '                        (Requires active session work to stabilize perception)',
        '',
        'THE INVESTIGATIVE COMMANDS:',
        '  /probe --lat <y> --lng <x>',
        '                       - Manually resolve geodetic coordinate drift and anchor shifting Atlas map pins.',
        '  /decrypt --key <val> [--file <id>]',
        '                       - Decrypt RESTRICTED documents or unlock geodetic sectors.',
        '  /audit --file <id>   - Reconstruct heavily redacted files inside the Consensus Window.',
        '  /forget --case <slug>- Purge a pylon from active memory (lowers Dust exposure).',
        '  /clear               - Clear screen buffer history.',
        '',
        '====================================================================',
        'A WARNING:',
        '  Your mind is an active observer in this loop. High exposure to residual',
        '  particulate (Dust) will collapse consensus causality. Do not investigate',
        '  alone after midnight. The Archive is not indifferent.',
        '===================================================================='
      ];

      return {
        output: manual.join('\n'),
        type: 'system' as const,
      };
    },
  });

  // 3. /clear command: wipes terminal history logs
  registry.register({
    name: 'clear',
    description: 'Clear terminal screen history buffer',
    usage: 'clear',
    aliases: ['cls'],
    handler: () => {
      return {
        clear: true,
        output: '',
        type: 'system' as const,
      };
    },
  });

  // 4. /whoami command: outputs active investigator dossier details
  registry.register({
    name: 'whoami',
    description: 'Retrieve active operator biometric and security clearance details',
    usage: 'whoami',
    handler: () => {
      const uiState = useUIStore.getState();
      const sessionState = useSessionStore.getState();
      const invState = useInvestigationStore.getState();
      
      const unreadAlerts = sessionState.inboxItems.filter((i) => !i.read).length;
      const openCases = Object.keys(invState.evidence).filter((k) => invState.evidence[k]?.length > 0).length;

      const dossier = [
        '====================================================================',
        '         FEMA PERSONNEL PROFILE REPORT // FILE_REF: INV_RED-7',
        '====================================================================',
        '  OPERATOR SIGNATURE:  INV_RED-7 (UNVERIFIED)',
        '  ASSIGNED SECTOR:     BUNKER_7 // CARREL 7-B',
        '  INTEGRITY LEVEL:     DECLASSIFIED GROUND STATIONS',
        `  SESSION SEQUENCE:    ${sessionState.sessionCount || 1} ACTIVE INTAKE CYCLE(S)`,
        `  MAPPED EXPOSURE:     ${uiState.status.dustIndex}% PARTICULATE DUST`,
        `  NEURAL STABILITY:    ${uiState.status.observerStability}% CAUSALITY COHERENCE`,
        `  GEODETIC COVERAGE:   ${uiState.status.atlasCoverage.toFixed(1)} km² RECORDED`,
        '--------------------------------------------------------------------',
        '  ACTIVE CHASSIS DIAGNOSTICS:',
        `  - PENDING ALERT INTROJECTIONS:   ${unreadAlerts} INTERCEPT(S)`,
        `  - OPENED GEODETIC DOSSIERS:      ${openCases} RUIN(S) PINNED`,
        `  - RITUAL SEQUENCE COMPLETED:     ${sessionState.ritualComplete ? 'YES' : 'NO (BEGIN REQ.)'}`,
        '===================================================================='
      ];

      return {
        output: dossier.join('\n'),
        type: 'info' as const,
      };
    },
  });

  // 5. /date command: outputs active calendar clock
  registry.register({
    name: 'date',
    description: 'Retrieve synchronized atomic clock telemetry',
    usage: 'date',
    handler: () => {
      const now = new Date();
      return {
        output: `BUNKER_7: Synchronized clock telemetry: ${now.toISOString()} [TEMPORAL RES_WAVE NOMINAL]`,
        type: 'info' as const,
      };
    },
  });
  // 6. /time-sync command: mock current system time dynamically for testing
  registry.register({
    name: 'time-sync',
    description: 'Sync or mock the terminal system clock to bypass temporal lockouts',
    usage: 'time-sync [HH:MM]',
    aliases: ['sync-time', 'mock-time'],
    handler: (args: string[]) => {
      if (typeof window === 'undefined') {
        return { output: 'Time-sync is only available in the client terminal environment.', type: 'error' as const };
      }
      const time = args[0];
      if (!time) {
        delete (window as any).__mockTime;
        return { output: 'BUNKER_7: Time synchronization aligned with real-time atomic clock.', type: 'success' as const };
      }
      if (!/^\d{2}:\d{2}$/.test(time)) {
        return { output: 'Usage: /time-sync [HH:MM] (e.g., /time-sync 03:14)', type: 'error' as const };
      }
      (window as any).__mockTime = time;
      
      // Inject global Date class override on-demand to prevent hydration mismatches
      if (!(window as any).__dateOverridden) {
        const OriginalDate = window.Date;
        const CustomDate = function(...args: any[]) {
          if (args.length === 0 && (window as any).__mockTime) {
            const d = new OriginalDate();
            const [h, m] = (window as any).__mockTime.split(':').map(Number);
            d.setHours(h);
            d.setMinutes(m);
            d.setSeconds(0);
            return d;
          }
          return new (OriginalDate as any)(...args);
        };
        CustomDate.prototype = OriginalDate.prototype;
        CustomDate.now = function() {
          if ((window as any).__mockTime) {
            const d = new OriginalDate();
            const [h, m] = (window as any).__mockTime.split(':').map(Number);
            d.setHours(h);
            d.setMinutes(m);
            d.setSeconds(0);
            return d.getTime();
          }
          return OriginalDate.now();
        };
        Object.getOwnPropertyNames(OriginalDate).forEach(key => {
          if (!(key in CustomDate)) {
            try { (CustomDate as any)[key] = (OriginalDate as any)[key]; } catch(e){}
          }
        });
        window.Date = CustomDate as any;
        (window as any).__dateOverridden = true;
      }
      
      return { output: 'BUNKER_7: Terminal clock spoofed to [' + time + ']. Geodetic temporal gates aligned.', type: 'success' as const };
    }
  });
}
