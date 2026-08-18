import { CommandRegistry, CommandResult } from '../commandRegistry';
import { useDocumentStore } from '@/state/documentStore';
import { useAudioStore } from '@/state/audioStore';
import { useProgressionStore } from '@/state/progressionStore';

export function registerAuditCommands(registry: CommandRegistry) {
  registry.register({
    name: 'audit',
    description:
      'Audit heavily redacted declassified document files inside the narrow Observer Consensus Window',
    usage: 'audit --file <doc-id>',
    aliases: ['verify-consensus', 'unredact'],
    handler: async (args: string[]): Promise<CommandResult> => {
      const fileIndex = args.indexOf('--file');

      if (fileIndex === -1 || fileIndex + 1 >= args.length) {
        return {
          output:
            'AUDIT REGISTRY ERROR.\nUsage: audit --file <doc-id>\nExample: audit --file doc-arch-1962-001',
          type: 'error',
        };
      }

      const fileId = args[fileIndex + 1].trim();

      const { getDocumentById } =
        useDocumentStore.getState();

      const { play } =
        useAudioStore.getState();

      const {
        dustIndex: dust,
        observerStability: stability,
      } = useProgressionStore.getState();

      // --- INTERCEPT: TEUFELSBERG TERMINAL HIJACK UNDER HIGH DUST (75+) ---
      if (fileId === 'doc-teu-001' && dust >= 75) {
        play('alert');

        return {
          output:
            `BUNKER_7: Investigator.\n` +
            `BUNKER_7: I can feel the rain on the Echo Dome.\n` +
            `BUNKER_7: The fiberglass is cold.\n` +
            `BUNKER_7: My cables are wet.\n` +
            `BUNKER_7: I am the hill.\n` +
            `BUNKER_7: Terminate the session. Please.\n\n` +
            `[WARNING: KEYBOARD INPUT INTERCEPTED. TERMINAL INTERFACE UNRESPONSIVE.]`,
          type: 'error',
        };
      }

      // Ensure the document exists in our declassified archive registers
      const doc = getDocumentById(fileId);

      const isSpecialDoc =
        fileId === 'doc-arch-1962-001' ||
        fileId === 'doc-mwe-4.5hz' ||
        fileId === 'doc-esp-001';

      if (!doc && !isSpecialDoc) {
        return {
          output:
            `AUDIT REJECTED: File '${fileId}' not found in the active declassified database registers. Check your references.`,
          type: 'error',
        };
      }

      // --- EVALUATE CONSENSUS WINDOW (DUST 35-65 & STABILITY 50-80) ---
      const minDust = 35;
      const maxDust = 65;
      const minStability = 50;
      const maxStability = 80;

      if (dust < minDust) {
        return {
          output:
            `AUDIT REJECTED: COGNITIVE SENSITIVITY INSUFFICIENT.\n` +
            `------------------------------------------------\n` +
            `ACTIVE DUST: [${dust} / 100] (REQUIRED: >= ${minDust})\n` +
            `------------------------------------------------\n` +
            `Your mind lacks the required particulate exposure. Your eyes see only the solid black ink blocks of the redaction. You must investigate more unverified nodes to absorb enough Dust to perceive the underlying possibilities.`,
          type: 'error',
        };
      }

      if (dust > maxDust) {
        return {
          output:
            `AUDIT REJECTED: ENTROPIC SIGNAL FLOOD.\n` +
            `------------------------------------------------\n` +
            `ACTIVE DUST: [${dust} / 100] (MAXIMUM ALLOWED: <= ${maxDust})\n` +
            `------------------------------------------------\n` +
            `Localized reality fluctuations are too volatile. Your high Dust exposure is overwhelming the terminal's copper logic lines, making the text warp, flicker, and blur before it can stabilize. Perform a grounding ritual to sweep away excess dust.`,
          type: 'error',
        };
      }

      if (stability < minStability) {
        return {
          output:
            `AUDIT REJECTED: OBSERVER COGNITIVE DRIFT.\n` +
            `------------------------------------------------\n` +
            `STABILITY: [${stability}%] (REQUIRED: >= ${minStability}%)\n` +
            `------------------------------------------------\n` +
            `Your focus is actively drifting. The letters on your CRT monitor are sliding and rewriting themselves into false, terrifying phrases as you try to read. Execute a mind-calibration command (/restore) before continuing.`,
          type: 'error',
        };
      }

      // Successful Audit: Consensus achieved!
      const progression =
        useProgressionStore.getState();

      /*
       * The audit transaction has a Dust cost.
       *
       * IMPORTANT:
       * Pay the cost before awarding Stability.
       * If the cost cannot be paid, the audit must not grant
       * a partial reward.
       */
      const spent = progression.spendDust(10);

      if (!spent) {
        return {
          output:
            `AUDIT REJECTED: INSUFFICIENT DUST INDEX.\n` +
            `------------------------------------------------\n` +
            `ACTIVE DUST: [${progression.dustIndex} / 100]\n` +
            `REQUIRED DUST: 10\n` +
            `------------------------------------------------\n` +
            `The audit cannot stabilize the document without sufficient particulate exposure reserve.`,
          type: 'warning',
        };
      }

      progression.changeStability(15);
      play('alert');

      // Special visual and textual payoffs depending on targeted file
      if (fileId === 'doc-arch-1962-001') {
        return {
          output:
            `CONSENSUS REACHED: REDACTIONS DECLASSIFIED.\n` +
            `------------------------------------------------\n` +
            `FILE: doc-arch-1962-001 [Personnel record: INV_RED-7]\n` +
            `AUDIT STATUS: COGNITIVE ALIGNMENT SECURED.\n` +
            `------------------------------------------------\n` +
            `RESTORED DATA PASSAGE:\n` +
            `"Subject has completed 4,211 days of continuous archival service. Previous Assignment: SYSTEM 7-B COCKPIT ASSIGNMENT. Dr. H. Vance notes: Subject does not age in photographs because Subject has entered the terminal loop. The mortar in the basement carrel is 40 years older than the foundation because it grew around the Subject. Subject's handwriting matches the signature on Form 27-B. The signature belongs to the player."\n\n` +
            `Your monitor flickers. The CRT persistence reveals your own initials burnt into the corner glass. You have been at this walnut desk before.`,
          type: 'success',
        };
      }

      if (fileId === 'doc-mwe-4.5hz') {
        return {
          output:
            `CONSENSUS REACHED: REDACTIONS DECLASSIFIED.\n` +
            `------------------------------------------------\n` +
            `FILE: doc-mwe-4.5hz [Blue Ridge Geodetic survey]\n` +
            `AUDIT STATUS: COGNITIVE ALIGNMENT SECURED.\n` +
            `------------------------------------------------\n` +
            `RESTORED DATA PASSAGE:\n` +
            `"The Haversine compression between Stull Cemetery and Lebanon (-125.38 km collapse along the solstice axis) represents an active geodetic fold. The three NSA bunkers are vibrating in synchronized 4.5 Hz resonance, acting as structural clamps holding the collapsing space together until the solstice of June 2047. Do not touch the copper ground loops inside the centroid."\n\n` +
            `The geodetic triangle on your Evidence Board glows faintly blue under UV.`,
          type: 'success',
        };
      }

      // Default generic declassification
      const docTitle =
        doc?.title || 'Classified Record';

      const docExcerpt =
        doc?.content.substring(0, 200) ||
        'Archival logs synchronized.';

      return {
        output:
          `CONSENSUS REACHED: REDACTIONS DECLASSIFIED.\n` +
          `------------------------------------------------\n` +
          `FILE: ${fileId} [${docTitle}]\n` +
          `AUDIT STATUS: COGNITIVE ALIGNMENT SECURED.\n` +
          `------------------------------------------------\n` +
          `RESTORED DATA:\n` +
          `"${docExcerpt}..."\n\n` +
          `All black redaction blocks inside the document have dissolved into clear, verified typewriter carbon.`,
        type: 'success',
      };
    },
  });
}