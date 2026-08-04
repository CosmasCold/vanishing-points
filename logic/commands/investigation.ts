import { CommandRegistry } from '../commandRegistry';
import { useUIStore } from '@/state/uiStore';

export function registerInvestigationCommands(registry: CommandRegistry) {
  registry.register({
    name: 'scan',
    description: 'Scan local sector for anomalies',
    usage: 'scan',
    handler: () => {
      return { 
        output: 'Scanning local sector...\nNo anomalies detected within 50km radius.\nDust accumulation: nominal.', 
        type: 'success' 
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
        type: 'info' 
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
        type: 'warning' 
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
        type: 'success' 
      };
    },
  });
}