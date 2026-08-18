import { CommandRegistry } from '../commandRegistry';
import { useUIStore } from '@/state/uiStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useSessionStore } from '@/state/sessionStore';
import { useProgressionStore } from '@/state/progressionStore';

/**
 * Standard Station Core Commands Registration Module
 *
 * Registers terminal utilities and observer telemetry:
 *
 * /help
 * /guide
 * /status
 * /stability
 * /whoami
 * /clear
 * /date
 * /time-sync
 *
 * IMPORTANT:
 * Dust Index and Observer Stability are canonical progression state.
 * They must be read from progressionStore.ts, not uiStore.status.
 */
export function registerSystemCommands(
  registry: CommandRegistry
) {
  // -------------------------------------------------------------------------
  // /guide
  // -------------------------------------------------------------------------

  registry.register({
    name: 'guide',
    description:
      'Load declassified Operator Field Briefing Form-7B',
    usage: 'guide',
    aliases: ['tutorial', 'help-start'],
    handler: () => {
      useUIStore.getState().setGuideOpen(true);

      return {
        output:
          'BUNKER_7: Operator Field Briefing energized. Close the overlay to return to the CLI.',
        type: 'info' as const,
      };
    },
  });

  // -------------------------------------------------------------------------
  // /help
  // -------------------------------------------------------------------------

  registry.register({
    name: 'help',
    description:
      'Retrieve declassified Carrel 7-B operations manual and registry commands',
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
        '  /stability           - Retrieve current Observer Stability telemetry.',
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
        '====================================================================',
      ];

      return {
        output: manual.join('\n'),
        type: 'system' as const,
      };
    },
  });

  // -------------------------------------------------------------------------
  // /status
  //
  // Read-only terminal telemetry.
  // Canonical Dust/Stability values come exclusively from progressionStore.
  // -------------------------------------------------------------------------

  registry.register({
    name: 'status',
    description:
      'Retrieve terminal telemetry and observe current archive state',
    usage: 'status',
    aliases: ['telemetry', 'state'],
    handler: () => {
      const progression =
        useProgressionStore.getState();

      const session =
        useSessionStore.getState();

      const investigation =
        useInvestigationStore.getState();

      const dust = progression.dustIndex;
      const stability =
        progression.observerStability;

      const evidenceCount =
        Object.values(investigation.evidence).reduce(
          (total, items) =>
            total + (items?.length ?? 0),
          0
        );

      const investigatedCount =
        progression.investigatedPlaceIds.length;

      const catalogue =
        dust >= 90
          ? 'EXTREME'
          : dust >= 70
            ? 'HIGH'
            : dust >= 40
              ? 'MODERATE'
              : dust >= 15
                ? 'LOW'
                : 'NOMINAL';

      const stabilityState =
        stability <= 20
          ? 'UNSTABLE'
          : stability <= 45
            ? 'CRITICAL'
            : stability <= 70
              ? 'DEGRADED'
              : stability <= 90
                ? 'STABLE'
                : 'NOMINAL';

      const output = [
        '====================================================================',
        '                 BUNKER_7 // TERMINAL TELEMETRY',
        '====================================================================',
        '',
        `  DUST INDEX:             ${dust}/100`,
        `  EXPOSURE CLASS:         ${catalogue}`,
        '',
        `  OBSERVER STABILITY:     ${stability.toFixed(1)}%`,
        `  COHERENCE STATE:        ${stabilityState}`,
        '',
        `  ATLAS COVERAGE:         ${progression.atlasCoverage.toFixed(1)} km²`,
        `  INVESTIGATED LOCATIONS: ${investigatedCount}`,
        `  EVIDENCE RECOVERED:     ${evidenceCount}`,
        `  SESSION WORK:           ${progression.sessionWorkDone}`,
        `  ACTIVE SESSION:          ${session.sessionCount || 1}`,
        '',
        '--------------------------------------------------------------------',
        '',
        stability <= 20
          ? 'WARNING: OBSERVER COHERENCE CRITICAL.'
          : dust >= 70
            ? 'WARNING: PARTICULATE EXPOSURE HIGH.'
            : 'CONSENSUS CHANNEL: WITHIN OPERATIONAL PARAMETERS.',
        '',
        '====================================================================',
      ].join('\n');

      return {
        output,
        type: 'system' as const,
      };
    },
  });

  // -------------------------------------------------------------------------
  // /stability
  //
  // Read-only stability telemetry.
  // This deliberately does NOT modify progression.
  // -------------------------------------------------------------------------

  registry.register({
    name: 'stability',
    description:
      'Retrieve current Observer Stability telemetry',
    usage: 'stability',
    aliases: ['coherence'],
    handler: () => {
      const progression =
        useProgressionStore.getState();

      const stability =
        progression.observerStability;

      const dust =
        progression.dustIndex;

      const state =
        stability <= 20
          ? 'UNSTABLE'
          : stability <= 45
            ? 'CRITICAL'
            : stability <= 70
              ? 'DEGRADED'
              : stability <= 90
                ? 'STABLE'
                : 'NOMINAL';

      const warning =
        stability <= 20
          ? 'COGNITIVE COHERENCE FAILURE IMMINENT.'
          : stability <= 45
            ? 'COGNITIVE DRIFT DETECTED. GROUNDING RECOMMENDED.'
            : stability <= 70
              ? 'MINOR OBSERVER DRIFT DETECTED.'
              : 'OBSERVER COHERENCE WITHIN ACCEPTABLE PARAMETERS.';

      const output = [
        '====================================================================',
        '                 BUNKER_7 // OBSERVER STABILITY',
        '====================================================================',
        '',
        `  OBSERVER STABILITY:     ${stability.toFixed(1)}%`,
        `  COHERENCE STATE:        ${state}`,
        `  CURRENT DUST INDEX:     ${dust}/100`,
        '',
        '--------------------------------------------------------------------',
        '',
        `  ${warning}`,
        '',
        '====================================================================',
      ].join('\n');

      return {
        output,
        type:
          stability <= 45
            ? ('warning' as const)
            : ('info' as const),
      };
    },
  });

  // -------------------------------------------------------------------------
  // /clear
  // -------------------------------------------------------------------------

  registry.register({
    name: 'clear',
    description:
      'Clear terminal screen history buffer',
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

  // -------------------------------------------------------------------------
  // /whoami
  // -------------------------------------------------------------------------

  registry.register({
    name: 'whoami',
    description:
      'Retrieve active operator biometric and security clearance details',
    usage: 'whoami',
    handler: () => {
      const sessionState =
        useSessionStore.getState();

      const progressionState =
        useProgressionStore.getState();

      const invState =
        useInvestigationStore.getState();

      const unreadAlerts =
        sessionState.inboxItems.filter(
          (i) => !i.read
        ).length;

      const openCases =
        Object.keys(invState.evidence).filter(
          (k) =>
            invState.evidence[k]?.length > 0
        ).length;

      const dossier = [
        '====================================================================',
        '         FEMA PERSONNEL PROFILE REPORT // FILE_REF: INV_RED-7',
        '====================================================================',
        '  OPERATOR SIGNATURE:  INV_RED-7 (UNVERIFIED)',
        '  ASSIGNED SECTOR:     BUNKER_7 // CARREL 7-B',
        '  INTEGRITY LEVEL:     DECLASSIFIED GROUND STATIONS',
        `  SESSION SEQUENCE:    ${sessionState.sessionCount || 1} ACTIVE INTAKE CYCLE(S)`,
        `  MAPPED EXPOSURE:     ${progressionState.dustIndex}% PARTICULATE DUST`,
        `  NEURAL STABILITY:    ${progressionState.observerStability}% CAUSALITY COHERENCE`,
        `  GEODETIC COVERAGE:   ${progressionState.atlasCoverage.toFixed(1)} km² RECORDED`,
        '--------------------------------------------------------------------',
        '  ACTIVE CHASSIS DIAGNOSTICS:',
        `  - PENDING ALERT INTROJECTIONS:   ${unreadAlerts} INTERCEPT(S)`,
        `  - OPENED GEODETIC DOSSIERS:      ${openCases} RUIN(S) PINNED`,
        `  - RITUAL SEQUENCE COMPLETED:     ${sessionState.ritualComplete ? 'YES' : 'NO (BEGIN REQ.)'}`,
        '====================================================================',
      ];

      return {
        output: dossier.join('\n'),
        type: 'info' as const,
      };
    },
  });

  // -------------------------------------------------------------------------
  // /date
  // -------------------------------------------------------------------------

  registry.register({
    name: 'date',
    description:
      'Retrieve synchronized atomic clock telemetry',
    usage: 'date',
    handler: () => {
      const now = new Date();

      return {
        output:
          `BUNKER_7: Synchronized clock telemetry: ${now.toISOString()} [TEMPORAL RES_WAVE NOMINAL]`,
        type: 'info' as const,
      };
    },
  });

  // -------------------------------------------------------------------------
  // /time-sync
  // -------------------------------------------------------------------------

  registry.register({
    name: 'time-sync',
    description:
      'Sync or mock the terminal system clock to bypass temporal lockouts',
    usage: 'time-sync [HH:MM]',
    aliases: ['sync-time', 'mock-time'],
    handler: (args: string[]) => {
      if (typeof window === 'undefined') {
        return {
          output:
            'Time-sync is only available in the client terminal environment.',
          type: 'error' as const,
        };
      }

      const time = args[0];

      if (!time) {
        delete (window as any).__mockTime;

        return {
          output:
            'BUNKER_7: Time synchronization aligned with real-time atomic clock.',
          type: 'success' as const,
        };
      }

      if (!/^\d{2}:\d{2}$/.test(time)) {
        return {
          output:
            'Usage: /time-sync [HH:MM] (e.g., /time-sync 03:14)',
          type: 'error' as const,
        };
      }

      (window as any).__mockTime = time;

      /*
       * Inject global Date class override on-demand to prevent
       * hydration mismatches.
       */
      if (!(window as any).__dateOverridden) {
        const OriginalDate = window.Date;

        const CustomDate = function (
          ...args: any[]
        ) {
          if (
            args.length === 0 &&
            (window as any).__mockTime
          ) {
            const d = new OriginalDate();

            const [h, m] =
              (window as any).__mockTime
                .split(':')
                .map(Number);

            d.setHours(h);
            d.setMinutes(m);
            d.setSeconds(0);

            return d;
          }

          return new (OriginalDate as any)(...args);
        };

        CustomDate.prototype =
          OriginalDate.prototype;

        CustomDate.now = function () {
          if ((window as any).__mockTime) {
            const d = new OriginalDate();

            const [h, m] =
              (window as any).__mockTime
                .split(':')
                .map(Number);

            d.setHours(h);
            d.setMinutes(m);
            d.setSeconds(0);

            return d.getTime();
          }

          return OriginalDate.now();
        };

        Object.getOwnPropertyNames(
          OriginalDate
        ).forEach((key) => {
          if (!(key in CustomDate)) {
            try {
              (CustomDate as any)[key] =
                (OriginalDate as any)[key];
            } catch (e) {
              // Ignore non-writable Date properties.
            }
          }
        });

        window.Date =
          CustomDate as any;

        (window as any).__dateOverridden =
          true;
      }

      return {
        output:
          'BUNKER_7: Terminal clock spoofed to [' +
          time +
          ']. Geodetic temporal gates aligned.',
        type: 'success' as const,
      };
    },
  });
}