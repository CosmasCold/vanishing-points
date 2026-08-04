import { CommandRegistry } from '../commandRegistry';
import { useUIStore } from '@/state/uiStore';
import { ModuleId } from '@/types';

const MODULES: ModuleId[] = [
  'inbox', 'atlas', 'investigations', 'evidence', 
  'signals', 'documents', 'research', 'inventory', 
  'discoveries', 'system'
];

export function registerNavigationCommands(registry: CommandRegistry) {
  registry.register({
    name: 'open',
    description: 'Open a module panel',
    usage: 'open <module>',
    handler: (args: string[]) => {
      const target = args[0]?.toLowerCase();
      if (!target) {
        return { output: 'Usage: open <module>\nAvailable: ' + MODULES.join(', '), type: 'error' };
      }
      if (!MODULES.includes(target as ModuleId)) {
        return { output: `Unknown module: "${target}". Available: ${MODULES.join(', ')}`, type: 'error' };
      }
      useUIStore.getState().setActiveModule(target as ModuleId);
      return { output: `Opening ${target}...`, type: 'success' };
    },
  });

  registry.register({
    name: 'close',
    description: 'Close active module panel',
    usage: 'close',
    handler: () => {
      useUIStore.getState().setActiveModule(null);
      return { output: 'Module closed.', type: 'success' };
    },
  });

  registry.register({
    name: 'modules',
    description: 'List available modules',
    usage: 'modules',
    handler: () => {
      const { activeModule } = useUIStore.getState();
      const lines = MODULES.map((m: string) => {
        const indicator = m === activeModule ? ' > ' : '   ';
        return `${indicator}${m}`;
      });
      return { output: 'Available modules:\n' + lines.join('\n'), type: 'info' };
    },
  });
}