import { CommandRegistry, CommandResult } from '../commandRegistry';
import { useDocumentStore } from '@/state/documentStore';
import { useUIStore, DUST_THRESHOLDS, STABILITY_THRESHOLDS } from '@/state/uiStore';
import { useAudioStore } from '@/state/audioStore';

export function registerAuditCommands(registry: CommandRegistry) {
  registry.register({
    name: 'audit',
    description: 'Audit heavily redacted declassified document files inside the narrow Observer Consensus Window',
    usage: 'audit --file <doc-id>',
    aliases: ['verify-consensus', 'unredact'],
    handler: async (args: string[]): Promise<CommandResult> => {
      const fileIndex = args.indexOf('--file');

      if (fileIndex === -1 || fileIndex + 1 >= args.length) {
        return {
          output: 'AUDIT REGISTRY ERROR.\nUsage: audit --file <doc-id>\nExample: audit --file doc-arch-1962-001',
          type: 'error',
        };
      }

      const fileId = args[fileIndex + 1].trim();
      const { getDocumentById, openDocument } = useDocumentStore.getState();
      const { status, updateStatus } = useUIStore.getState();
      const { play } = useAudioStore.getState();

      const dust = status.dustIndex;
      const stability = status.observerStability;

      // Ensure the document exists in our declassified archive registers
      const doc = getDocumentById(fileId);
      const isSpecialDoc = fileId === 'doc-arch-1962-001' || fileId === 'doc-mwe-4.5hz' || fileId === 'doc-esp-001';

      if (!doc && !isSpecialDoc) {
        return {
          output: `AUDIT REJECTED: File '${fileId}' not found in the active declassified database registers. Check your references.`,
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
          output: `AUDIT REJECTED: COGNITIVE SENSITIVITY INSUFFICIENT.\n------------------------------------------------\nACTIVE DUST: [${dust} / 100] (REQUIRED: >= ${minDust})\n------------------------------------------------\nYour mind lacks the required particulate exposure. Your eyes see only the solid black ink blocks of the redaction. You must investigate more unverified nodes to absorb enough Dust to perceive the underlying possibilities.`,
          type: 'error',
        };
      }

      if (dust > maxDust) {
        return {
          output: `AUDIT REJECTED: ENTROPIC SIGNAL FLOOD.\n------------------------------------------------\nACTIVE DUST: [${dust} / 100] (MAXIMUM ALLOWED: <= ${maxDust})\n------------------------------------------------\nLocalized reality fluctuations are too volatile. Your high Dust exposure is overwhelming the terminal's copper logic lines, making the text warp, flicker, and blur before it can stabilize. Perform a grounding ritual to sweep away excess dust.`,
          type: 'error',
        };
      }

      if (stability < minStability) {
        return {
          output: `AUDIT REJECTED: OBSERVER COGNITIVE DRIFT.\n------------------------------------------------\nSTABILITY: [${stability}%] (REQUIRED: >= ${minStability}%)\n------------------------------------------------\nYour focus is actively drifting. The letters on your CRT monitor are sliding and rewriting themselves into false, terrifying phrases as you try to read. Execute a mind-calibration command (/restore) before continuing.`,
          type: 'error',
        };
      }

      // Successful Audit: Consensus achieved!
      play('alert');

      // Update global store: Award +15 Stability and slightly reduce Dust by -10 as the investigator anchors consensus
      updateStatus({
        observerStability: Math.min(100, stability + 15),
        dustIndex: Math.max(0, dust - 10),
      });

      // Special visual and textual payoffs depending on targeted file
      if (fileId === 'doc-arch-1962-001') {
        return {
          output: `CONSENSUS REACHED: REDACTIONS DECLASSIFIED.\n------------------------------------------------\nFILE: doc-arch-1962-001 [Personnel record: INV_RED-7]\nAUDIT STATUS: COGNITIVE ALIGNMENT SECURED.\n------------------------------------------------\nRESTORED DATA PASSAGE:\n"Subject has completed 4,211 days of continuous archival service. Previous Assignment: SYSTEM 7-B COCKPIT ASSIGNMENT. Dr. H. Vance notes: Subject does not age in photographs because Subject has entered the terminal loop. The mortar in the basement carrel is 40 years older than the foundation because it grew around the Subject. Subject's handwriting matches the signature on Form 27-B. The signature belongs to the player."\n\nYour monitor flickers. The CRT persistence reveals your own initials burnt into the corner glass. You have been at this walnut desk before.`,
          type: 'success',
        };
      }

      if (fileId === 'doc-mwe-4.5hz') {
        return {
          output: `CONSENSUS REACHED: REDACTIONS DECLASSIFIED.\n------------------------------------------------\nFILE: doc-mwe-4.5hz [Blue Ridge Geodetic survey]\nAUDIT STATUS: COGNITIVE ALIGNMENT SECURED.\n------------------------------------------------\nRESTORED DATA PASSAGE:\n"The Haversine compression between Stull Cemetery and Lebanon (-125.38 km collapse along the solstice axis) represents an active geodetic fold. The three NSA bunkers are vibrating in synchronized 4.5 Hz resonance, acting as structural clamps holding the collapsing space together until the solstice of June 2047. Do not touch the copper ground loops inside the centroid."\n\nThe geodetic triangle on your Evidence Board glows faintly blue under UV.`,
          type: 'success',
        };
      }

      // Default generic declassification
      const docTitle = doc?.title || 'Classified Record';
      const docExcerpt = doc?.content.substring(0, 200) || 'Archival logs synchronized.';

      return {
        output: `CONSENSUS REACHED: REDACTIONS DECLASSIFIED.\n------------------------------------------------\nFILE: ${fileId} [${docTitle}]\nAUDIT STATUS: COGNITIVE ALIGNMENT SECURED.\n------------------------------------------------\nRESTORED DATA:\n"${docExcerpt}..."\n\nAll black redaction blocks inside the document have dissolved into clear, verified typewriter carbon.`,
        type: 'success',
      };
    },
  });
}
