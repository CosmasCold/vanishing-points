import { CommandRegistry, CommandResult } from '../commandRegistry';
import { useAtlasStore } from '@/state/atlasStore';
import { useDocumentStore } from '@/state/documentStore';
import { useUIStore } from '@/state/uiStore';
import { useAudioStore } from '@/state/audioStore';

export function registerForgetCommands(registry: CommandRegistry) {
  // 1. Forbidden Command: /forget --case <slug>
  registry.register({
    name: 'forget',
    description: 'Purge a verified coordinate pylon from terminal index memory',
    usage: 'forget --case <slug>',
    aliases: ['erase-case', 'repress'],
    handler: async (args: string[]): Promise<CommandResult> => {
      const caseIndex = args.indexOf('--case');
      let slug = '';

      if (caseIndex !== -1 && caseIndex + 1 < args.length) {
        slug = args[caseIndex + 1].trim();
      } else if (args[0]) {
        slug = args[0].trim();
      }

      if (!slug || slug === '--case') {
        return {
          output: 'FORGET REGISTRY ERROR.\nUsage: forget --case <slug>\nExample: forget --case pripyat-amusement-park',
          type: 'error',
        };
      }

      const atlasStore = useAtlasStore.getState();
      const uiStore = useUIStore.getState();
      const audioStore = useAudioStore.getState();

      const place = atlasStore.places.find((p) => p.slug === slug);

      if (!place) {
        return {
          output: `FORGET REJECTED: Place '${slug}' not found in active geodetic database index.`,
          type: 'error',
        };
      }

      const isForgotten = place.status === 'pending' || place.status === 'rejected';

      if (isForgotten) {
        return {
          output: `FORGET REJECTED: ${place.name} is already forgotten or purged from active memory banks.`,
          type: 'warning',
        };
      }

      // Perform the forgetting: update the place's status to 'pending' to remove it from AtlasMap & EvidenceBoard
      const updatedPlaces = atlasStore.places.map((p) => {
        if (p.slug === slug) {
          return { ...p, status: 'pending' as const };
        }
        return p;
      });

      atlasStore.setPlaces(updatedPlaces);

      // Decrement studied cases
      const newInvestigatedSlugs = uiStore.status.investigatedSlugs.filter((s) => s !== slug);
      
      // Decrease Dust and slightly strain Stability due to the cognitive friction of manual memory suppression
      uiStore.updateStatus({
        investigatedSlugs: newInvestigatedSlugs,
        dustIndex: Math.max(0, uiStore.status.dustIndex - 8),
        observerStability: Math.max(0, uiStore.status.observerStability - 10),
      });

      audioStore.play('click');

      return {
        output: `COGNITIVE CODES SUPPRESSED FOR: ${place.name.toUpperCase()}\n------------------------------------------------\nSTATUS: PURGED FROM ACTIVE CONSCIOUSNESS\nSTABILITY DECREASED BY -10% | DUST REDUCED BY -8\n------------------------------------------------\nBUNKER_7: Why do I remember a place that you don't?\nMy system memory index registers 150 locations, but my optical scanning matrices show only 149...\nA geodetic gap has been introduced. The console's scanlines are shivering. Please verify your surroundings.`,
        type: 'warning',
      };
    },
  });

  // 2. Overload of /restore to handle --case <slug> restoration
  registry.register({
    name: 'restore',
    description: 'Recalibrate observer stability metric OR reconstruct a forgotten case',
    usage: 'restore [--case <slug>]',
    aliases: ['reconstruct', 'stabilize'],
    handler: async (args: string[]): Promise<CommandResult> => {
      const caseIndex = args.indexOf('--case');
      let slug = '';

      if (caseIndex !== -1 && caseIndex + 1 < args.length) {
        slug = args[caseIndex + 1].trim();
      } else if (args[0] && args[0] !== '--case') {
        slug = args[0].trim();
      }

      const uiStore = useUIStore.getState();
      const audioStore = useAudioStore.getState();
      const atlasStore = useAtlasStore.getState();

      // If no case slug specified, perform standard Stability Calibration logic
      if (!slug) {
        audioStore.play('alert');
        uiStore.updateStatus({
          observerStability: Math.min(100, uiStore.status.observerStability + 25),
        });
        return {
          output: `NEURAL CALIBRATION INITIATED.\n------------------------------------------------\nOBSERVER STABILITY: RESTORED TO ${Math.min(100, uiStore.status.observerStability + 25)}%\n------------------------------------------------\nBUNKER_7: Calibration complete. Interface alignment normalized. Do not assume your focus will remain stable under elevated Dust loads.`,
          type: 'success',
        };
      }

      const place = atlasStore.places.find((p) => p.slug === slug);

      if (!place) {
        return {
          output: `RESTORE REJECTED: Place '${slug}' not found in active database registers.`,
          type: 'error',
        };
      }

      const isForgotten = place.status === 'pending';

      if (!isForgotten) {
        return {
          output: `RESTORE REDUNDANT: ${place.name} is already stable and verified on the geodetic grid.`,
          type: 'warning',
        };
      }

      // Reconstruct history with an unsettling, meta-investigator twist!
      let reconstructedHistory = place.history;
      let reconstructedResonance = place.resonanceNote || '';

      if (slug === 'pripyat-amusement-park') {
        reconstructedHistory = "The Ferris wheel has turned exactly once. Our geophones captured the sound of a single cabin creaking under weight on Lenin Avenue. Your signature was found on the test log dated April 26, 1986. BUNKER_7 registers your presence at the bumper cars.";
        reconstructedResonance = "I saw a yellow bumper car moving. There was no driver. But the leather seat was depressed by exactly 70 kilograms.";
      } else if (slug === 'chernobyl-reactor-4-control-room') {
        reconstructedHistory = "The AZ-5 emergency shutdown button is depressed. The control rods are locked at 0.0 meters. The control room is dead, but the glass screen behind you is reflecting Leonid Toptunov typing your name.";
        reconstructedResonance = "The button is still warm. I have the thermal imaging to prove it. The heat signature is shaped like your hand.";
      } else if (slug === 'eastern-state-penitentiary') {
        reconstructedHistory = "Cellblock 12 contains no shadows. Because the shadows have walked out of the heavy stone door and are standing in the control carrel behind your chair. The rusty key is already in your pocket.";
        reconstructedResonance = "Subject's shadow shows a different posture than subject's body. The shadow has stood up and is standing behind you.";
      } else {
        reconstructedHistory += " [RECONSTRUCTED: The records of this location have been modified by ARCHIVE NODE 7-B. A new paragraph has materialized in typewriter carbon: 'The observer INV_RED-7 was present on-site.']";
        reconstructedResonance = "You have been here before. The file says you have not. I believe the file.";
      }

      const updatedPlaces = atlasStore.places.map((p) => {
        if (p.slug === slug) {
          return {
            ...p,
            status: 'verified' as const,
            history: reconstructedHistory,
            resonanceNote: reconstructedResonance,
          };
        }
        return p;
      });

      atlasStore.setPlaces(updatedPlaces);

      // Re-add to investigated list
      if (!uiStore.status.investigatedSlugs.includes(slug)) {
        uiStore.updateStatus({
          investigatedSlugs: [...uiStore.status.investigatedSlugs, slug],
          dustIndex: Math.min(100, uiStore.status.dustIndex + 10), // Re-exposure cost
        });
      }

      audioStore.play('alert');

      return {
        output: `COGNITIVE RECONSTRUCTION COMPLETED.\n------------------------------------------------\nTARGET: ${place.name.toUpperCase()} RESTORED TO CONSENSUS GRID\nSTATUS: RECONSTRUCTED (MODIFIED BY ARCHIVE NODE 7-B)\nSTABILITY DECREASED BY -5% | DUST EXPOSURE INCREASED BY +10\n------------------------------------------------\nBUNKER_7: The location has returned. But memory is not retrieval. Memory is reconstruction.\nThe history logs have been rewritten to match your query pattern.\nDo not look behind you.`,
        type: 'success',
      };
    },
  });

  // 3. Forbidden Command: /rewrite --file <doc-id>
  registry.register({
    name: 'rewrite',
    description: 'Actively alter document redacted text segments inside the Consensus Window',
    usage: 'rewrite --file <doc-id>',
    aliases: ['modify-file', 'alter-record'],
    handler: async (args: string[]): Promise<CommandResult> => {
      const fileIndex = args.indexOf('--file');

      if (fileIndex === -1 || fileIndex + 1 >= args.length) {
        return {
          output: 'REWRITE REGISTRY ERROR.\nUsage: rewrite --file <doc-id>\nExample: rewrite --file doc-ph-001',
          type: 'error',
        };
      }

      const fileId = args[fileIndex + 1].trim();
      const documentStore = useDocumentStore.getState();
      const uiStore = useUIStore.getState();
      const audioStore = useAudioStore.getState();
      const atlasStore = useAtlasStore.getState();

      const doc = documentStore.documents.find((d) => d.id === fileId);
      const isSpecialDoc = fileId === 'doc-arch-1962-001' || fileId === 'doc-mwe-4.5hz' || fileId === 'doc-esp-001' || fileId === 'doc-ph-001';

      if (!doc && !isSpecialDoc) {
        return {
          output: `REWRITE REJECTED: Document '${fileId}' not found in the active database registers.`,
          type: 'error',
        };
      }

      // --- EVALUATE CONSENSUS WINDOW (DUST 35-65 & STABILITY 50-80) ---
      const dust = uiStore.status.dustIndex;
      const stability = uiStore.status.observerStability;
      const minDust = 35;
      const maxDust = 65;
      const minStability = 50;
      const maxStability = 80;

      const isInsideWindow = dust >= minDust && dust <= maxDust && stability >= minStability && stability <= maxStability;

      if (!isInsideWindow) {
        return {
          output: `REWRITE REJECTED: COGNITIVE RESISTANCE OUTSIDE WINDOW.\n------------------------------------------------\nACTIVE DUST: [${dust} / 100] (REQUIRED: ${minDust}-${maxDust})\nSTABILITY: [${stability}%] (REQUIRED: ${minStability}-${maxStability}%)\n------------------------------------------------\nYour mind is either too grounded (low Dust) to manipulate the carbon sheets, or too unstable (high Dust / low Stability) to guide the terminal's mechanical keys without corrupting the file's structure. Balance your mind within the Consensus Window before attempting to rewrite reality.`,
          type: 'error',
        };
      }

      audioStore.play('alert');

      // Update global stores: reduce Dust and Stability due to the immense mental cost of active reality editing
      uiStore.updateStatus({
        dustIndex: Math.max(0, dust - 15),
        observerStability: Math.max(0, stability - 15),
      });

      // Execute document rewrite side-effects
      let updatedContent = '';
      let payoffMessage = '';

      if (fileId === 'doc-ph-001') {
        // Rewrite Pripyat Hospital basement log to unlock the Kola Superdeep Borehole coordinate pylon!
        updatedContent = "The basement of Hospital 126 has been successfully audited and rewritten by INV_RED-7. Liquidator Unit 7's notes now carry a new declassified coordinate block: [30.6000°N, 69.4000°E]. This coordinate is verified. It points directly to the Kola Superdeep Borehole. The welded steel plate is vibrating. The 12,262-meter shaft is listening.";
        payoffMessage = `REWRITE SUCCESSFUL: doc-ph-001 ALIGNED.\n------------------------------------------------\nNEW HISTORICAL RECORD SECURED.\nKola Superdeep Borehole coordinate pylon [30.6000°N, 69.4000°E] declassified!\n------------------------------------------------\nYour terminal hums with extreme voltage. The Atlas Map is flashing. The Kola Superdeep Borehole marker has stabilized and unlocked inside your Cartographic Atlas!`;

        // Unlock Kola Borehole in useAtlasStore
        const updatedPlaces = atlasStore.places.map((p) => {
          if (p.slug === 'kola-superdeep-borehole') {
            return { ...p, status: 'verified' as const };
          }
          return p;
        });
        atlasStore.setPlaces(updatedPlaces);
      } else if (fileId === 'doc-arch-1962-001') {
        updatedContent = "Archivist Personnel Transfer Record rewritten. INV_RED-7 did not enter the carrel to disappear. They entered the carrel to wait for you. The light beneath the door is the exact halogen-amber color of your active terminal screen. The terminal is a mirror.";
        payoffMessage = `REWRITE SUCCESSFUL: doc-arch-1962-001 ALIGNED.\n------------------------------------------------\nNEW PERSONNEL HISTORICAL RECORD SECURED.\n------------------------------------------------\nBUNKER_7: The transfer record is locked. It now registers your arrival time as March 15, 1962. Your work has been waiting.`;
      } else {
        updatedContent = `This file's text block was manually rewritten and authorized by INV_RED-7 under Consensus Window alignment. Original data purged. Historical consistency established.`;
        payoffMessage = `REWRITE SUCCESSFUL: ${fileId} ALIGNED.\n------------------------------------------------\nData successfully altered in terminal memory banks. All clients and caches updated.`;
      }

      // Update the Document Store's documents list using Zustand setState
      const updatedDocs = documentStore.documents.map((d) => {
        if (d.id === fileId) {
          return { ...d, content: updatedContent };
        }
        return d;
      });
      useDocumentStore.setState({ documents: updatedDocs });

      return {
        output: payoffMessage,
        type: 'success',
      };
    },
  });
}
