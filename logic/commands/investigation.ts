import { CommandRegistry } from '../commandRegistry';
import { useUIStore } from '@/state/uiStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useAtlasStore } from '@/state/atlasStore';

export function registerInvestigationCommands(registry: CommandRegistry) {
  registry.register({
    name: 'scan',
    description: 'Scan local sector for anomalies',
    usage: 'scan',
    handler: () => ({
      output: 'Scanning local sector...\nNo anomalies detected within 50km radius.\nDust accumulation: nominal.',
      type: 'success' as const,
    }),
  });

  registry.register({
    name: 'dust',
    description: 'Display dust index and accumulation rate',
    usage: 'dust',
    handler: () => {
      const { status } = useUIStore.getState();
      return {
        output: `Dust Index: ${status.dustIndex} units\nAccumulation rate: 0.3/hr\nTolerance: normal\nWarning threshold: 50`,
        type: 'info' as const,
      };
    },
  });

  registry.register({
    name: 'atlas',
    description: 'Display atlas coverage and anomalies',
    usage: 'atlas',
    handler: () => {
      const { status } = useUIStore.getState();
      return {
        output: `Atlas coverage: ${status.atlasCoverage} km²\nActive regions: 12\nUnstable sectors: 3\nCoordinate drift: DETECTED`,
        type: 'warning' as const,
      };
    },
  });

  registry.register({
    name: 'sync',
    description: 'Synchronize evidence with remote repository',
    usage: 'sync',
    handler: () => ({
      output: 'Synchronizing evidence...\nRemote repository: connected\nLocal cache: updated\n3 new documents queued for review.',
      type: 'success' as const,
    }),
  });

  registry.register({
    name: 'investigate',
    description: 'Open investigation for a location',
    usage: 'investigate <place-slug>',
    handler: (args: string[]) => {
      const slug = args[0];
      if (!slug) return { output: 'Usage: investigate <place-slug>', type: 'error' as const };

      const { places } = useAtlasStore.getState();
      const place = places.find((p) => p.slug === slug);
      if (!place) return { output: `No place found with slug: ${slug}`, type: 'error' as const };

      useUIStore.getState().setActiveModule('investigations');
      useInvestigationStore.getState().openInvestigation(slug, place.name);
      return { output: `Investigation opened: ${place.name}\nEvidence items: ${place.hauntingReports.length + 2}\nStatus: ${place.status}`, type: 'success' as const };
    },
  });

  registry.register({
    name: 'cases',
    description: 'List active investigations',
    usage: 'cases',
    handler: () => {
      const { activeInvestigationId } = useInvestigationStore.getState();
      return {
        output: activeInvestigationId
          ? `Active investigation: ${activeInvestigationId}\nUse 'close-case' to exit.`
          : 'No active investigation.\nUse "investigate <slug>" to open a case.',
        type: 'info' as const,
      };
    },
  });

  registry.register({
    name: 'close-case',
    description: 'Close active investigation',
    usage: 'close-case',
    handler: () => {
      useInvestigationStore.getState().closeInvestigation();
      useUIStore.getState().setActiveModule(null);
      return { output: 'Investigation closed. Returning to archive.', type: 'system' as const };
    },
  });

  registry.register({
    name: 'note',
    description: 'Add a note to the active investigation',
    usage: 'note <text>',
    handler: (args: string[]) => {
      const text = args.join(' ');
      const { activeInvestigationId, setNotes, notes } = useInvestigationStore.getState();
      if (!activeInvestigationId) return { output: 'No active investigation. Open one first.', type: 'error' as const };
      if (!text) return { output: 'Usage: note <text>', type: 'error' as const };

      const current = notes[activeInvestigationId] || '';
      setNotes(activeInvestigationId, current + '\n' + text);
      return { output: 'Note appended to case file.', type: 'success' as const };
    },
  });
}