import { CommandRegistry, CommandResult } from '../commandRegistry';
import { useAtlasStore } from '@/state/atlasStore';
import { useUIStore } from '@/state/uiStore';
import { useAudioStore } from '@/state/audioStore';

export function registerProbeCommands(registry: CommandRegistry) {
  registry.register({
    name: 'probe',
    description: 'Manually resolve geodetic coordinate drift and anchor shifting Atlas map pins',
    usage: 'probe --lat <latitude> --lng <longitude>',
    aliases: ['vector', 'lock-on'],
    handler: async (args: string[]): Promise<CommandResult> => {
      const latIndex = args.indexOf('--lat');
      const lngIndex = args.indexOf('--lng');

      if (latIndex === -1 || lngIndex === -1 || latIndex + 1 >= args.length || lngIndex + 1 >= args.length) {
        return {
          output: 'COORDINATE RESOLUTION FAILED.\nUsage: probe --lat <latitude> --lng <longitude>\nExample: probe --lat 38.9710 --lng -95.4560',
          type: 'error',
        };
      }

      const lat = parseFloat(args[latIndex + 1]);
      const lng = parseFloat(args[lngIndex + 1]);

      if (isNaN(lat) || Number.isNaN(lng)) {
        return {
          output: 'VECTOR ERROR: Invalid float representation. Ensure decimals are strictly numeric.',
          type: 'error',
        };
      }

      const { places, selectedPlaceSlug, setPlaces } = useAtlasStore.getState();
      const { status, updateStatus } = useUIStore.getState();
      const { play } = useAudioStore.getState();

      if (!selectedPlaceSlug) {
        return {
          output: 'PROBE REJECTED: No active Case Dossier selected. You must load a shifting coordinate pylon on your Atlas before emitting a geodetic probe.',
          type: 'error',
        };
      }

      const activePlace = places.find((p) => p.slug === selectedPlaceSlug);
      if (!activePlace) {
        return {
          output: 'PROBE ERROR: Selected Case Dossier is missing from active memory banks.',
          type: 'error',
        };
      }

      if (activePlace.status === 'verified') {
        return {
          output: `PROBE REDUNDANT: Coordinates for ${activePlace.name} are already verified and locked to the geodetic grid. No drift detected.`,
          type: 'warning',
        };
      }

      // Calculate geodetic coordinate delta (drift)
      const targetLng = activePlace.coordinates[0];
      const targetLat = activePlace.coordinates[1];

      const deltaLat = Math.abs(lat - targetLat);
      const deltaLng = Math.abs(lng - targetLng);
      const drift = Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng);

      // Proximity threshold of ~0.005 degrees (roughly 500 meters)
      if (drift < 0.006) {
        // Success! Consensus reality secured
        const updatedPlaces = places.map((p) => {
          if (p.slug === activePlace.slug) {
            return { ...p, status: 'verified' as const };
          }
          return p;
        });

        setPlaces(updatedPlaces);

        // SECURE SOUND CASCADE
        play('alert');

        // Award +5 Stability and decrease Dust by -5 as aligning coordinates grounds reality
        updateStatus({
          observerStability: Math.min(100, status.observerStability + 5),
          dustIndex: Math.max(0, status.dustIndex - 5),
        });

        return {
          output: `COORDINATE LOCK SECURED.\n------------------------------------------------\nTARGET: ${activePlace.name.toUpperCase()}\nANCHOR: [${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E]\nSTATUS: GEODETIC DRIFT ELIMINATED.\n------------------------------------------------\nConsensus reality anchored. Your visual Atlas has locked the pin. The humming inside your terminal has normalized.`,
          type: 'success',
        };
      } else {
        // Failure: Output coordinate drift delta
        return {
          output: `COORDINATE REJECTED.\n------------------------------------------------\nVECTOR ERROR: ${drift.toFixed(4)}° DRIFT REMAINS.\n------------------------------------------------\nCheck your declassified documents, field journals, and local metadata for exact geodetic reference nodes.`,
          type: 'error',
        };
      }
    },
  });
}
