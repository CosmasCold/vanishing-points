// logic/commands/personalCache.ts
import { CommandRegistry } from '../commandRegistry';
import { usePersonalCacheStore } from '@/state/personalCacheStore';
import { useUIStore } from '@/state/uiStore';
import { useMediaStore } from '@/state/mediaStore';

const CACHE_FILES: Record<number, { title: string; url: string; dust: number }> = {
  1: { title: 'Cache 01: Arrival', url: '/media/personal/cache-01-arrival.mp3', dust: 5 },
  2: { title: 'Cache 02: The First Drift', url: '/media/personal/cache-02-drift.mp3', dust: 15 },
  3: { title: 'Cache 03: The Room', url: '/media/personal/cache-03-room.mp3', dust: 25 },
  4: { title: 'Cache 04: Not Alone', url: '/media/personal/cache-04-alone.mp3', dust: 40 },
  5: { title: 'Cache 05: Transmission', url: '/media/personal/cache-05-transmission.mp3', dust: 55 },
};

export function registerPersonalCacheCommands(registry: CommandRegistry) {
  registry.register({
    name: 'drawer',
    description: 'Open Desk Drawer 7. Personal effects.',
    usage: 'drawer',
    aliases: ['cache', 'personal'],
    handler: () => {
      const { status } = useUIStore.getState();
      const dust = status?.dustIndex || 0;
      const { discovered, discoverCache } = usePersonalCacheStore.getState();

      let output = 'DESK DRAWER 7 — PERSONAL EFFECTS\n';
      output += '═════════════════════════════════\n\n';

      Object.entries(CACHE_FILES).forEach(([id, file]) => {
        const numId = parseInt(id);
        const isUnlocked = dust >= file.dust;
        const isDiscovered = discovered.includes(numId);

        if (isUnlocked) {
          if (!isDiscovered) discoverCache(numId);
          output += `[${id}] ${file.title}\n`;
          output += `    Status: AVAILABLE\n`;
          output += `    Dust required: ${file.dust}\n\n`;
        } else {
          output += `[${id}] LOCKED\n`;
          output += `    Dust required: ${file.dust}\n`;
          output += `    Current: ${dust}\n\n`;
        }
      });

      output += 'Use: play cache-<number> to load cassette.\n';
      output += 'Example: play cache-1';

      return { output, type: 'info' as const };
    },
  });

  registry.register({
    name: 'play',
    description: 'Play a personal cache recording',
    usage: 'play cache-<number>',
    handler: (args: string[]) => {
      const { status } = useUIStore.getState();
      const dust = status?.dustIndex || 0;
      const { openMedia } = useMediaStore.getState();

      if (!args[0]?.startsWith('cache-')) {
        return { output: 'Usage: play cache-<number>\nExample: play cache-1', type: 'error' as const };
      }

      const id = parseInt(args[0].replace('cache-', ''));
      const file = CACHE_FILES[id];

      if (!file) return { output: `Cache ${id} not found.`, type: 'error' as const };
      if (dust < file.dust) {
        return {
          output: `INSUFFICIENT DUST CLEARANCE\nRequired: ${file.dust}\nCurrent: ${dust}\nPlayback denied. Signal unstable.`,
          type: 'warning' as const,
        };
      }

      openMedia(`cache-${id}`, file.url, 'audio', file.title);
      return {
        output: `Loading cassette...\n${file.title}\nInserting into deck...`,
        type: 'success' as const,
      };
    },
  });
}