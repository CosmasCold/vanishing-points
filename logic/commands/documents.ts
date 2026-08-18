import { CommandRegistry } from '../commandRegistry';
import { useDocumentStore } from '@/state/documentStore';
import { useProgressionStore } from '@/state/progressionStore';
import { DocumentArtifact } from '@/types/documents';

export function registerDocumentCommands(
  registry: CommandRegistry,
) {
  registry.register({
    name: 'examine',
    description: 'Examine a document by ID',
    usage: 'examine <document-id>',

    handler: (args: string[]) => {
      const id = args[0];

      if (!id) {
        return {
          output:
            'Usage: examine <document-id>',
          type: 'error' as const,
        };
      }

      const progression =
        useProgressionStore.getState();

      /*
       * Canonical progression gate.
       *
       * Personnel File 447 is a Session 3 provenance
       * artifact. The graphical Archive hides it until
       * progression discovers it, but terminal commands
       * must obey the same gate.
       *
       * This prevents:
       *
       *   /examine personnel-447
       *
       * from bypassing the Session 3 narrative milestone.
       */
      if (
        id === 'personnel-447' &&
        !progression.discoveredDocumentIds.includes(
          'personnel-447',
        )
      ) {
        return {
          output:
            'ACCESS DENIED.\n' +
            '------------------------------------------------\n' +
            'DOCUMENT: personnel-447\n' +
            'STATUS: NOT YET INDEXED\n' +
            'REQUIRED: SESSION 3 PROVENANCE EVENT\n' +
            '------------------------------------------------\n' +
            'BUNKER_7: The Archive does not recognize that record as available to this session.',
          type: 'warning' as const,
        };
      }

      /*
       * Existing generic document behavior is retained for
       * terminal compatibility.
       *
       * Canonical discovery/read state is handled centrally
       * by useDocumentStore.openDocument().
       */
      const doc: DocumentArtifact = {
        id,
        slug: id,
        title: `Document ${id}`,
        type: 'typed_report',
        content:
          'Document content would be loaded from the archive database.\n' +
          'Use the graphical viewer for full inspection.',
        date: 'Unknown',
        author: 'Unknown',
        source: 'Archive',
        condition: 'aged',
        tier: 0,
        placeSlug: 'unknown',
        pages: 1,
        paperType: 'bond',
        inkType: 'typewriter',
        corruptionLevel: 0,
        recoveredAt:
          new Date().toISOString(),
        recoveredBy: 'system',
        verificationStatus: 'verified',
        relatedDocuments: [],
        dustReward: 1,
        readCount: 0,
        annotations: [],
      };

      useDocumentStore
        .getState()
        .openDocument(doc);

      return {
        output:
          `Loading document ${id}...\n` +
          `Condition: ${doc.condition}\n` +
          'Use mouse wheel to zoom. Click UV to check for hidden ink.',
        type: 'success' as const,
      };
    },
  });

  registry.register({
    name: 'close-doc',
    description: 'Close active document viewer',
    usage: 'close-doc',

    handler: () => {
      useDocumentStore
        .getState()
        .closeDocument();

      return {
        output:
          'Document viewer closed.',
        type: 'success' as const,
      };
    },
  });
}