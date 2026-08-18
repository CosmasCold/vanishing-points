import { CommandRegistry } from '../commandRegistry';
import {
  useUIStore,
  BUNKER7_THRESHOLDS,
} from '@/state/uiStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useAtlasStore } from '@/state/atlasStore';
import { useAudioStore } from '@/state/audioStore';
import { useProgressionStore } from '@/state/progressionStore';

export function registerInvestigationCommands(
  registry: CommandRegistry
) {
  // ---------------------------------------------------------------------------
  // /scan
  // ---------------------------------------------------------------------------

  registry.register({
    name: 'scan',
    description: 'Scan local sector for anomalies',
    usage: 'scan',
    handler: () => {
      return {
        output:
          'Scanning local sector...\n' +
          'No anomalies detected within 50km radius.\n' +
          'Dust accumulation: nominal.',
        type: 'success' as const,
      };
    },
  });

  // ---------------------------------------------------------------------------
  // /dust
  // ---------------------------------------------------------------------------

  registry.register({
    name: 'dust',
    description: 'Display dust index and accumulation rate',
    usage: 'dust',
    handler: () => {
      const dust =
        useProgressionStore.getState().dustIndex;

      if (
        dust >=
        BUNKER7_THRESHOLDS.UNSTABLE
      ) {
        return {
          output: [
            'Dust Index: YOU',
            '',
            'The instrument measures what it expects to find.',
            'The particulate does not register on secondary sensors.',
            'What is being counted?',
          ].join('\n'),
          type: 'warning' as const,
        };
      }

      if (
        dust >=
        BUNKER7_THRESHOLDS.STABLE
      ) {
        return {
          output: [
            'Dust Index: UNCERTAIN',
            'Accumulation rate: [ERR: DIV/0]',
            'Tolerance: UNKNOWN',
            '',
            'Note: The instrument measures what it expects to find.',
            'The particulate does not register on secondary sensors.',
            'What is being counted?',
          ].join('\n'),
          type: 'warning' as const,
        };
      }

      return {
        output: [
          `Dust Index: ${dust} units`,
          'Accumulation rate: 0.3/hr',
          'Tolerance: normal',
          'Warning threshold: 50',
        ].join('\n'),
        type: 'info' as const,
      };
    },
  });

  // ---------------------------------------------------------------------------
  // /atlas-status
  // ---------------------------------------------------------------------------

  registry.register({
    name: 'atlas-status',
    description: 'Display atlas coverage and anomalies',
    usage: 'atlas-status',
    handler: () => {
      const atlasCoverage =
        useProgressionStore.getState().atlasCoverage;

      return {
        output:
          `Atlas coverage: ${atlasCoverage} km²\n` +
          'Active regions: 12\n' +
          'Unstable sectors: 3\n' +
          'Coordinate drift: DETECTED',
        type: 'warning' as const,
      };
    },
  });

  // ---------------------------------------------------------------------------
  // /sync
  // ---------------------------------------------------------------------------

  registry.register({
    name: 'sync',
    description: 'Synchronize evidence with remote repository',
    usage: 'sync',
    handler: () => {
      return {
        output:
          'Synchronizing evidence...\n' +
          'Remote repository: connected\n' +
          'Local cache: updated\n' +
          '3 new documents queued for review.',
        type: 'success' as const,
      };
    },
  });

  // ---------------------------------------------------------------------------
  // /investigate
  // ---------------------------------------------------------------------------

  registry.register({
    name: 'investigate',
    description: 'Open investigation for a location',
    usage: 'investigate <place-name>',
    handler: (args: string[]) => {
      const query =
        args.join(' ').toLowerCase();

      if (!query) {
        return {
          output:
            'Usage: investigate <place-name>',
          type: 'error' as const,
        };
      }

      const { places } =
        useAtlasStore.getState();

      const place = places.find(
        (p) =>
          p.name
            .toLowerCase()
            .includes(query) ||
          p.slug.includes(query)
      );

      if (!place) {
        return {
          output:
            `No location found matching "${query}"`,
          type: 'error' as const,
        };
      }

      /*
       * Investigation state is maintained by the investigation store.
       *
       * Canonical progression owns:
       * - investigation history
       * - Dust
       * - session work
       * - Atlas coverage
       */
      useInvestigationStore
        .getState()
        .openInvestigation(
          place.slug,
          place.name
        );

      useProgressionStore
        .getState()
        .addInvestigatedPlace(place.slug);

      /*
       * UI module selection is presentation state only.
       */
      useUIStore
        .getState()
        .setActiveModule(null);

      return {
        output:
          `Investigation opened: ${place.name}\n` +
          `Status: ${place.status}\n` +
          `Danger: ${place.dangerLevel}/5`,
        type: 'success' as const,
      };
    },
  });

  // ---------------------------------------------------------------------------
  // /close-case
  // ---------------------------------------------------------------------------

  registry.register({
    name: 'close-case',
    description: 'Close active investigation',
    usage: 'close-case',
    aliases: ['closecase'],
    handler: () => {
      const {
        activeInvestigationId,
      } = useInvestigationStore.getState();

      if (!activeInvestigationId) {
        return {
          output:
            'No active investigation.',
          type: 'warning' as const,
        };
      }

      useInvestigationStore
        .getState()
        .closeInvestigation();

      return {
        output:
          'Investigation closed.',
        type: 'success' as const,
      };
    },
  });

  // ---------------------------------------------------------------------------
  // /cases
  // ---------------------------------------------------------------------------

  registry.register({
    name: 'cases',
    description: 'Show active investigation status',
    usage: 'cases',
    handler: () => {
      const {
        activeInvestigationId,
      } = useInvestigationStore.getState();

      const { places } =
        useAtlasStore.getState();

      if (!activeInvestigationId) {
        return {
          output:
            'No active investigations.',
          type: 'info' as const,
        };
      }

      const place = places.find(
        (p) =>
          p.slug ===
          activeInvestigationId
      );

      const investigation =
        useInvestigationStore.getState();

      const evidence =
        investigation.evidence[
          activeInvestigationId
        ] || [];

      const timeline =
        investigation.timelines[
          activeInvestigationId
        ] || [];

      return {
        output:
          `Active Case: ${
            place?.name ||
            activeInvestigationId
          }\n` +
          `Evidence collected: ${evidence.length}\n` +
          `Timeline events: ${timeline.length}\n` +
          `Type 'close-case' to exit.`,
        type: 'info' as const,
      };
    },
  });

  // ---------------------------------------------------------------------------
  // /profile
  // ---------------------------------------------------------------------------

  registry.register({
    name: 'profile',
    description: 'Display archivist credentials',
    usage: 'profile',
    handler: () => {
      const id =
        useUIStore.getState().profile();

      return {
        output: [
          'ARCHIVIST CREDENTIALS',
          '─────────────────────',
          `DESIGNATION: ${id}`,
          'CLEARANCE: FIELD OBSERVER',
          'STATUS: ACTIVE',
          '',
          'Account integration: DISABLED',
          'Identity proxy: ENABLED',
        ].join('\n'),
        type: 'info' as const,
      };
    },
  });

  // ---------------------------------------------------------------------------
  // /ground
  // ---------------------------------------------------------------------------

  registry.register({
    name: 'ground',
    description:
      'Perform stabilization ritual to reduce Dust and restore Observer Stability',
    usage: 'ground',
    handler: () => {
      const progression =
        useProgressionStore.getState();

      const {
        playCalibrationDrone,
      } = useAudioStore.getState();

      /*
       * Already nominal.
       */
      if (
        progression.dustIndex <= 0 &&
        progression.observerStability >= 100
      ) {
        return {
          output:
            'Systems nominal. No grounding required.',
          type: 'info' as const,
        };
      }

      const preDust =
        progression.dustIndex;

      const preStability =
        progression.observerStability;

      /*
       * Grounding is an actual Dust-spending transaction.
       *
       * IMPORTANT:
       * spendDust() occurs before the Stability reward.
       * If the player cannot pay the 12 Dust cost,
       * nothing else is mutated.
       */
      const spent =
        progression.spendDust(12);

      if (!spent) {
        return {
          output:
            'BUNKER_7: Grounding request rejected. Insufficient Dust Index.',
          type: 'warning' as const,
        };
      }

      /*
       * Successful grounding restores observer stability.
       */
      progression.changeStability(5);

      playCalibrationDrone();

      const newProgression =
        useProgressionStore.getState();

      return {
        output: [
          'INITIATING STABILIZATION SEQUENCE...',
          '─────────────────────────────────',
          `Dust Index: ${preDust} → ${newProgression.dustIndex}`,
          `Stability: ${preStability.toFixed(1)}% → ${newProgression.observerStability.toFixed(1)}%`,
          '',
          'Calibration tone injected.',
          'Archive integrity: RESTORED',
        ].join('\n'),
        type: 'success' as const,
      };
    },
  });

  // ---------------------------------------------------------------------------
  // /catalogue
  // ---------------------------------------------------------------------------

  registry.register({
    name: 'catalogue',
    description:
      'Display full archive status and observer metrics',
    usage: 'catalogue',
    handler: () => {
      const dust =
        useProgressionStore
          .getState()
          .dustIndex;

      let report: string;

      if (dust >= 90) {
        report = 'EXTREME';
      } else if (dust >= 70) {
        report = 'HIGH';
      } else if (dust >= 40) {
        report = 'MODERATE';
      } else if (dust >= 15) {
        report = 'LOW';
      } else {
        report = 'NOMINAL';
      }

      return {
        output: report,
        type: 'info' as const,
      };
    },
  });
}