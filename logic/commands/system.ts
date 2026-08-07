import { CommandRegistry, CommandDefinition } from '../commandRegistry';
import { useUIStore } from '@/state/uiStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useSessionStore } from '@/state/sessionStore';

export function registerSystemCommands(registry: CommandRegistry) {

  registry.register({
    name: 'guide',
    description: 'Open operator briefing',
    usage: 'guide',
    aliases: ['tutorial', 'help-start'],
    handler: () => {
      useUIStore.getState().setGuideOpen(true);
      return {
        output: 'Operator briefing loaded. Close the modal to return to the archive.',
        type: 'info' as const,
      };
    },
  });

  registry.register({
    name: 'help',
    description: 'Display available commands',
    usage: 'help',
    aliases: ['?', 'commands'],
    handler: () => {
      const cmds = registry.list();
      let output = 'AVAILABLE COMMANDS\n';
      output += '══════════════════\n\n';

      cmds.forEach((cmd: CommandDefinition) => {
        const aliases = cmd.aliases ? ` [${cmd.aliases.join(', ')}]` : '';
        output += `${cmd.name}${aliases}\n`;
        output += `    ${cmd.description}\n`;
        output += `    Usage: ${cmd.usage}\n\n`;
      });

      return { output, type: 'system' as const };
    },
  });

  registry.register({
    name: 'clear',
    description: 'Clear terminal history',
    usage: 'clear',
    aliases: ['cls'],
    handler: () => {
      return { clear: true, output: '', type: 'system' as const };
    },
  });

  registry.register({
    name: 'whoami',
    description: 'Display current investigator status',
    usage: 'whoami',
    handler: () => {
      const { status } = useUIStore.getState();
      const { activeInvestigationId } = useInvestigationStore.getState();
      const { inboxItems } = useSessionStore.getState();

      let output = 'INVESTIGATOR STATUS\n';
      output += '═══════════════════\n\n';
      output += `Dust Index:           ${status.dustIndex}\n`;
      output += `Observer Stability:   ${status.observerStability.toFixed(1)}%\n`;
      output += `Atlas Coverage:       ${status.atlasCoverage} km²\n`;
      output += `Active Alerts:        ${status.activeAlerts}\n`;
      output += `Active Investigation: ${activeInvestigationId || 'None'}\n`;
      output += `Unread Messages:      ${inboxItems.filter((i) => !i.read).length}\n`;

      return { output, type: 'info' as const };
    },
  });

  registry.register({
    name: 'date',
    description: 'Display current system date',
    usage: 'date',
    handler: () => {
      const now = new Date();
      return {
        output: now.toISOString(),
        type: 'info' as const,
      };
    },
  });

  registry.register({
    name: 'uptime',
    description: 'Display system uptime',
    usage: 'uptime',
    handler: () => {
      const { sessionCount } = useSessionStore.getState();
      return {
        output: `Archive sessions initiated: ${sessionCount}\nTemporal sync: NOMINAL`,
        type: 'info' as const,
      };
    },
  });
}