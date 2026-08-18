import { CommandRegistry, CommandResult } from '../commandRegistry';
import { useAtlasStore } from '@/state/atlasStore';
import { useDocumentStore } from '@/state/documentStore';
import { useAudioStore } from '@/state/audioStore';
import { useProgressionStore } from '@/state/progressionStore';

export function registerForgetCommands(
  registry: CommandRegistry
) {
  // ---------------------------------------------------------------------------
  // /forget --case <slug>
  // ---------------------------------------------------------------------------

  registry.register({
    name: 'forget',
    description: 'Suppress a case from active observer memory',
    usage: 'forget --case <slug>',
    aliases: ['erase-case', 'repress'],

    handler: async (
      args: string[]
    ): Promise<CommandResult> => {
      const caseIndex =
        args.indexOf('--case');

      let slug = '';

      if (
        caseIndex !== -1 &&
        caseIndex + 1 < args.length
      ) {
        slug =
          args[caseIndex + 1].trim();
      } else if (args[0]) {
        slug = args[0].trim();
      }

      if (
        !slug ||
        slug === '--case'
      ) {
        return {
          output:
            'FORGET REGISTRY ERROR.\n' +
            'Usage: forget --case <slug>\n' +
            'Example: forget --case pripyat-amusement-park',
          type: 'error',
        };
      }

      const atlasStore =
        useAtlasStore.getState();

      const progressionStore =
        useProgressionStore.getState();

      const audioStore =
        useAudioStore.getState();

      /*
       * Atlas remains the source for authored display metadata only.
       *
       * /forget does not mutate the authored place or remove it from Atlas.
       */
      const place =
        atlasStore.places.find(
          (p) => p.slug === slug
        );

      if (!place) {
        return {
          output:
            `FORGET REJECTED: Place '${slug}' not found in active ` +
            'geodetic database index.',
          type: 'error',
        };
      }

      if (
        progressionStore.suppressedCaseIds.includes(
          slug
        )
      ) {
        return {
          output:
            `FORGET REJECTED: ${place.name} is already marked as ` +
            'intentionally suppressed in the Archive.',
          type: 'warning',
        };
      }

      /*
       * Canonical /forget transaction.
       *
       * suppressCase() owns:
       * - intentional case suppression
       * - investigation-history preservation
       * - Dust reduction
       * - Consensus reduction
       *
       * The authored Atlas record remains untouched.
       */
      const suppressed =
        progressionStore.suppressCase(
          slug
        );

      if (!suppressed) {
        return {
          output:
            `FORGET REJECTED: Unable to suppress ${place.name}. ` +
            'Canonical progression state was unchanged.',
          type: 'error',
        };
      }

      audioStore.play('click');

      return {
        output: [
          `COGNITIVE CODES SUPPRESSED FOR: ${place.name.toUpperCase()}`,
          '------------------------------------------------',
          'STATUS: INTENTIONALLY SUPPRESSED',
          'DUST: -10',
          'CONSENSUS: -2',
          '------------------------------------------------',
          'ARCHIVE NOTE: The case has not been erased.',
          'Its evidence, investigation history, and authored record remain.',
          'BUNKER_7: Why do I remember a place that you do not?',
          'The Archive remembers what you tried to forget.',
        ].join('\n'),
        type: 'warning',
      };
    },
  });

  // ---------------------------------------------------------------------------
  // /restore
  //
  // Two modes:
  //
  //   restore
  //   restore --case <slug>
  //
  // Without --case:
  //   Neural calibration.
  //
  // With --case:
  //   Reconstruct a previously suppressed case.
  // ---------------------------------------------------------------------------

  registry.register({
    name: 'restore',
    description:
      'Recalibrate observer stability metric OR reconstruct a forgotten case',
    usage: 'restore [--case <slug>]',
    aliases: ['reconstruct', 'stabilize'],

    handler: async (
      args: string[]
    ): Promise<CommandResult> => {
      const caseIndex =
        args.indexOf('--case');

      let slug = '';

      if (
        caseIndex !== -1 &&
        caseIndex + 1 < args.length
      ) {
        slug =
          args[caseIndex + 1].trim();
      } else if (
        args[0] &&
        args[0] !== '--case'
      ) {
        slug = args[0].trim();
      }

      const progressionStore =
        useProgressionStore.getState();

      const audioStore =
        useAudioStore.getState();

      const atlasStore =
        useAtlasStore.getState();

      // -----------------------------------------------------------------------
      // RESTORE MODE: NEURAL CALIBRATION
      // -----------------------------------------------------------------------

      if (!slug) {
        const workDone =
          progressionStore.sessionWorkDone || 0;

        const requiredWork = 2;

        if (workDone < requiredWork) {
          return {
            output:
              `RESTORATION REJECTED: COGNITIVE CALIBRATION FAILURE.\n` +
              `------------------------------------------------\n` +
              `ACTIVE REFERENCE WORK: [${workDone} / ${requiredWork}] STATUS: DEGRADED\n` +
              `------------------------------------------------\n` +
              `Your neural anchor is slipping, but you cannot calibrate stability by raw command input alone.\n` +
              `You must first anchor your mind in consensus reality by performing active grounding tasks:\n\n` +
              `  1. Review verified case evidence against preserved original files.\n` +
              `  2. Listen to authenticated recordings in your Tape Deck.\n` +
              `  3. Compare photographs and schematics against archival negatives.\n` +
              `  4. Reconnect stable geodetic coordinates on your Evidence Board.\n\n` +
              `Examine verified (green/completed) records to build up active reference logs before attempting /restore.`,
            type: 'error',
          };
        }

        /*
         * Calibration restores Stability by +35, capped at 100.
         *
         * sessionWorkDone is reset because the reference-work requirement
         * has been consumed by this calibration cycle.
         */
        const currentStability =
          progressionStore.observerStability;

        const restoredStability =
          Math.min(
            100,
            currentStability + 35
          );

        audioStore.play('alert');

        useProgressionStore.setState(
          (state) => ({
            observerStability:
              restoredStability,
            sessionWorkDone: 0,
          })
        );

        return {
          output:
            `NEURAL CALIBRATION INITIATED.\n` +
            `------------------------------------------------\n` +
            `OBSERVER STABILITY: RESTORED TO ${restoredStability}%\n` +
            `REFERENCE WORK LOGS: RESET TO NOMINAL (0)\n` +
            `------------------------------------------------\n` +
            `BUNKER_7: Calibration complete. Interface alignment normalized. Your neural anchor is secure for now, but continued exposure to unverified files will continue to degrade your stability.`,
          type: 'success',
        };
      }

      // -----------------------------------------------------------------------
      // RESTORE CASE MODE
      // -----------------------------------------------------------------------

      const place =
        atlasStore.places.find(
          (p) => p.slug === slug
        );

      if (!place) {
        return {
          output:
            `RESTORE REJECTED: Place '${slug}' not found in active database registers.`,
          type: 'error',
        };
      }

      const isForgotten =
        progressionStore.suppressedCaseIds.includes(
          slug
        );

      if (!isForgotten) {
        return {
          output:
            `RESTORE REDUNDANT: ${place.name} is already stable and verified on the geodetic grid.`,
          type: 'warning',
        };
      }

      // -----------------------------------------------------------------------
      // RECONSTRUCT AUTHORED HISTORY
      // -----------------------------------------------------------------------

      let reconstructedHistory =
        place.history;

      let reconstructedResonance =
        place.resonanceNote || '';

      if (
        slug ===
        'pripyat-amusement-park'
      ) {
        reconstructedHistory =
          'The Ferris wheel has turned exactly once. Our geophones captured the sound of a single cabin creaking under weight on Lenin Avenue. Your signature was found on the test log dated April 26, 1986. BUNKER_7 registers your presence at the bumper cars.';

        reconstructedResonance =
          'I saw a yellow bumper car moving. There was no driver. But the leather seat was depressed by exactly 70 kilograms.';
      } else if (
        slug ===
        'chernobyl-reactor-4-control-room'
      ) {
        reconstructedHistory =
          'The AZ-5 emergency shutdown button is depressed. The control rods are locked at 0.0 meters. The control room is dead, but the glass screen behind you is reflecting Leonid Toptunov typing your name.';

        reconstructedResonance =
          'The button is still warm. I have the thermal imaging to prove it. The heat signature is shaped like your hand.';
      } else if (
        slug ===
        'eastern-state-penitentiary'
      ) {
        reconstructedHistory =
          'Cellblock 12 contains no shadows. Because the shadows have walked out of the heavy stone door and are standing in the control carrel behind your chair. The rusty key is already in your pocket.';

        reconstructedResonance =
          "Subject's shadow shows a different posture than subject's body. The shadow has stood up and is standing behind you.";
      } else {
        reconstructedHistory +=
          " [RECONSTRUCTED: The records of this location have been modified by ARCHIVE NODE 7-B. A new paragraph has materialized in typewriter carbon: 'The observer INV_RED-7 was present on-site.']";

        reconstructedResonance =
          'You have been here before. The file says you have not. I believe the file.';
      }

      // -----------------------------------------------------------------------
      // UPDATE ATLAS PRESENTATION STATE
      // -----------------------------------------------------------------------

      const updatedPlaces =
        atlasStore.places.map(
          (p) => {
            if (p.slug !== slug) {
              return p;
            }

            return {
              ...p,
              status: 'verified' as const,
              history:
                reconstructedHistory,
              resonanceNote:
                reconstructedResonance,
            };
          }
        );

      atlasStore.setPlaces(
        updatedPlaces
      );

      // -----------------------------------------------------------------------
      // RESTORE CANONICAL PROGRESSION
      // -----------------------------------------------------------------------
      //
      // Suppression is removed.
      // Investigation history is preserved.
      // Dust increases by 10.
      // Stability decreases by 5, matching the authored output and narrative.
      //
      // No UI-store progression state is touched.
      // -----------------------------------------------------------------------

      useProgressionStore.setState(
        (state) => {
          const currentInvestigated =
            state.investigatedPlaceIds || [];

          const restoredInvestigated =
            currentInvestigated.includes(
              slug
            )
              ? currentInvestigated
              : [
                  ...currentInvestigated,
                  slug,
                ];

          return {
            suppressedCaseIds:
              state.suppressedCaseIds.filter(
                (id) => id !== slug
              ),

            investigatedPlaceIds:
              restoredInvestigated,

            dustIndex:
              Math.min(
                100,
                state.dustIndex + 10
              ),

            observerStability:
              Math.max(
                0,
                state.observerStability - 5
              ),
          };
        }
      );

      audioStore.play('alert');

      return {
        output:
          `COGNITIVE RECONSTRUCTION COMPLETED.\n` +
          `------------------------------------------------\n` +
          `TARGET: ${place.name.toUpperCase()} RESTORED TO CONSENSUS GRID\n` +
          `STATUS: RECONSTRUCTED (MODIFIED BY ARCHIVE NODE 7-B)\n` +
          `STABILITY DECREASED BY -5% | DUST EXPOSURE INCREASED BY +10\n` +
          `------------------------------------------------\n` +
          `BUNKER_7: The location has returned. But memory is not retrieval. Memory is reconstruction.\n` +
          `The history logs have been rewritten to match your query pattern.\n` +
          `Do not look behind you.`,
        type: 'success',
      };
    },
  });

  // ---------------------------------------------------------------------------
  // /rewrite --file <doc-id>
  // ---------------------------------------------------------------------------

  registry.register({
    name: 'rewrite',
    description:
      'Actively alter document redacted text segments inside the Consensus Window',
    usage: 'rewrite --file <doc-id>',
    aliases: [
      'modify-file',
      'alter-record',
    ],

    handler: async (
      args: string[]
    ): Promise<CommandResult> => {
      const fileIndex =
        args.indexOf('--file');

      if (
        fileIndex === -1 ||
        fileIndex + 1 >= args.length
      ) {
        return {
          output:
            'REWRITE REGISTRY ERROR.\n' +
            'Usage: rewrite --file <doc-id>\n' +
            'Example: rewrite --file doc-ph-001',
          type: 'error',
        };
      }

      const fileId =
        args[fileIndex + 1].trim();

      const documentStore =
        useDocumentStore.getState();

      const progressionStore =
        useProgressionStore.getState();

      const audioStore =
        useAudioStore.getState();

      const atlasStore =
        useAtlasStore.getState();

      const doc =
        documentStore.documents.find(
          (d) => d.id === fileId
        );

      const isSpecialDoc =
        fileId ===
          'doc-arch-1962-001' ||
        fileId ===
          'doc-mwe-4.5hz' ||
        fileId ===
          'doc-esp-001' ||
        fileId ===
          'doc-ph-001';

      if (!doc && !isSpecialDoc) {
        return {
          output:
            `REWRITE REJECTED: Document '${fileId}' not found in the active database registers.`,
          type: 'error',
        };
      }

      // -----------------------------------------------------------------------
      // CONSENSUS WINDOW
      // -----------------------------------------------------------------------

      const dust =
        progressionStore.dustIndex;

      const stability =
        progressionStore.observerStability;

      const minDust = 35;
      const maxDust = 65;

      const minStability = 50;
      const maxStability = 80;

      const isInsideWindow =
        dust >= minDust &&
        dust <= maxDust &&
        stability >= minStability &&
        stability <= maxStability;

      if (!isInsideWindow) {
        return {
          output:
            `REWRITE REJECTED: COGNITIVE RESISTANCE OUTSIDE WINDOW.\n` +
            `------------------------------------------------\n` +
            `ACTIVE DUST: [${dust} / 100] (REQUIRED: ${minDust}-${maxDust})\n` +
            `STABILITY: [${stability}%] (REQUIRED: ${minStability}-${maxStability}%)\n` +
            `------------------------------------------------\n` +
            `Your mind is either too grounded (low Dust) to manipulate the carbon sheets, or too unstable (high Dust / low Stability) to guide the terminal's mechanical keys without corrupting the file's structure. Balance your mind within the Consensus Window before attempting to rewrite reality.`,
          type: 'error',
        };
      }

      /*
       * The window guarantees:
       *
       * Dust >= 35
       * Stability >= 50
       *
       * Therefore both canonical transactions below can succeed.
       *
       * Do not mutate progression until all validation above has passed.
       */
      const spentDust =
        progressionStore.spendDust(
          15
        );

      if (!spentDust) {
        return {
          output:
            'REWRITE REJECTED: Insufficient Dust Index to alter the Consensus Window.',
          type: 'error',
        };
      }

      progressionStore.changeStability(
        -15
      );

      audioStore.play('alert');

      // -----------------------------------------------------------------------
      // EXECUTE DOCUMENT REWRITE
      // -----------------------------------------------------------------------

      let updatedContent = '';
      let payoffMessage = '';

      if (
        fileId === 'doc-ph-001'
      ) {
        updatedContent =
          "The basement of Hospital 126 has been successfully audited and rewritten by INV_RED-7. Liquidator Unit 7's notes now carry a new declassified coordinate block: [30.6000°N, 69.4000°E]. This coordinate is verified. It points directly to the Kola Superdeep Borehole. The welded steel plate is vibrating. The 12,262-meter shaft is listening.";

        payoffMessage =
          `REWRITE SUCCESSFUL: doc-ph-001 ALIGNED.\n` +
          `------------------------------------------------\n` +
          `NEW HISTORICAL RECORD SECURED.\n` +
          `Kola Superdeep Borehole coordinate pylon [30.6000°N, 69.4000°E] declassified!\n` +
          `------------------------------------------------\n` +
          `Your terminal hums with extreme voltage. The Atlas Map is flashing. The Kola Superdeep Borehole marker has stabilized and unlocked inside your Cartographic Atlas!`;

        /*
         * Rewrite payoff unlocks the Atlas marker.
         * This does not alter canonical progression by itself.
         */
        const updatedPlaces =
          atlasStore.places.map(
            (p) => {
              if (
                p.slug ===
                'kola-superdeep-borehole'
              ) {
                return {
                  ...p,
                  status:
                    'verified' as const,
                };
              }

              return p;
            }
          );

        atlasStore.setPlaces(
          updatedPlaces
        );
      } else if (
        fileId ===
        'doc-arch-1962-001'
      ) {
        updatedContent =
          'Archivist Personnel Transfer Record rewritten. INV_RED-7 did not enter the carrel to disappear. They entered the carrel to wait for you. The light beneath the door is the exact halogen-amber color of your active terminal screen. The terminal is a mirror.';

        payoffMessage =
          `REWRITE SUCCESSFUL: doc-arch-1962-001 ALIGNED.\n` +
          `------------------------------------------------\n` +
          `NEW PERSONNEL HISTORICAL RECORD SECURED.\n` +
          `------------------------------------------------\n` +
          `BUNKER_7: The transfer record is locked. It now registers your arrival time as March 15, 1962. Your work has been waiting.`;
      } else {
        updatedContent =
          `This file's text block was manually rewritten and authorized by INV_RED-7 under Consensus Window alignment. Original data purged. Historical consistency established.`;

        payoffMessage =
          `REWRITE SUCCESSFUL: ${fileId} ALIGNED.\n` +
          `------------------------------------------------\n` +
          `Data successfully altered in terminal memory banks. All clients and caches updated.`;
      }

      // -----------------------------------------------------------------------
      // UPDATE DOCUMENT STORE
      // -----------------------------------------------------------------------

      const updatedDocs =
        documentStore.documents.map(
          (d) => {
            if (d.id === fileId) {
              return {
                ...d,
                content: updatedContent,
              };
            }

            return d;
          }
        );

      useDocumentStore.setState({
        documents: updatedDocs,
      });

      return {
        output: payoffMessage,
        type: 'success',
      };
    },
  });
}