import type { HypothesisState } from './conditions';

/**
 * Canonical persisted progression data.
 *
 * This interface intentionally contains state only. Zustand actions live in
 * state/progressionStore.ts. Keeping the data shape here allows the pure
 * progression evaluator/actions to remain independent of Zustand.
 */
export interface ProgressionState {
  schemaVersion: number;

  dustIndex: number;
  observerStability: number;
  consensus: number;

  sessionCount: number;
  sessionStartedAt: string | null;
  currentCaseId: string | null;
  completedCaseIds: string[];
  sessionWorkDone: number;

  atlasCoverage: number;
  investigatedPlaceIds: string[];

  discoveredEvidenceIds: string[];
  analysedEvidenceIds: string[];

  discoveredDocumentIds: string[];
  readDocumentIds: string[];
  decryptedDocumentIds: string[];
  completedReadingIds: string[];

  listenedMediaIds: string[];
  analysedMediaIds: string[];
  scannedArtifactIds: string[];

  boardConnections: string[];

  hypotheses: Record<string, HypothesisState>;

  knowledge: Record<string, {
    status: 'suspected' | 'known' | 'confirmed' | 'rejected';
    sourceIds: string[];
    discoveredAtSession: number;
  }>;

  contradictions: Record<string, {
    id: string;
    status: 'unresolved' | 'resolved' | 'accepted';
    sourceIds: string[];
    discoveredAtSession: number;
  }>;

  inventoryIds: string[];
  codes: string[];

  narrativeFlags: string[];
  suppressedCaseIds: string[];
  activeAnomalyIds: string[];
  seenAnomalyIds: string[];
  endingId: string | null;
}

export const INITIAL_PROGRESSION_STATE: ProgressionState = {
  schemaVersion: 1,

  dustIndex: 0,
  observerStability: 100,
  consensus: 100,

  sessionCount: 1,
  sessionStartedAt: null,
  currentCaseId: null,
  completedCaseIds: [],
  sessionWorkDone: 0,

  atlasCoverage: 1240,
  investigatedPlaceIds: [],

  discoveredEvidenceIds: [],
  analysedEvidenceIds: [],

  discoveredDocumentIds: [],
  readDocumentIds: [],
  decryptedDocumentIds: [],
  completedReadingIds: [],

  listenedMediaIds: [],
  analysedMediaIds: [],
  scannedArtifactIds: [],

  boardConnections: [],

  hypotheses: {},
  knowledge: {},
  contradictions: {},

  inventoryIds: [],
  codes: [],

  narrativeFlags: [],
  suppressedCaseIds: [],
  activeAnomalyIds: [],
  seenAnomalyIds: [],
  endingId: null,
};