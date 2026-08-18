import { create } from 'zustand';
import { DocumentArtifact } from '@/types/documents';
import { useProgressionStore } from './progressionStore';

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

  /*
   * Explicit reading lifecycle.
   *
   * Opening a document means:
   *   discovered
   *
   * Completing the document means:
   *   read + completedReading
   *
   * This keeps those progression events separate.
   */
  completeActiveDocument: () => boolean;

  getDocumentById: (
    id: string,
  ) => DocumentArtifact | undefined;

  addDocument: (
    doc: DocumentArtifact,
  ) => void;

  setZoom: (
    zoom: number,
  ) => void;

  adjustZoom: (
    delta: number,
  ) => void;

  setRotation: (
    rotation: number,
  ) => void;

  toggleUV: () => void;
  toggleAnnotation: () => void;
}

export const useDocumentStore =
  create<DocumentState>(
    (set, get) => ({
      activeDocument: null,
      openDocumentId: null,
      documents: [],

      zoom: 1,
      rotation: 0,

      showUV: false,
      showAnnotation: false,

      // -----------------------------------------------------------------------
      // OPEN DOCUMENT
      //
      // Opening is discovery.
      //
      // It is deliberately NOT "read".
      // -----------------------------------------------------------------------

      openDocument: (
        doc: DocumentArtifact,
      ) => {
        const progression =
          useProgressionStore.getState();

        /*
         * The document itself remains immutable authored corpus data.
         *
         * Discovery is canonical progression state.
         */
        progression.discoverDocument(
          doc.id,
        );

        set({
          activeDocument: doc,
          openDocumentId: doc.id,

          zoom: 1,
          rotation: 0,

          showUV: false,
          showAnnotation: false,
        });
      },

      // -----------------------------------------------------------------------
      // COMPLETE ACTIVE DOCUMENT
      //
      // This is the explicit "I actually read this" transaction.
      //
      // We use the document ID as the reading ID because the existing
      // progression schema already separates:
      //
      //   discoveredDocumentIds
      //   readDocumentIds
      //   completedReadingIds
      //
      // No new progression category is necessary.
      // -----------------------------------------------------------------------

      completeActiveDocument: () => {
        const document =
          get().activeDocument;

        if (!document) {
          return false;
        }

        const progression =
          useProgressionStore.getState();

        /*
         * A document cannot be completed unless it has been discovered.
         *
         * This should normally always be true because openDocument()
         * performs discovery, but the guard makes the transaction safe
         * against stale or malformed UI state.
         */
        if (
          !progression.discoveredDocumentIds.includes(
            document.id,
          )
        ) {
          return false;
        }

        const alreadyCompleted =
          progression.completedReadingIds.includes(
            document.id,
          );

        /*
         * Reading completion is idempotent.
         *
         * Re-reading an already completed document does not award another
         * progression event.
         */
        if (alreadyCompleted) {
          return false;
        }

        progression.markDocumentRead(
          document.id,
        );

        progression.completeReading(
          document.id,
        );

        return true;
      },

      // -----------------------------------------------------------------------
      // CLOSE DOCUMENT
      // -----------------------------------------------------------------------

      closeDocument: () =>
        set({
          activeDocument: null,
          openDocumentId: null,
        }),

      // -----------------------------------------------------------------------
      // LOOKUP
      // -----------------------------------------------------------------------

      getDocumentById: (
        id: string,
      ) =>
        get().documents.find(
          (document) =>
            document.id === id,
        ),

      // -----------------------------------------------------------------------
      // ADD DOCUMENT
      // -----------------------------------------------------------------------

      addDocument: (
        doc: DocumentArtifact,
      ) =>
        set((state) => {
          if (
            state.documents.find(
              (existing) =>
                existing.id === doc.id,
            )
          ) {
            return state;
          }

          return {
            documents: [
              ...state.documents,
              doc,
            ],
          };
        }),

      // -----------------------------------------------------------------------
      // ZOOM
      // -----------------------------------------------------------------------

      setZoom: (
        zoom: number,
      ) =>
        set({
          zoom: Math.max(
            0.5,
            Math.min(3, zoom),
          ),
        }),

      adjustZoom: (
        delta: number,
      ) =>
        set((state) => ({
          zoom: Math.max(
            0.5,
            Math.min(
              3,
              state.zoom + delta,
            ),
          ),
        })),

      // -----------------------------------------------------------------------
      // ROTATION
      // -----------------------------------------------------------------------

      setRotation: (
        rotation: number,
      ) =>
        set({
          rotation,
        }),

      // -----------------------------------------------------------------------
      // UV
      // -----------------------------------------------------------------------

      toggleUV: () =>
        set((state) => ({
          showUV:
            !state.showUV,
        })),

      // -----------------------------------------------------------------------
      // ANNOTATION
      // -----------------------------------------------------------------------

      toggleAnnotation: () =>
        set((state) => ({
          showAnnotation:
            !state.showAnnotation,
        })),
    }),
  );