import { CommandRegistry } from '../commandRegistry';
import { useDocumentStore } from '@/state/documentStore';
import { DocumentArtifact } from '@/types/documents';

export function registerDocumentCommands(registry: CommandRegistry) {
  registry.register({
    name: 'examine',
    description: 'Examine a document by ID',
    usage: 'examine <document-id>',
    handler: (args: string[]) => {
      const id = args[0];
      if (!id) return { output: 'Usage: examine <document-id>', type: 'error' as const };

      const doc: DocumentArtifact = {
        id,
        slug: id,
        title: `Document ${id}`,
        type: 'typed_report',
        content: 'Document content would be loaded from the archive database.\nUse the graphical viewer for full inspection.',
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
        recoveredAt: new Date().toISOString(),
        recoveredBy: 'system',
        verificationStatus: 'verified',
        relatedDocuments: [],
        dustReward: 1,
        readCount: 0,
        annotations: [],
      };

      useDocumentStore.getState().openDocument(doc);
      return {
        output: `Loading document ${id}...\nCondition: ${doc.condition}\nUse mouse wheel to zoom. Click UV to check for hidden ink.`,
        type: 'success' as const,
      };
    },
  });

  registry.register({
    name: 'close-doc',
    description: 'Close active document viewer',
    usage: 'close-doc',
    handler: () => {
      useDocumentStore.getState().closeDocument();
      return { output: 'Document viewer closed.', type: 'success' as const };
    },
  });
}