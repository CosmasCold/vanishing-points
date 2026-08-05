import { CommandRegistry } from '../commandRegistry';
import { useDocumentStore } from '@/state/documentStore';
import { useUIStore } from '@/state/uiStore';
import { SEED_DOCUMENTS } from '@/data/seedDocuments';

export function registerDocumentCommands(registry: CommandRegistry) {
  registry.register({
    name: 'read',
    description: 'Open a document by ID',
    usage: 'read <document-id>',
    handler: (args: string[]) => {
      const id = args[0];
      if (!id) return { output: 'Usage: read <document-id>', type: 'error' as const };

      const { documents, openDocument } = useDocumentStore.getState();
      const doc = documents.find((d) => d.id === id || d.slug === id);
      if (!doc) return { output: `Document not found: ${id}`, type: 'error' as const };

      useUIStore.getState().setActiveModule('documents');
      openDocument(doc.id);
      return {
        output: `Opening document: ${doc.title}\nCondition: ${doc.condition}\nCorruption: ${(doc.corruptionLevel * 100).toFixed(0)}%`,
        type: 'success' as const,
      };
    },
  });

  registry.register({
    name: 'documents',
    description: 'List available documents',
    usage: 'documents [filter]',
    handler: (args: string[]) => {
      const { documents } = useDocumentStore.getState();
      const filter = args[0];
      const filtered = filter
        ? documents.filter((d) => d.type.includes(filter) || d.placeSlug.includes(filter))
        : documents;

      const list = filtered.map((d) => `[${d.id}] ${d.title} (${d.condition})`).join('\n');
      return {
        output: `Available documents: ${filtered.length}\n${list}`,
        type: 'info' as const,
      };
    },
  });

  registry.register({
    name: 'archive',
    description: 'Show archive statistics',
    usage: 'archive',
    handler: () => {
      const { documents } = useDocumentStore.getState();
      const stats = {
        total: documents.length,
        corrupted: documents.filter((d) => d.corruptionLevel > 0).length,
        unread: documents.filter((d) => d.readCount === 0).length,
        totalDust: documents.reduce((a, d) => a + d.dustReward, 0),
      };
      return {
        output: `Archive Statistics:\nTotal documents: ${stats.total}\nCorrupted: ${stats.corrupted}\nUnread: ${stats.unread}\nTotal dust value: ${stats.totalDust}`,
        type: 'info' as const,
      };
    },
  });

  registry.register({
    name: 'seed-docs',
    description: 'Seed document archive with initial collection',
    usage: 'seed-docs',
    handler: () => {
      useDocumentStore.getState().setDocuments(SEED_DOCUMENTS);
      return {
        output: `Document archive seeded.\n${SEED_DOCUMENTS.length} artifacts loaded.\nTier distribution: T0=${SEED_DOCUMENTS.filter(d=>d.tier===0).length}, T1=${SEED_DOCUMENTS.filter(d=>d.tier===1).length}, T2=${SEED_DOCUMENTS.filter(d=>d.tier===2).length}`,
        type: 'success' as const,
      };
    },
  });
}