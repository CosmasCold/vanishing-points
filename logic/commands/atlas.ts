import { CommandRegistry } from '../commandRegistry';
import { useAtlasStore } from '@/state/atlasStore';
import { useUIStore } from '@/state/uiStore';
import { fetchPlaces } from '@/data/places';

export function registerAtlasCommands(registry: CommandRegistry) {
  registry.register({
    name: 'atlas',
    description: 'Open Atlas or show current viewport',
    usage: 'atlas',
    handler: () => {
      useUIStore.getState().setActiveModule('atlas');
      const { places } = useAtlasStore.getState();
      return {
        output: `Atlas initialized.\nArchive entries: ${places.length}`,
        type: 'success' as const,
      };
    },
  });

  registry.register({
    name: 'locate',
    description: 'Locate a place by name',
    usage: 'locate <place-name>',
    handler: (args: string[]) => {
      const query = args.join(' ').toLowerCase();
      if (!query) return { output: 'Usage: locate <place-name>', type: 'error' as const };

      const { places } = useAtlasStore.getState();
      const place = places.find(
        (p) => p.name.toLowerCase().includes(query) || p.slug.includes(query)
      );

      if (!place) return { output: `No location found matching "${query}"`, type: 'error' as const };

      useUIStore.getState().setActiveModule('atlas');
      useAtlasStore.getState().selectPlace(place.slug);
      return {
        output: `Located: ${place.name}\n${place.address.formatted}\nCoordinates: ${place.coordinates[1].toFixed(4)}°N, ${place.coordinates[0].toFixed(4)}°E`,
        type: 'success' as const,
      };
    },
  });

  registry.register({
    name: 'reload',
    description: 'Reload atlas data from archive',
    usage: 'reload',
    handler: async () => {
      useAtlasStore.getState().setLoading(true);
      const data = await fetchPlaces();
      useAtlasStore.getState().setPlaces(data);
      useAtlasStore.getState().setLoading(false);
      return { output: `Archive reloaded. ${data.length} entries available.`, type: 'success' as const };
    },
  });
}