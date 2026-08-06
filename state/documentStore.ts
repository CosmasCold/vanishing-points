import { create } from 'zustand';
import { DocumentArtifact } from '@/types/documents';

interface DocumentState {
  activeDocument: DocumentArtifact | null;
  zoom: number;
  rotation: number;
  showUV: boolean;              // Ultraviolet light mode for hidden ink
  showAnnotation: boolean;
  
  openDocument: (doc: DocumentArtifact) => void;
  closeDocument: () => void;
  setZoom: (zoom: number) => void;
  adjustZoom: (delta: number) => void;
  setRotation: (rotation: number) => void;
  toggleUV: () => void;
  toggleAnnotation: () => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  activeDocument: null,
  zoom: 1,
  rotation: 0,
  showUV: false,
  showAnnotation: false,

  openDocument: (doc) => set({
    activeDocument: doc,
    zoom: 1,
    rotation: 0,
    showUV: false,
    showAnnotation: false,
  }),

  closeDocument: () => set({ activeDocument: null }),

  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(3, zoom)) }),

  adjustZoom: (delta) => set((s) => ({
    zoom: Math.max(0.5, Math.min(3, s.zoom + delta)),
  })),

  setRotation: (rotation) => set({ rotation }),

  toggleUV: () => set((s) => ({ showUV: !s.showUV })),

  toggleAnnotation: () => set((s) => ({ showAnnotation: !s.showAnnotation })),
}));