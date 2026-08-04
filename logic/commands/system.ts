import { CommandRegistry } from '../commandRegistry';
import { useUIStore } from '@/state/uiStore';
import { CommandDefinition } from '@/types';

export function registerSystemCommands(registry: CommandRegistry) {
  registry.register({
    name: 'help',
    description: 'Display available commands',
    usage: 'help',
    handler: () => {
      const cmds = registry.getCommands();
      const maxLen = Math.max(...cmds.map((c: CommandDefinition) => c.name.length));
      const lines = cmds.map((c: CommandDefinition) => {
        const name = c.name.padEnd(maxLen + 2);
        return `  ${name}${c.description}`;
      });
      return { 
        output: 'VANISHING POINTS ARCHIVE TERMINAL\nAvailable commands:\n' + lines.join('\n'), 
        type: 'info' 
      };
    },
  });

  registry.register({
    name: 'clear',
    description: 'Clear terminal scrollback',
    usage: 'clear',
    aliases: ['cls'],
    handler: () => ({ output: '__CLEAR__', type: 'info', clear: true }),
  });

  registry.register({
    name: 'echo',
    description: 'Repeat text to terminal',
    usage: 'echo <message>',
    handler: (args: string[]) => ({ output: args.join(' ') || '', type: 'info' }),
  });

  registry.register({
    name: 'status',
    description: 'Display system status',
    usage: 'status',
    handler: () => {
      const { status } = useUIStore.getState();
      const lines = [
        `System Integrity: ${status.systemIntegrity.toUpperCase()}`,
        `Dust Index:       ${status.dustIndex}`,
        `Atlas Coverage:   ${status.atlasCoverage} km²`,
        `Active Cases:     ${status.activeInvestigations}`,
        `Unread Messages:  ${status.unreadMessages}`,
        `Last Sync:        ${new Date(status.lastSync).toLocaleString()}`,
      ];
      return { output: lines.join('\n'), type: 'success' };
    },
  });

  registry.register({
    name: 'exit',
    description: 'Close terminal',
    usage: 'exit',
    aliases: ['quit'],
    handler: () => {
      useUIStore.getState().setTerminalOpen(false);
      return { output: 'Terminal closed.', type: 'system' };
    },
  });

  registry.register({
    name: 'time',
    description: 'Display current system time',
    usage: 'time',
    handler: () => {
      const now = new Date();
      return { output: now.toISOString(), type: 'info' };
    },
  });
}