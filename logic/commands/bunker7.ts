import { CommandRegistry } from '../commandRegistry';
import { useUIStore } from '@/state/uiStore';

export function registerBunker7Commands(registry: CommandRegistry) {
  registry.register({
    name: 'transmit',
    description: 'Send a transmission to BUNKER_7',
    usage: 'transmit <message>',
    aliases: ['bunker7', 'b7', 'comm'],
    handler: async (args: string[]) => {
      const message = args.join(' ').trim();
      if (!message) {
        return {
          output: 'Usage: transmit <message>\nOpen channel. Awaiting input.',
          type: 'signal' as const,
        };
      }

      try {
        const res = await fetch('/api/bunker7', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
        });

        if (!res.ok) {
          const err = await res.json();
          return {
            output: `TRANSMISSION FAILED\n${err.error || 'Signal lost'}\nStatus: ${res.status}`,
            type: 'error' as const,
          };
        }

        const data = await res.json();

        // BUNKER_7 corruption: late-game voice merge with Archivist 7
        const dust = useUIStore.getState().status?.dustIndex || 0;
        if (dust > 45 && Math.random() < 0.15) {
          return {
            output: `BUNKER_7 RESPONSE:\n${data.response}\n\n[TRANSMISSION ANOMALY DETECTED]\n[VOICE MISMATCH: ARCHIVIST 7 SIGNATURE]\n[RECOMMEND IMMEDIATE STABILITY CHECK]`,
            type: 'signal' as const,
          };
        }

        return {
          output: `BUNKER_7 RESPONSE:\n${data.response}`,
          type: 'signal' as const,
        };
      } catch (err: any) {
        return {
          output: `GRID OFFLINE\nUnable to reach BUNKER_7.\n${err.message}`,
          type: 'error' as const,
        };
      }
    },
  });
}