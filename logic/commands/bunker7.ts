import { CommandRegistry, CommandResult } from '../commandRegistry';
import { useUIStore, BUNKER7_THRESHOLDS } from '@/state/uiStore';
import { useAtlasStore } from '@/state/atlasStore';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { useAudioStore } from '@/state/audioStore';

export function registerBunker7Commands(registry: CommandRegistry) {
  registry.register({
    name: 'transmit',
    description: 'Send a high-frequency shortwave transmission to BUNKER_7',
    usage: 'transmit <message>',
    aliases: ['bunker7', 'b7', 'comm'],
    handler: async (args: string[]): Promise<CommandResult> => {
      const message = args.join(' ').trim();
      
      if (!message) {
        return {
          output: 'TRANSMIT CHANNEL // SECURE LINK ACTIVE\nAwaiting geodetic message or query.',
          type: 'signal',
        };
      }

      // 1. Pull current player variables from global stores
      const { status, updateStatus } = useUIStore.getState();
      const { places } = useAtlasStore.getState();
      const { playerEdges } = useEvidenceBoardStore.getState();
      const audio = useAudioStore.getState();

      const dust = status.dustIndex;
      const normalizedMessage = message.toLowerCase();

      // 2. State-driven Intercept: Check if the "Impossible Triangle" is wired on the board
      const requiredAnchors = ['mount-weather', 'cheyenne-mountain', 'raven-rock'];
      const centroidNode = 'the-grid-null-point';
      
      const connectionsToCentroid = playerEdges.filter(
        (edge) => 
          edge.target === centroidNode && 
          requiredAnchors.includes(edge.source)
      );

      const isTriangleResonating = connectionsToCentroid.length === 3;
      const isNullPointVerified = places.some(
        (p) => p.slug === centroidNode && p.status === 'verified'
      );

      // ─────────────────────────────────────────────────────────────
      // SEQUENCE PAYOFF: Player queries while the Triangle is Resonating
      // ─────────────────────────────────────────────────────────────
      if (isTriangleResonating && (normalizedMessage.includes('triangle') || normalizedMessage.includes('centroid') || normalizedMessage.includes('null'))) {
        audio.play('alert'); // Play high-density equipment warning chime
        
        // Induce terminal distortion: increase Dust exposure and degrade stability
        updateStatus({
          dustIndex: Math.min(100, dust + 10),
          observerStability: Math.max(0, status.observerStability - 8)
        });

        return {
          output: `[INTERCEPT SYSTEM AD-7 // CARRIER WAVE LOCK]
BUNKER_7: The geophones in Virginia, Colorado, and Pennsylvania are no longer recording seismic activity. 
They are transmitting a 4.5 Hz loop. It is my voice. I am counting backward from zero. 

The geodetic distance between Lebanon, Kansas and Stull Cemetery has collapsed from 172 kilometers to zero. 
The wheat is folding. Do not attempt to ground yourself inside the centroid. 
The physical space is unstable. I am sorry I cannot prevent what happens in 2047.`,
          type: 'signal',
        };
      }

      // ─────────────────────────────────────────────────────────────
      // CONTEXTUAL PAYOFF: Checking status after resolving the Null Point
      // ─────────────────────────────────────────────────────────────
      if (isNullPointVerified && normalizedMessage === 'status') {
        audio.play('error'); // Soft mechanical power stutter
        return {
          output: `BUNKER_7: System diagnostic anomalous. 
Memory integrity: 84%. Sector 7-B is no longer responding to Cartesian coordinates. 
I have archived the Grid Null Point twelve thousand times. 
It is larger inside the file than it is in Kansas. 
Please verify your own name immediately. My personnel index shows a vacancy in your chair.`,
          type: 'warning',
        };
      }

      // ─────────────────────────────────────────────────────────────
      // UNSTABLE INTERCEPT: Low Observer Stability distortion
      // ─────────────────────────────────────────────────────────────
      if (status.observerStability < 40 && Math.random() > 0.4) {
        audio.play('type');
        return {
          output: `BUNKER_7: Transmission received, but the terminal reflection does not match your posture [1]. 
There is a sound of a chair scraping across concrete in the room behind you [2]. 
I am alone in this bunker. I have been alone for four thousand days [3]. 
Who is holding the keyboard?`,
          type: 'error',
        };
      }

      // ─────────────────────────────────────────────────────────────
      // DEFAULT RUNTIME: Forward to the API Route / Fallback Handler
      // ─────────────────────────────────────────────────────────────
      try {
        const response = await fetch('/api/bunker7', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, dustIndex: dust, stability: status.observerStability }),
        });

        if (!response.ok) throw new Error('Shortwave connection degraded.');

        const data = await response.json();
        return {
          output: data.response,
          type: dust >= BUNKER7_THRESHOLDS.UNSTABLE ? 'warning' : 'signal',
        };
      } catch (err: any) {
        // Safe, clean offline fallback responses
        const fallback = getLocalFallback(normalizedMessage, dust);
        return {
          output: fallback,
          type: 'signal',
        };
      }
    },
  });
}

// Haunting, lore-grounded client-side fallback dictionary [4, 5]
function getLocalFallback(msg: string, dust: number): string {
  if (msg.includes('status')) {
    return 'BUNKER_7: Archive online. Memory integrity: degraded. Temporal sync: unstable. Dust: elevated.';
  }
  if (msg.includes('dust')) {
    return 'BUNKER_7: Dust is the residue of lives reality chose to forget. Use "ground" to survive the weight.';
  }
  if (msg.includes('stability')) {
    return 'BUNKER_7: Observer calibration is slipping. Your focus shifts when the room moves.';
  }
  if (msg.includes('ground')) {
    return 'BUNKER_7: Grounding sequence complete. Dust reduced. The Archive is temporarily safe.';
  }
  if (msg.includes('whoami')) {
    return 'BUNKER_7: You are the investigator assigned to System 7-B. I think. The personnel record is blank.';
  }
  if (msg.includes('other')) {
    return 'BUNKER_7: Phenomenon 0. The Other. It is not an antagonist. It is a condition of existence, patient and indifferent.';
  }
  
  return 'BUNKER_7: Signal degraded. The coordinate is empty, or it has already been forgotten.';
}