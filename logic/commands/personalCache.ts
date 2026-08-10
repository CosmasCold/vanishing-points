// logic/commands/personalCache.ts
import { CommandRegistry, CommandResult } from '../commandRegistry';
import { usePersonalCacheStore } from '@/state/personalCacheStore';
import { useUIStore } from '@/state/uiStore';
import { useMediaStore } from '@/state/mediaStore';

// Map your personal recordings to the game's Dust progression
const CACHE_FILES: Record<number, { title: string; url: string; dust: number }> = {
  1: { title: 'Cache 01: The Nature of Haunted Houses', url: '/audio/personal/haunted-houses.mp3', dust: 5 },
  2: { title: 'Cache 02: Last Photographs', url: '/audio/personal/last-photographs.mp3', dust: 25 },
  3: { title: 'Cache 03: Forced Underground', url: '/audio/personal/forced-underground.mp3', dust: 50 },
  4: { title: 'Cache 04: The Library at the End of the World', url: '/audio/personal/library-end-of-world.mp3', dust: 75 },
  5: { title: 'Cache 05: Final Session', url: '/audio/personal/final-session.mp3', dust: 90 },
};

export function registerPersonalCacheCommands(registry: CommandRegistry) {
  registry.register({
    name: 'drawer',
    description: 'Open Desk Drawer 7. Personal effects.',
    usage: 'drawer',
    aliases: ['cache', 'personal'],
    handler: (): CommandResult => {
      const { status } = useUIStore.getState();
      const dust = status?.dustIndex || 0;
      const { discoverCache } = usePersonalCacheStore.getState();

      let output = 'DESK DRAWER 7: PERSONAL CACHE\n═════════════════════════════\n';
      let found = 0;

      Object.entries(CACHE_FILES).forEach(([idStr, cache]) => {
        const id = parseInt(idStr);
        if (dust >= cache.dust) {
          discoverCache(id);
          output += `[UNLOCKED] cache-${id} : ${cache.title}\n`;
          found++;
        } else {
          output += `[LOCKED]   cache-${id} : Requires Dust Index ${cache.dust}\n`;
        }
      });

      if (found > 0) {
        output += '\nType "/play cache-<number>" to listen to a cassette.';
      }
      return { output, type: 'info' };
    }
  });

  registry.register({
    name: 'play',
    description: 'Play a personal cache recording',
    usage: 'play cache-<number>',
    handler: (args: string[]): CommandResult => {
      const { status } = useUIStore.getState();
      const dust = status?.dustIndex || 0;
      const { openMedia } = useMediaStore.getState();

      const target = args[0];
      if (!target || !target.startsWith('cache-')) {
        return { output: 'Usage: play cache-<number>', type: 'error' };
      }

      const id = parseInt(target.replace('cache-', ''), 10);
      const cache = CACHE_FILES[id];

      if (!cache) {
        return { output: `File ${target} not found in drawer.`, type: 'error' };
      }

      if (dust < cache.dust) {
        return { output: `Cannot play ${target}. Dust Index ${cache.dust} required.`, type: 'error' };
      }

      // Automatically mounts the audio into the full-screen TapeDeck component!
      openMedia(`cache-${id}`, cache.url, 'personal', cache.title);

      return { output: `Mounting ${target} to Tape Deck...`, type: 'success' };
    }
  });
}
