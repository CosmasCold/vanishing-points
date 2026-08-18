import { CommandRegistry, CommandResult } from '../commandRegistry';
import { useAtlasStore } from '@/state/atlasStore';
import { useAudioStore } from '@/state/audioStore';
import { useProgressionStore } from '@/state/progressionStore';

export function registerProbeCommands(registry: CommandRegistry) {
  registry.register({
    name: 'probe',
    description:
      'Manually resolve geodetic coordinate drift and anchor shifting Atlas map pins',
    usage: 'probe --lat <latitude> --lng <longitude>',
    aliases: ['vector', 'lock-on'],
    handler: async (args: string[]): Promise<CommandResult> => {
      const latIndex = args.indexOf('--lat');
      const lngIndex = args.indexOf('--lng');

      if (
        latIndex === -1 ||
        lngIndex === -1 ||
        latIndex + 1 >= args.length ||
        lngIndex + 1 >= args.length
      ) {
        return {
          output:
            'COORDINATE RESOLUTION FAILED.\nUsage: probe --lat <latitude> --lng <longitude>\nExample: probe --lat 38.9710 --lng -95.4560',
          type: 'error',
        };
      }

      const lat = parseFloat(
        args[latIndex + 1]
      );

      const lng = parseFloat(
        args[lngIndex + 1]
      );

      if (
        Number.isNaN(lat) ||
        Number.isNaN(lng)
      ) {
        return {
          output:
            'VECTOR ERROR: Invalid float representation. Ensure decimals are strictly numeric.',
          type: 'error',
        };
      }

      const {
        places,
        selectedPlaceSlug,
        setPlaces,
      } = useAtlasStore.getState();

      const { play } =
        useAudioStore.getState();

      const progression =
        useProgressionStore.getState();

      if (!selectedPlaceSlug) {
        return {
          output:
            'PROBE REJECTED: No active Case Dossier selected. You must load a shifting coordinate pylon on your Atlas before emitting a geodetic probe.',
          type: 'error',
        };
      }

      const activePlace = places.find(
        (p) => p.slug === selectedPlaceSlug
      );

      if (!activePlace) {
        return {
          output:
            'PROBE ERROR: Selected Case Dossier is missing from active memory banks.',
          type: 'error',
        };
      }

      if (activePlace.status === 'verified') {
        return {
          output:
            `PROBE REDUNDANT: Coordinates for ${activePlace.name} are already verified and locked to the geodetic grid. No drift detected.`,
          type: 'warning',
        };
      }

      const targetLng =
        activePlace.coordinates[0];

      const targetLat =
        activePlace.coordinates[1];

      const deltaLat =
        Math.abs(lat - targetLat);

      const deltaLng =
        Math.abs(lng - targetLng);

      const drift =
        Math.sqrt(
          deltaLat * deltaLat +
          deltaLng * deltaLng
        );

      /*
       * Successful coordinate resolution.
       *
       * IMPORTANT:
       * The Dust cost must be successfully paid BEFORE
       * the Atlas location is committed as verified.
       *
       * This prevents a failed Dust transaction from
       * leaving the Atlas in a partially completed state.
       */
      if (drift < 0.006) {
        const spent =
          progression.spendDust(5);

        if (!spent) {
          return {
            output:
              `COORDINATE LOCK REJECTED: INSUFFICIENT DUST INDEX.\n` +
              `------------------------------------------------\n` +
              `ACTIVE DUST: [${progression.dustIndex} / 100]\n` +
              `REQUIRED DUST: 5\n` +
              `------------------------------------------------\n` +
              `The coordinate cannot be stabilized without sufficient grounding reserve.`,
            type: 'warning',
          };
        }

        // Cost successfully paid. Now commit the Atlas mutation.
        const updatedPlaces =
          places.map((p) => {
            if (p.slug === activePlace.slug) {
              return {
                ...p,
                status: 'verified' as const,
              };
            }

            return p;
          });

        setPlaces(updatedPlaces);

        // Coordinate alignment restores a small amount of stability.
        progression.changeStability(5);

        play('alert');

        const updatedProgression =
          useProgressionStore.getState();

        return {
          output:
            `COORDINATE LOCK SECURED.\n` +
            `------------------------------------------------\n` +
            `TARGET: ${activePlace.name.toUpperCase()}\n` +
            `ANCHOR: [${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E]\n` +
            `STATUS: GEODETIC DRIFT ELIMINATED.\n` +
            `------------------------------------------------\n` +
            `Dust Index: ${updatedProgression.dustIndex}\n` +
            `Stability: ${updatedProgression.observerStability.toFixed(1)}%\n` +
            `------------------------------------------------\n` +
            `Consensus reality anchored. Your visual Atlas has locked the pin. The humming inside your terminal has normalized.`,
          type: 'success',
        };
      }

      return {
        output:
          `COORDINATE REJECTED.\n` +
          `------------------------------------------------\n` +
          `VECTOR ERROR: ${drift.toFixed(4)}° DRIFT REMAINS.\n` +
          `------------------------------------------------\n` +
          `Check your declassified documents, field journals, and local metadata for exact geodetic reference nodes.`,
        type: 'error',
      };
    },
  });
}