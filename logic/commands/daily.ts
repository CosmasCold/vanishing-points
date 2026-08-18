import { CommandRegistry } from '../commandRegistry';
import { useSessionStore } from '@/state/sessionStore';
import { useProgressionStore } from '@/state/progressionStore';

export function registerDailyCommands(registry: CommandRegistry) {
  registry.register({
    name: 'mail',
    description: 'Check inbox messages',
    usage: 'mail',
    aliases: ['inbox', 'messages'],
    handler: () => {
      const { inboxItems } = useSessionStore.getState();

      if (inboxItems.length === 0) {
        return { output: 'Inbox empty. No new transmissions.', type: 'info' as const };
      }

      let output = `INBOX — ${inboxItems.length} ITEMS\n`;
      output += '══════════════════════\n\n';

      inboxItems.forEach((item) => {
        const status = item.read ? '[READ]' : '[NEW]';
        const typeColor =
          item.type === 'alert' ? '!' : item.type === 'message' ? '*' : '-';

        output += `${status} ${typeColor} ${item.title}\n`;
        output += `    ${item.body.substring(0, 80)}${item.body.length > 80 ? '...' : ''}\n`;
        output += `    ${item.timestamp}\n\n`;
      });

      return { output, type: 'info' as const };
    },
  });

  registry.register({
    name: 'read',
    description: 'Mark an inbox item as read',
    usage: 'read <item-id>',
    handler: (args: string[]) => {
      const id = args[0];
      if (!id) return { output: 'Usage: read <item-id>', type: 'error' as const };

      const { inboxItems, markInboxRead } = useSessionStore.getState();
      const item = inboxItems.find((i) => i.id === id);

      if (!item) return { output: `Item not found: ${id}`, type: 'error' as const };

      markInboxRead(id);
      return {
        output: `Marked as read: ${item.title}\n${item.body}`,
        type: 'success' as const,
      };
    },
  });

  registry.register({
    name: 'today',
    description: 'Display today’s briefing',
    usage: 'today',
    handler: () => {
      const { sessionCount, inboxItems, lastSessionDate } = useSessionStore.getState();
      const { dustIndex, observerStability } = useProgressionStore.getState();

      let output = 'DAILY BRIEFING\n';
      output += '══════════════\n\n';
      output += `Session: ${sessionCount}\n`;
      output += `Date: ${lastSessionDate || 'Unknown'}\n`;
      output += `Dust Index: ${dustIndex}\n`;
      output += `Observer Stability: ${observerStability.toFixed(1)}%\n\n`;
      output += `Inbox: ${inboxItems.length} items (${inboxItems.filter((i) => !i.read).length} unread)\n\n`;

      if (dustIndex >= 30) {
        output += 'RECOMMENDATION: Perform grounding ritual before proceeding with new investigations.\n';
      } else {
        output += 'Status: Nominal. Proceed with investigations.\n';
      }

      return { output, type: 'info' as const };
    },
  });

  registry.register({
    name: 'begin',
    description: 'Complete daily ritual and begin work',
    usage: 'begin',
    handler: () => {
      const { ritualComplete, completeRitual } = useSessionStore.getState();
      if (ritualComplete) {
        return { output: 'Work already in progress.', type: 'warning' as const };
      }
      completeRitual();
      return {
        output: 'Daily ritual complete.\nThe Archive is ready.\nWhat needs remembering today?',
        type: 'success' as const,
      };
    },
  });
}
