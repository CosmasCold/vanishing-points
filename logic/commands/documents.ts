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

      // In a real implementation, fetch from a document registry or evidence store
      // For now, we construct a placeholder
      const doc: DocumentArtifact = {
        id,
        type: 'typed_report',
        title: `Document ${id}`,
        content: 'Document content would be loaded from the archive database.\nUse the graphical viewer for full inspection.',
        date: 'Unknown',
        author: 'Unknown',
        source: 'Archive',
        condition: 'worn',
        paperAge: 25,
        hasFoldMarks: true,
        hasCoffeeRing: false,
        hasTornCorner: false,
        hasAnnotation: false,
        collectedBy: 'Unknown',
        collectedDate: 'Unknown',
        verificationStatus: 'verified',
        relatedEvidenceIds: [],
        relatedPlaceSlugs: [],
      };

      useDocumentStore.getState().openDocument(doc);
      return {
        output: `Loading document ${id}...\nPaper condition: ${doc.condition}\nAge index: ${doc.paperAge}%\nUse mouse wheel to zoom. Click UV to check for hidden ink.`,
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