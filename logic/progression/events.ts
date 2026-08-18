export type ProgressionEvent =
  | {
      type: 'PLACE_INVESTIGATED';
      placeId: string;
    }
  | {
      type: 'DOCUMENT_DISCOVERED';
      documentId: string;
    }
  | {
      type: 'DOCUMENT_READ';
      documentId: string;
    }
  | {
      type: 'DOCUMENT_DECRYPTED';
      documentId: string;
    }
  | {
      type: 'READING_COMPLETED';
      readingId: string;
    }
  | {
      type: 'MEDIA_LISTENED';
      mediaId: string;
    }
  | {
      type: 'ARTIFACT_SCANNED';
      artifactId: string;
    }
  | {
      type: 'BOARD_CONNECTION_ADDED';
      connection: string;
    }
  | {
      type: 'HYPOTHESIS_CHANGED';
      hypothesisId: string;
    }
  | {
      type: 'DUST_CHANGED';
      delta: number;
    }
  | {
      type: 'STABILITY_CHANGED';
      delta: number;
    }
  | {
      type: 'SESSION_WORK_CHANGED';
      delta: number;
    };