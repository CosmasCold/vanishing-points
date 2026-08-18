import { CommandRegistry, CommandResult } from '../commandRegistry';
import { useAtlasStore } from '@/state/atlasStore';
import { useDocumentStore } from '@/state/documentStore';
import { useAudioStore } from '@/state/audioStore';
import { useProgressionStore } from '@/state/progressionStore';

export function registerDecryptCommands(
  registry: CommandRegistry
) {
  registry.register({
    name: 'decrypt',
    description:
      'Decrypt encrypted shortwave intercepts, declassify restricted documents, or unlock coded geodetic sectors',
    usage:
      'decrypt --key <value> OR decrypt --file <id> --key <value>',
    aliases: ['cipher', 'decode'],

    handler: async (
      args: string[]
    ): Promise<CommandResult> => {
      const keyIndex =
        args.indexOf('--key');

      const fileIndex =
        args.indexOf('--file');

      if (
        keyIndex === -1 ||
        keyIndex + 1 >= args.length
      ) {
        return {
          output:
            'DECRYPTION FAILED.\n' +
            'Usage:\n' +
            '  /decrypt --key <value>\n' +
            '  /decrypt --file <doc-id> --key <value>\n' +
            'Example: /decrypt --key 7-14-0',
          type: 'error',
        };
      }

      const enteredKey =
        args[keyIndex + 1].trim();

      const { play } =
        useAudioStore.getState();

      // -------------------------------------------------------------
      // CASE 1
      // Decrypting a specific document file.
      // -------------------------------------------------------------

      if (
        fileIndex !== -1 &&
        fileIndex + 1 < args.length
      ) {
        const fileId =
          args[fileIndex + 1].trim();

        const {
          documents,
          addDocument,
        } =
          useDocumentStore.getState();

        /*
         * These store values are intentionally retained here because
         * this command's document declassification behavior is part of
         * the existing command contract.
         */
        void documents;
        void addDocument;

        // Historic Oradour Church Crypt declassification.
        if (
          fileId === 'doc-ora-001' &&
          enteredKey.toUpperCase() ===
            'BARBAROSSA'
        ) {
          play('alert');

          const progression =
            useProgressionStore.getState();

          /*
           * Canonical progression transaction:
           *
           * +10 Dust
           * +5 Observer Stability
           *
           * addDust cannot fail, so there is no partial-cost
           * failure path requiring rollback.
           */
          progression.addDust(10);
          progression.changeStability(5);

          return {
            output:
              `CIPHER ACCEPTED: 'BARBAROSSA' DECODED.\n` +
              `------------------------------------------------\n` +
              `FILE: doc-ora-001 [Saint-Martin Parish Records]\n` +
              `STATUS: DECLASSIFIED / UNREDACTED\n` +
              `------------------------------------------------\n` +
              `REVELATION:\n` +
              `"The records continue until June 17, 1944. Seven days after the fire. One baptism is entered in ink that remains wet on the parchment. It is signed: 'Edward Vance, Keeper'.\"\n\n` +
              `The impossible connection is now explicit. Edward Vance (the St. Elmo Lighthouse keeper) was present in Oradour-sur-Glane. Reality is bleeding across centuries.`,
            type: 'success',
          };
        }

        return {
          output:
            `DECRYPTION REJECTED.\n` +
            `No matching decryption block found for file '${fileId}' with the entered key cipher. Check your spellings.`,
          type: 'error',
        };
      }

      // -------------------------------------------------------------
      // CASE 2
      // Unlocking a code-locked geodetic Atlas sector.
      // -------------------------------------------------------------

      const {
        places,
        selectedPlaceSlug,
        setPlaces,
      } =
        useAtlasStore.getState();

      if (selectedPlaceSlug) {
        const activePlace =
          places.find(
            (p) =>
              p.slug ===
              selectedPlaceSlug
          );

        if (
          activePlace &&
          activePlace.unlockCondition
            ?.type === 'code'
        ) {
          const expectedCode =
            String(
              activePlace
                .unlockCondition.value
            )
              .trim()
              .toUpperCase();

          if (
            enteredKey.toUpperCase() ===
            expectedCode
          ) {
            /*
             * Unlock the Atlas location first.
             *
             * This operation has no spendable Dust cost, so
             * addDust(15) cannot fail and no rollback transaction
             * is required.
             */
            const updatedPlaces =
              places.map((p) => {
                if (
                  p.slug ===
                  activePlace.slug
                ) {
                  const unlockedPlace = {
                    ...p,
                  };

                  delete unlockedPlace.unlockCondition;

                  return {
                    ...unlockedPlace,
                    status:
                      'pending' as const,
                  };
                }

                return p;
              });

            setPlaces(updatedPlaces);

            play('alert');

            useProgressionStore
              .getState()
              .addDust(15);

            return {
              output:
                `ACCESS GRANTED: GATEWAY BYPASSED.\n` +
                `------------------------------------------------\n` +
                `SECTOR: ${activePlace.name.toUpperCase()}\n` +
                `CIPHER: '${enteredKey.toUpperCase()}' MATCHED.\n` +
                `------------------------------------------------\n` +
                `The seal on Chamber 7 has been demagnetized. Accessing local environmental telemetry blocks... The geophones are active.`,
              type: 'success',
            };
          }
        }
      }

      // -------------------------------------------------------------
      // CASE 3
      // General Shortwave Numbers Station Triangulation Key.
      // -------------------------------------------------------------

      if (enteredKey === '7-14-0') {
        play('alert');

        useProgressionStore
          .getState()
          .addDust(15);

        return {
          output:
            `SOLSTICE VECTOR SYNCHRONIZED [7 - 14 - 0]\n` +
            `------------------------------------------------\n` +
            `SOURCE: Numbers Station Channel 7 Loop\n` +
            `STATUS: ZERO-BEAT SYNCHRONIZATION LOCKED\n` +
            `------------------------------------------------\n` +
            `BUNKER_7 INTERCEPT:\n` +
            `"The geophones at Mount Weather, Cheyenne, and Raven Rock are no longer recording local seismic shifts. They are transmitting a 4.5 Hz loop. It is my voice. I am counting backward from zero. The lines intersect at Lebanon, Kansas. Do not follow the threads."`,
          type: 'success',
        };
      }

      return {
        output:
          `CIPHER DENIED.\n` +
          `Vector offset coordinates do not align. The Archive remains silent. Rephrase or audit your observations.`,
        type: 'error',
      };
    },
  });
}