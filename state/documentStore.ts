import { create } from 'zustand';
import { DocumentArtifact, DocumentAnnotation, DocumentFilter } from '@/types/documents';

interface DocumentStore {
  documents: DocumentArtifact[];
  openDocumentId: string | null;
  corruptionIntensity: number;  // Global corruption state (0-1)
  readingProgress: Record<string, number>;  // docId -> scroll percentage
  
  // Actions
  setDocuments: (docs: DocumentArtifact[]) => void;
  openDocument: (id: string) => void;
  closeDocument: () => void;
  addAnnotation: (docId: string, annotation: DocumentAnnotation) => void;
  removeAnnotation: (docId: string, annotationId: string) => void;
  markAsRead: (docId: string) => void;
  setReadingProgress: (docId: string, progress: number) => void;
  increaseCorruption: (amount: number) => void;
  
  // Selectors
  getDocumentById: (id: string) => DocumentArtifact | undefined;
  getFilteredDocuments: (filter: DocumentFilter) => DocumentArtifact[];
  getDocumentsByPlace: (placeSlug: string) => DocumentArtifact[];
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  openDocumentId: null,
  corruptionIntensity: 0,
  readingProgress: {},
  
  setDocuments: (docs) => set({ documents: docs }),
  
  openDocument: (id) => {
    set((state) => ({
      openDocumentId: id,
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, readCount: d.readCount + 1, lastReadAt: new Date().toISOString() } : d
      ),
    }));
  },
  
  closeDocument: () => set({ openDocumentId: null }),
  
  addAnnotation: (docId, annotation) =>
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === docId ? { ...d, annotations: [...d.annotations, annotation] } : d
      ),
    })),
  
  removeAnnotation: (docId, annotationId) =>
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === docId
          ? { ...d, annotations: d.annotations.filter((a) => a.id !== annotationId) }
          : d
      ),
    })),
  
  markAsRead: (docId) =>
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === docId ? { ...d, readCount: d.readCount + 1, lastReadAt: new Date().toISOString() } : d
      ),
    })),
  
  setReadingProgress: (docId, progress) =>
    set((state) => ({
      readingProgress: { ...state.readingProgress, [docId]: progress },
    })),
  
  increaseCorruption: (amount) =>
    set((state) => ({
      corruptionIntensity: Math.min(1, state.corruptionIntensity + amount),
    })),
  
  getDocumentById: (id) => get().documents.find((d) => d.id === id),
  
  getFilteredDocuments: (filter) => {
    return get().documents.filter((d) => {
      if (filter.type && d.type !== filter.type) return false;
      if (filter.condition && d.condition !== filter.condition) return false;
      if (filter.tier !== undefined && d.tier !== filter.tier) return false;
      if (filter.placeSlug && d.placeSlug !== filter.placeSlug) return false;
      if (filter.source && d.source !== filter.source) return false;
      if (filter.search) {
        const q = filter.search.toLowerCase();
        const matches = 
          d.title.toLowerCase().includes(q) ||
          d.content.toLowerCase().includes(q) ||
          d.author?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  },
  
  getDocumentsByPlace: (placeSlug) => get().documents.filter((d) => d.placeSlug === placeSlug),
}));