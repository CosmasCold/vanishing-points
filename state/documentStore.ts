import { create } from 'zustand';
import { DocumentArtifact } from '@/types/documents';

interface DocumentState {
  activeDocument: DocumentArtifact | null;
  openDocumentId: string | null;
  documents: DocumentArtifact[];
  zoom: number;
  rotation: number;
  showUV: boolean;
  showAnnotation: boolean;

  openDocument: (doc: DocumentArtifact) => void;
  closeDocument: () => void;
  getDocumentById: (id: string) => DocumentArtifact | undefined;
  addDocument: (doc: DocumentArtifact) => void;
  setZoom: (zoom: number) => void;
  adjustZoom: (delta: number) => void;
  setRotation: (rotation: number) => void;
  toggleUV: () => void;
  toggleAnnotation: () => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  activeDocument: null,
  openDocumentId: null,
  documents: [],
  zoom: 1,
  rotation: 0,
  showUV: false,
  showAnnotation: false,

  openDocument: (doc) =>
    set({
      activeDocument: doc,
      openDocumentId: doc.id,
      zoom: 1,
      rotation: 0,
      showUV: false,
      showAnnotation: false,
    }),

  closeDocument: () =>
    set({
      activeDocument: null,
      openDocumentId: null,
    }),

  getDocumentById: (id) => get().documents.find((d) => d.id === id),

  addDocument: (doc) =>
    set((s) => {
      if (s.documents.find((d) => d.id === doc.id)) return s;
      return { documents: [...s.documents, doc] };
    }),

  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(3, zoom)) }),

  adjustZoom: (delta) =>
    set((s) => ({
      zoom: Math.max(0.5, Math.min(3, s.zoom + delta)),
    })),

  setRotation: (rotation) => set({ rotation }),

  toggleUV: () => set((s) => ({ showUV: !s.showUV })),

  toggleAnnotation: () => set((s) => ({ showAnnotation: !s.showAnnotation })),
}));