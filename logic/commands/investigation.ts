import { CommandRegistry } from '../commandRegistry';
import { useUIStore } from '@/state/uiStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useAtlasStore } from '@/state/atlasStore';

export function registerInvestigationCommands(registry: CommandRegistry) {
	registry.register({
		name: 'scan',
		description: 'Scan local sector for anomalies',
		usage: 'scan',
		handler: () => {
			return {
				output: 'Scanning local sector...\nNo anomalies detected within 50km radius.\nDust accumulation: nominal.',
				type: 'success' as const,
			};
		},
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
		handler: () => {
			return {
				output: 'Synchronizing evidence...\nRemote repository: connected\nLocal cache: updated\n3 new documents queued for review.',
				type: 'success' as const,
			};
		},
	});

	registry.register({
		name: 'investigate',
		description: 'Open investigation for a location',
		usage: 'investigate <place-name>',
		handler: (args: string[]) => {
			const query = args.join(' ').toLowerCase();
			if (!query) {
				return { output: 'Usage: investigate <place-name>', type: 'error' as const };
			}

			const { places } = useAtlasStore.getState();
			const place = places.find(
				(p) => p.name.toLowerCase().includes(query) || p.slug.includes(query)
			);

			if (!place) {
				return { output: `No location found matching "${query}"`, type: 'error' as const };
			}

			useInvestigationStore.getState().openInvestigation(place.slug, place.name);
			useUIStore.getState().setActiveModule(null);
			return {
				output: `Investigation opened: ${place.name}\nStatus: ${place.status}\nDanger: ${place.dangerLevel}/5`,
				type: 'success' as const,
			};
		},
	});

	registry.register({
		name: 'close-case',
		description: 'Close active investigation',
		usage: 'close-case',
		aliases: ['closecase'],
		handler: () => {
			const { activeInvestigationId } = useInvestigationStore.getState();
			if (!activeInvestigationId) {
				return { output: 'No active investigation.', type: 'warning' as const };
			}
			useInvestigationStore.getState().closeInvestigation();
			return { output: 'Investigation closed.', type: 'success' as const };
		},
	});

	registry.register({
		name: 'cases',
		description: 'Show active investigation status',
		usage: 'cases',
		handler: () => {
			const { activeInvestigationId } = useInvestigationStore.getState();
			const { places } = useAtlasStore.getState();

			if (!activeInvestigationId) {
				return { output: 'No active investigations.', type: 'info' as const };
			}

			const place = places.find((p) => p.slug === activeInvestigationId);
			const evidence = useInvestigationStore.getState().evidence[activeInvestigationId] || [];
			const timeline = useInvestigationStore.getState().timelines[activeInvestigationId] || [];

			return {
				output: `Active Case: ${place?.name || activeInvestigationId}\nEvidence collected: ${evidence.length}\nTimeline events: ${timeline.length}\nType 'close-case' to exit.`,
				type: 'info' as const,
			};
		},
	});
}