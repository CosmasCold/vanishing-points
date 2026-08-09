import { CommandRegistry, CommandResult } from '../commandRegistry';
import { useAtlasStore } from '@/state/atlasStore';
import { useDocumentStore } from '@/state/documentStore';
import { useUIStore } from '@/state/uiStore';
import { useAudioStore } from '@/state/audioStore';

export function registerDecryptCommands(registry: CommandRegistry) {
  registry.register({
    name: 'decrypt',
    description: 'Decrypt encrypted shortwave intercepts, declassify restricted documents, or unlock coded geodetic sectors',
    usage: 'decrypt --key <value> OR decrypt --file <id> --key <value>',
    aliases: ['cipher', 'decode'],
    handler: async (args: string[]): Promise<CommandResult> => {
      const keyIndex = args.indexOf('--key');
      const fileIndex = args.indexOf('--file');

      if (keyIndex === -1 || keyIndex + 1 >= args.length) {
        return {
          output: 'DECRYPTION FAILED.\nUsage:\n  /decrypt --key <value>\n  /decrypt --file <doc-id> --key <value>\nExample: /decrypt --key 7-14-0',
          type: 'error',
        };
      }

      const enteredKey = args[keyIndex + 1].trim();
      const { play } = useAudioStore.getState();
      const { status, updateStatus } = useUIStore.getState();

      // CASE 1: Decrypting a specific document file (e.g. doc-ora-001 with key BARBAROSSA)
      if (fileIndex !== -1 && fileIndex + 1 < args.length) {
        const fileId = args[fileIndex + 1].trim();
        const { documents, addDocument } = useDocumentStore.getState();

        // Check if targeting the historic Oradour Church Crypt declassification files
        if (fileId === 'doc-ora-001' && enteredKey.toUpperCase() === 'BARBAROSSA') {
          play('alert');
          updateStatus({
            dustIndex: Math.min(100, status.dustIndex + 10), // Releases historical dust
            observerStability: Math.min(100, status.observerStability + 5),
          });

          return {
            output: `CIPHER ACCEPTED: 'BARBAROSSA' DECODED.\n------------------------------------------------\nFILE: doc-ora-001 [Saint-Martin Parish Records]\nSTATUS: DECLASSIFIED / UNREDACTED\n------------------------------------------------\nREVELATION:\n"The records continue until June 17, 1944. Seven days after the fire. One baptism is entered in ink that remains wet on the parchment. It is signed: 'Edward Vance, Keeper'.\"\n\nThe impossible connection is now explicit. Edward Vance (the St. Elmo Lighthouse keeper) was present in Oradour-sur-Glane. Reality is bleeding across centuries.`,
            type: 'success',
          };
        }

        return {
          output: `DECRYPTION REJECTED.\nNo matching decryption block found for file '${fileId}' with the entered key cipher. Check your spellings.`,
          type: 'error',
        };
      }

      // CASE 2: Unlocking a code-locked geodetic Atlas sector (e.g., Brest Fortress, BUNKER_3, Kolmanskop)
      const { places, selectedPlaceSlug, setPlaces } = useAtlasStore.getState();
      if (selectedPlaceSlug) {
        const activePlace = places.find((p) => p.slug === selectedPlaceSlug);
        if (activePlace && activePlace.unlockCondition?.type === 'code') {
          const expectedCode = String(activePlace.unlockCondition.value).trim().toUpperCase();
          if (enteredKey.toUpperCase() === expectedCode) {
            // Unlock! Remove code restriction, shift status to verified or pending
            const updatedPlaces = places.map((p) => {
              if (p.slug === activePlace.slug) {
                const unlockedPlace = { ...p };
                delete unlockedPlace.unlockCondition; // Lift the lock gate
                return { ...unlockedPlace, status: 'pending' as const };
              }
              return p;
            });

            setPlaces(updatedPlaces);
            play('alert');
            updateStatus({
              dustIndex: Math.min(100, status.dustIndex + 15),
            });

            return {
              output: `ACCESS GRANTED: GATEWAY BYPASSED.\n------------------------------------------------\nSECTOR: ${activePlace.name.toUpperCase()}\nCIPHER: '${enteredKey.toUpperCase()}' MATCHED.\n------------------------------------------------\nThe seal on Chamber 7 has been demagnetized. Accessing local environmental telemetry blocks... The geophones are active.`,
              type: 'success',
            };
          }
        }
      }

      // CASE 3: General Shortwave Numbers Station Triangulation Key (7-14-0 Solstice Vector)
      if (enteredKey === '7-14-0') {
        play('alert');
        updateStatus({
          dustIndex: Math.min(100, status.dustIndex + 15), // Rewards Dust toward endgame progression
        });

        return {
          output: `SOLSTICE VECTOR SYNCHRONIZED [7 - 14 - 0]\n------------------------------------------------\nSOURCE: Numbers Station Channel 7 Loop\nSTATUS: ZERO-BEAT SYNCHRONIZATION LOCKED\n------------------------------------------------\nBUNKER_7 INTERCEPT:\n"The geophones at Mount Weather, Cheyenne, and Raven Rock are no longer recording local seismic shifts. They are transmitting a 4.5 Hz loop. It is my voice. I am counting backward from zero. The lines intersect at Lebanon, Kansas. Do not follow the threads."`,
          type: 'success',
        };
      }

      return {
        output: `CIPHER DENIED.\nVector offset coordinates do not align. The Archive remains silent. Rephrase or audit your observations.`,
        type: 'error',
      };
    },
  });
}
