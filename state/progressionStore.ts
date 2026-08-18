import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HypothesisState } from '@/types/conditions';

export const PROGRESSION_SCHEMA_VERSION = 2;

export type KnowledgeStatus =
  | 'suspected'
  | 'known'
  | 'confirmed'
  | 'rejected';

export interface KnowledgeRecord {
  status: KnowledgeStatus;
  sourceIds: string[];
  discoveredAtSession: number;
}

export interface ContradictionRecord {
  id: string;
  status: 'unresolved' | 'resolved' | 'accepted';
  sourceIds: string[];
  discoveredAtSession: number;
}

/**
 * Canonicalize a board connection into a stable, undirected key.
 *
 * Accepted forms:
 *   normalizeBoardConnection("a", "b")
 *   normalizeBoardConnection("a::b")
 *   normalizeBoardConnection("place:a::place:b")
 *
 * Canonical output:
 *   place:a::place:b
 *
 * Ordering is lexical so A -> B and B -> A represent one relationship.
 */
export function normalizeBoardConnection(
  source: string,
  target?: string,
): string {
  const normalizePlace = (value: string): string =>
    value
      .trim()
      .toLowerCase()
      .replace(/^place:/, "")
      .normalize("NFKD")
      .replace(/[\\u0300-\\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  let left = source;
  let right = target ?? "";

  if (!target) {
    const separatorIndex = source.indexOf("::");

    if (separatorIndex >= 0) {
      left = source.slice(0, separatorIndex);
      right = source.slice(separatorIndex + 2);
    } else {
      const arrowIndex = source.indexOf("->");

      if (arrowIndex >= 0) {
        left = source.slice(0, arrowIndex);
        right = source.slice(arrowIndex + 2);
      }
    }
  }

  const normalizedLeft = normalizePlace(left);
  const normalizedRight = normalizePlace(right);

  if (!normalizedLeft || !normalizedRight) {
    return "";
  }

  const values = [
    `place:${normalizedLeft}`,
    `place:${normalizedRight}`,
  ].sort();

  return values.join("::");
}

export interface ProgressionState {
  schemaVersion: number;

  // Observer state. Consensus is now a first-class progression metric.
  dustIndex: number;
  observerStability: number;
  consensus: number;

  // Session state.
  sessionCount: number;
  sessionStartedAt: string | null;
  currentCaseId: string | null;
  completedCaseIds: string[];
  sessionWorkDone: number;

  // Atlas / investigation.
  atlasCoverage: number;
  investigatedPlaceIds: string[];

  // Evidence.
  discoveredEvidenceIds: string[];
  analysedEvidenceIds: string[];

  // Archive.
  discoveredDocumentIds: string[];
  readDocumentIds: string[];
  decryptedDocumentIds: string[];
  completedReadingIds: string[];

  // Media / artifacts.
  listenedMediaIds: string[];
  analysedMediaIds: string[];
  scannedArtifactIds: string[];

  // Evidence Board.
  boardConnections: string[];

  // Interpretation.
  hypotheses: Record<string, HypothesisState>;
  hypothesisEvidence: Record<string, string[]>;
  knowledge: Record<string, KnowledgeRecord>;
  contradictions: Record<string, ContradictionRecord>;

  // Persistent player state.
  inventoryIds: string[];
  codes: string[];

  // Narrative / environment.
  narrativeFlags: string[];
  suppressedCaseIds: string[];
  activeAnomalyIds: string[];
  seenAnomalyIds: string[];
  endingId: string | null;

  // Existing API preserved for current consumers.
  discoverDocument: (documentId: string) => void;
  markDocumentRead: (documentId: string) => void;
  markDocumentDecrypted: (documentId: string) => void;
  completeReading: (readingId: string) => void;
  markMediaListened: (mediaId: string) => void;
  markArtifactScanned: (artifactId: string) => void;

  hasDiscoveredDocument: (documentId: string) => boolean;
  hasReadDocument: (documentId: string) => boolean;
  hasDecryptedDocument: (documentId: string) => boolean;
  hasCompletedReading: (readingId: string) => boolean;
  hasListenedMedia: (mediaId: string) => boolean;
  hasScannedArtifact: (artifactId: string) => boolean;

  // Canonical progression actions.
  setCurrentCase: (caseId: string | null) => void;
  addInvestigatedPlace: (placeId: string) => boolean;
  addEvidence: (evidenceId: string) => boolean;
  markEvidenceAnalysed: (evidenceId: string) => boolean;
  markMediaAnalysed: (mediaId: string) => boolean;
  addBoardConnection: (connectionId: string) => boolean;
  removeBoardConnection: (connectionId: string) => boolean;
  setHypothesis: (id: string, hypothesis: HypothesisState) => void;
  addHypothesisEvidence: (hypothesisId: string, evidenceId: string) => boolean;
  setKnowledge: (
    id: string,
    status: KnowledgeStatus,
    sourceIds?: string[],
  ) => void;
  addContradiction: (contradiction: ContradictionRecord) => boolean;
  resolveContradiction: (
    id: string,
    status?: ContradictionRecord['status'],
  ) => boolean;
  addInventory: (inventoryId: string) => boolean;
  addCode: (code: string) => boolean;
  addNarrativeFlag: (flag: string) => boolean;
  suppressCase: (caseId: string) => boolean;
  setEnding: (endingId: string) => void;
  activateAnomaly: (anomalyId: string) => boolean;
  markAnomalySeen: (anomalyId: string) => boolean;

  addDust: (amount: number) => number;
  spendDust: (amount: number) => boolean;
  changeStability: (delta: number) => number;
  changeConsensus: (delta: number) => number;
  addSessionWork: (amount?: number) => number;
  completeCase: (caseId: string) => boolean;
  beginSession: () => void;

  /**
   * Begin a new Backup cycle while preserving persistent player knowledge.
   *
   * This is intentionally different from resetProgression(): Backup is a
   * session transition, not an archive wipe.
   */
  beginBackupCycle: () => void;

  // Explicit reset only. Backup must not blindly use this.
  resetProgression: () => void;
}

const clamp = (value: number) =>
  Math.max(0, Math.min(100, value));

const uniqueAdd = (items: string[], value: string) =>
  items.includes(value) ? items : [...items, value];

const safeNumber = (
  value: unknown,
  fallback: number,
) =>
  typeof value === 'number' && Number.isFinite(value)
    ? value
    : fallback;

const safeClampedNumber = (
  value: unknown,
  fallback: number,
) =>
  clamp(safeNumber(value, fallback));

const safeStringArray = (
  value: unknown,
  fallback: string[] = [],
): string[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === 'string',
      )
    : fallback;

const safeRecord = <T>(
  value: unknown,
  fallback: Record<string, T>,
): Record<string, T> =>
  value &&
  typeof value === 'object' &&
  !Array.isArray(value)
    ? (value as Record<string, T>)
    : fallback;

const INITIAL_STATE = {
  schemaVersion: PROGRESSION_SCHEMA_VERSION,

  // Canonical observer state.
  dustIndex: 0,
  observerStability: 100,
  consensus: 100,

  // Session state.
  sessionCount: 1,
  sessionStartedAt: null,
  currentCaseId: null,
  completedCaseIds: [],
  sessionWorkDone: 0,

  // Atlas / investigation.
  atlasCoverage: 1240,
  investigatedPlaceIds: [],

  // Evidence.
  discoveredEvidenceIds: [],
  analysedEvidenceIds: [],

  // Archive.
  discoveredDocumentIds: [],
  readDocumentIds: [],
  decryptedDocumentIds: [],
  completedReadingIds: [],

  // Media / artifacts.
  listenedMediaIds: [],
  analysedMediaIds: [],
  scannedArtifactIds: [],

  // Evidence Board.
  boardConnections: [],

  // Interpretation.
  hypotheses: {},
  hypothesisEvidence: {},
  knowledge: {},
  contradictions: {},

  // Persistent player state.
  inventoryIds: [],
  codes: [],

  // Narrative / environment.
  narrativeFlags: [],
  suppressedCaseIds: [],
  activeAnomalyIds: [],
  seenAnomalyIds: [],
  endingId: null,
} satisfies Omit<
  ProgressionState,
  | 'discoverDocument'
  | 'markDocumentRead'
  | 'markDocumentDecrypted'
  | 'completeReading'
  | 'markMediaListened'
  | 'markArtifactScanned'
  | 'hasDiscoveredDocument'
  | 'hasReadDocument'
  | 'hasDecryptedDocument'
  | 'hasCompletedReading'
  | 'hasListenedMedia'
  | 'hasScannedArtifact'
  | 'setCurrentCase'
  | 'addInvestigatedPlace'
  | 'addEvidence'
  | 'markEvidenceAnalysed'
  | 'markMediaAnalysed'
  | 'addBoardConnection'
  | 'removeBoardConnection'
  | 'setHypothesis'
  | 'addHypothesisEvidence'
  | 'setKnowledge'
  | 'addContradiction'
  | 'resolveContradiction'
  | 'addInventory'
  | 'addCode'
  | 'addNarrativeFlag'
  | 'suppressCase'
  | 'setEnding'
  | 'activateAnomaly'
  | 'markAnomalySeen'
  | 'addDust'
  | 'spendDust'
  | 'changeStability'
  | 'changeConsensus'
  | 'addSessionWork'
  | 'completeCase'
  | 'beginSession'
  | 'beginBackupCycle'
  | 'resetProgression'
>;

export const useProgressionStore =
  create<ProgressionState>()(
    persist(
      (set, get) => ({
        ...INITIAL_STATE,

        discoverDocument: (documentId) =>
          set((state) => ({
            discoveredDocumentIds: uniqueAdd(
              state.discoveredDocumentIds,
              documentId,
            ),
          })),

        markDocumentRead: (documentId) =>
          set((state) => ({
            readDocumentIds: uniqueAdd(
              state.readDocumentIds,
              documentId,
            ),
          })),

        markDocumentDecrypted: (documentId) =>
          set((state) => ({
            decryptedDocumentIds: uniqueAdd(
              state.decryptedDocumentIds,
              documentId,
            ),
          })),

        completeReading: (readingId) =>
          set((state) => ({
            completedReadingIds: uniqueAdd(
              state.completedReadingIds,
              readingId,
            ),
          })),

        markMediaListened: (mediaId) =>
          set((state) => ({
            listenedMediaIds: uniqueAdd(
              state.listenedMediaIds,
              mediaId,
            ),
          })),

        markArtifactScanned: (artifactId) =>
          set((state) => ({
            scannedArtifactIds: uniqueAdd(
              state.scannedArtifactIds,
              artifactId,
            ),
          })),

        hasDiscoveredDocument: (documentId) =>
          get().discoveredDocumentIds.includes(
            documentId,
          ),

        hasReadDocument: (documentId) =>
          get().readDocumentIds.includes(documentId),

        hasDecryptedDocument: (documentId) =>
          get().decryptedDocumentIds.includes(
            documentId,
          ),

        hasCompletedReading: (readingId) =>
          get().completedReadingIds.includes(
            readingId,
          ),

        hasListenedMedia: (mediaId) =>
          get().listenedMediaIds.includes(mediaId),

        hasScannedArtifact: (artifactId) =>
          get().scannedArtifactIds.includes(
            artifactId,
          ),

        setCurrentCase: (caseId) =>
          set(() => ({
            currentCaseId: caseId,
          })),

        addInvestigatedPlace: (placeId) => {
          if (
            get().investigatedPlaceIds.includes(
              placeId,
            )
          ) {
            return false;
          }

          set((state) => ({
            investigatedPlaceIds: [
              ...state.investigatedPlaceIds,
              placeId,
            ],
            sessionWorkDone:
              state.sessionWorkDone + 1,
            dustIndex: clamp(
              state.dustIndex + 2,
            ),
            atlasCoverage:
              state.atlasCoverage + 42.8,
          }));

          return true;
        },

        addEvidence: (evidenceId) => {
          if (
            get().discoveredEvidenceIds.includes(
              evidenceId,
            )
          ) {
            return false;
          }

          set((state) => ({
            discoveredEvidenceIds: [
              ...state.discoveredEvidenceIds,
              evidenceId,
            ],
          }));

          return true;
        },

        markEvidenceAnalysed: (evidenceId) => {
          if (
            !get().discoveredEvidenceIds.includes(
              evidenceId,
            )
          ) {
            return false;
          }

          if (
            get().analysedEvidenceIds.includes(
              evidenceId,
            )
          ) {
            return false;
          }

          set((state) => ({
            analysedEvidenceIds: [
              ...state.analysedEvidenceIds,
              evidenceId,
            ],
            sessionWorkDone:
              state.sessionWorkDone + 1,
          }));

          return true;
        },

        markMediaAnalysed: (mediaId) => {
          if (
            !get().listenedMediaIds.includes(
              mediaId,
            )
          ) {
            return false;
          }

          if (
            get().analysedMediaIds.includes(
              mediaId,
            )
          ) {
            return false;
          }

          set((state) => ({
            analysedMediaIds: [
              ...state.analysedMediaIds,
              mediaId,
            ],
            sessionWorkDone:
              state.sessionWorkDone + 1,
          }));

          return true;
        },

        addBoardConnection: (connectionId) => {
          const normalizedConnection =
            normalizeBoardConnection(connectionId);

          if (!normalizedConnection) {
            return false;
          }

          if (
            get().boardConnections.includes(
              normalizedConnection,
            )
          ) {
            return false;
          }

          set((state) => ({
            boardConnections: [
              ...state.boardConnections,
              normalizedConnection,
            ],
            sessionWorkDone:
              state.sessionWorkDone + 1,
          }));

          return true;
        },

        removeBoardConnection: (connectionId) => {
          const normalizedConnection =
            normalizeBoardConnection(connectionId);

          if (!normalizedConnection) {
            return false;
          }

          if (
            !get().boardConnections.includes(
              normalizedConnection,
            )
          ) {
            return false;
          }

          set((state) => ({
            boardConnections:
              state.boardConnections.filter(
                (connection) =>
                  connection !== normalizedConnection,
              ),
          }));

          return true;
        },

        setHypothesis: (id, hypothesis) =>
          set((state) => ({
            hypotheses: {
              ...state.hypotheses,
              [id]: hypothesis,
            },
          })),

        addHypothesisEvidence: (hypothesisId, evidenceId) => {
          const normalizedHypothesisId = hypothesisId.trim();
          const normalizedEvidenceId = evidenceId.trim();

          if (!normalizedHypothesisId || !normalizedEvidenceId) {
            return false;
          }

          const existing =
            get().hypothesisEvidence[normalizedHypothesisId] ?? [];

          if (existing.includes(normalizedEvidenceId)) {
            return false;
          }

          set((state) => ({
            hypothesisEvidence: {
              ...state.hypothesisEvidence,
              [normalizedHypothesisId]: [
                ...existing,
                normalizedEvidenceId,
              ],
            },
          }));

          return true;
        },

        setKnowledge: (
          id,
          status,
          sourceIds = [],
        ) =>
          set((state) => ({
            knowledge: {
              ...state.knowledge,
              [id]: {
                status,
                sourceIds,
                discoveredAtSession:
                  state.sessionCount,
              },
            },
          })),

        addContradiction: (contradiction) => {
          if (
            get().contradictions[
              contradiction.id
            ]
          ) {
            return false;
          }

          set((state) => ({
            contradictions: {
              ...state.contradictions,
              [contradiction.id]:
                contradiction,
            },
          }));

          return true;
        },

        resolveContradiction: (
          id,
          status = 'resolved',
        ) => {
          if (!get().contradictions[id]) {
            return false;
          }

          set((state) => ({
            contradictions: {
              ...state.contradictions,
              [id]: {
                ...state.contradictions[id],
                status,
              },
            },
          }));

          return true;
        },

        addInventory: (inventoryId) => {
          if (
            get().inventoryIds.includes(
              inventoryId,
            )
          ) {
            return false;
          }

          set((state) => ({
            inventoryIds: [
              ...state.inventoryIds,
              inventoryId,
            ],
          }));

          return true;
        },

        addCode: (code) => {
          if (get().codes.includes(code)) {
            return false;
          }

          set((state) => ({
            codes: [
              ...state.codes,
              code,
            ],
          }));

          return true;
        },

        addNarrativeFlag: (flag) => {
          if (
            get().narrativeFlags.includes(flag)
          ) {
            return false;
          }

          set((state) => ({
            narrativeFlags: [
              ...state.narrativeFlags,
              flag,
            ],
          }));

          return true;
        },

        suppressCase: (caseId) => {
          if (
            get().suppressedCaseIds.includes(
              caseId,
            )
          ) {
            return false;
          }

          set((state) => ({
            suppressedCaseIds: [
              ...state.suppressedCaseIds,
              caseId,
            ],

            // Forget suppresses the case rather than
            // deleting authored investigation data.
            dustIndex: clamp(
              state.dustIndex - 10,
            ),
            consensus: clamp(
              state.consensus - 2,
            ),
          }));

          return true;
        },

        setEnding: (endingId) =>
          set({
            endingId,
          }),

        activateAnomaly: (anomalyId) => {
          if (
            get().activeAnomalyIds.includes(
              anomalyId,
            )
          ) {
            return false;
          }

          set((state) => ({
            activeAnomalyIds: [
              ...state.activeAnomalyIds,
              anomalyId,
            ],
          }));

          return true;
        },

        markAnomalySeen: (anomalyId) => {
          if (
            get().seenAnomalyIds.includes(
              anomalyId,
            )
          ) {
            return false;
          }

          set((state) => ({
            seenAnomalyIds: [
              ...state.seenAnomalyIds,
              anomalyId,
            ],
          }));

          return true;
        },

        addDust: (amount) => {
          if (!Number.isFinite(amount)) {
            return get().dustIndex;
          }

          set((state) => ({
            dustIndex: clamp(
              state.dustIndex + amount,
            ),
          }));

          return get().dustIndex;
        },

        spendDust: (amount) => {
          if (
            !Number.isFinite(amount) ||
            amount <= 0
          ) {
            return false;
          }

          if (get().dustIndex < amount) {
            return false;
          }

          set((state) => ({
            dustIndex: clamp(
              state.dustIndex - amount,
            ),
          }));

          return true;
        },

        changeStability: (delta) => {
          if (!Number.isFinite(delta)) {
            return get().observerStability;
          }

          set((state) => ({
            observerStability: clamp(
              state.observerStability + delta,
            ),
          }));

          return get().observerStability;
        },

        changeConsensus: (delta) => {
          if (!Number.isFinite(delta)) {
            return get().consensus;
          }

          set((state) => ({
            consensus: clamp(
              state.consensus + delta,
            ),
          }));

          return get().consensus;
        },

        addSessionWork: (amount = 1) => {
          if (
            !Number.isFinite(amount) ||
            amount <= 0
          ) {
            return get().sessionWorkDone;
          }

          set((state) => ({
            sessionWorkDone:
              state.sessionWorkDone + amount,
          }));

          return get().sessionWorkDone;
        },

        completeCase: (caseId) => {
          if (
            get().completedCaseIds.includes(
              caseId,
            )
          ) {
            return false;
          }

          set((state) => ({
            completedCaseIds: [
              ...state.completedCaseIds,
              caseId,
            ],
          }));

          return true;
        },

        beginSession: () =>
          set((state) => ({
            sessionCount:
              state.sessionCount + 1,
            sessionStartedAt:
              new Date().toISOString(),
            currentCaseId: null,
            sessionWorkDone: 0,
          })),

        beginBackupCycle: () =>
          set((state) => ({
            // Backup starts the next session while preserving the player's
            // accumulated archival knowledge and investigative record.
            sessionCount:
              Math.max(1, state.sessionCount + 1),
            sessionStartedAt:
              new Date().toISOString(),

            // The active investigation belongs to the completed cycle.
            currentCaseId: null,
            sessionWorkDone: 0,

            // Dust and Stability describe the current observer session.
            dustIndex: 0,
            observerStability: 100,

            // Consensus represents the player's accumulated model and is
            // therefore deliberately preserved across Backup.
            consensus: state.consensus,

            // Persistent discoveries, documents, evidence, board state,
            // hypotheses, knowledge, contradictions, inventory, codes, and
            // environmental history remain untouched.

            // The previous ending belongs to the completed cycle.
            endingId: null,
          })),

        resetProgression: () =>
          set({
            ...INITIAL_STATE,
            sessionStartedAt:
              new Date().toISOString(),
          }),
      }),
      {
        name: 'vp-progression-state',
        version:
          PROGRESSION_SCHEMA_VERSION,

        migrate: (persistedState) => {
          if (
            !persistedState ||
            typeof persistedState !==
              'object'
          ) {
            return {
              ...INITIAL_STATE,
            };
          }

          const persisted =
            persistedState as Partial<ProgressionState>;

          return {
            ...INITIAL_STATE,

            // Canonical numeric state.
            dustIndex:
              safeClampedNumber(
                persisted.dustIndex,
                INITIAL_STATE.dustIndex,
              ),

            observerStability:
              safeClampedNumber(
                persisted.observerStability,
                INITIAL_STATE.observerStability,
              ),

            consensus:
              safeClampedNumber(
                persisted.consensus,
                INITIAL_STATE.consensus,
              ),

            sessionCount:
              Math.max(
                1,
                Math.floor(
                  safeNumber(
                    persisted.sessionCount,
                    INITIAL_STATE.sessionCount,
                  ),
                ),
              ),

            sessionStartedAt:
              typeof persisted.sessionStartedAt ===
              'string'
                ? persisted.sessionStartedAt
                : null,

            currentCaseId:
              typeof persisted.currentCaseId ===
              'string'
                ? persisted.currentCaseId
                : null,

            sessionWorkDone:
              Math.max(
                0,
                safeNumber(
                  persisted.sessionWorkDone,
                  INITIAL_STATE.sessionWorkDone,
                ),
              ),

            atlasCoverage:
              Math.max(
                0,
                safeNumber(
                  persisted.atlasCoverage,
                  INITIAL_STATE.atlasCoverage,
                ),
              ),

            // Canonical progression arrays.
            completedCaseIds:
              safeStringArray(
                persisted.completedCaseIds,
              ),

            investigatedPlaceIds:
              safeStringArray(
                persisted.investigatedPlaceIds,
              ),

            discoveredEvidenceIds:
              safeStringArray(
                persisted.discoveredEvidenceIds,
              ),

            analysedEvidenceIds:
              safeStringArray(
                persisted.analysedEvidenceIds,
              ),

            discoveredDocumentIds:
              safeStringArray(
                persisted.discoveredDocumentIds,
              ),

            readDocumentIds:
              safeStringArray(
                persisted.readDocumentIds,
              ),

            decryptedDocumentIds:
              safeStringArray(
                persisted.decryptedDocumentIds,
              ),

            completedReadingIds:
              safeStringArray(
                persisted.completedReadingIds,
              ),

            listenedMediaIds:
              safeStringArray(
                persisted.listenedMediaIds,
              ),

            analysedMediaIds:
              safeStringArray(
                persisted.analysedMediaIds,
              ),

            scannedArtifactIds:
              safeStringArray(
                persisted.scannedArtifactIds,
              ),

            boardConnections:
              Array.from(
                new Set(
                  safeStringArray(
                    persisted.boardConnections,
                  )
                    .map((connection) =>
                      normalizeBoardConnection(
                        connection,
                      ),
                    )
                    .filter(Boolean),
                ),
              ),

            inventoryIds:
              safeStringArray(
                persisted.inventoryIds,
              ),

            codes:
              safeStringArray(
                persisted.codes,
              ),

            narrativeFlags:
              safeStringArray(
                persisted.narrativeFlags,
              ),

            suppressedCaseIds:
              safeStringArray(
                persisted.suppressedCaseIds,
              ),

            activeAnomalyIds:
              safeStringArray(
                persisted.activeAnomalyIds,
              ),

            seenAnomalyIds:
              safeStringArray(
                persisted.seenAnomalyIds,
              ),

            // Structured progression records.
            hypotheses:
              safeRecord<HypothesisState>(
                persisted.hypotheses,
                INITIAL_STATE.hypotheses,
              ),

            hypothesisEvidence:
              Object.fromEntries(
                Object.entries(
                  persisted.hypothesisEvidence ?? {},
                ).map(([hypothesisId, evidenceIds]) => [
                  hypothesisId,
                  safeStringArray(evidenceIds),
                ]),
              ),

            knowledge:
              safeRecord<KnowledgeRecord>(
                persisted.knowledge,
                INITIAL_STATE.knowledge,
              ),

            contradictions:
              safeRecord<ContradictionRecord>(
                persisted.contradictions,
                INITIAL_STATE.contradictions,
              ),

            endingId:
              typeof persisted.endingId ===
              'string'
                ? persisted.endingId
                : null,

            schemaVersion:
              PROGRESSION_SCHEMA_VERSION,
          };
        },
      },
    ),
  );

/**
 * Compact canonical context for evaluators and,
 * later, BUNKER_7.
 *
 * This contains state/IDs, not authored corpus
 * objects.
 */
export function getCanonicalProgressionSnapshot() {
  const state =
    useProgressionStore.getState();

  return {
    schemaVersion:
      state.schemaVersion,

    session: {
      count: state.sessionCount,
      currentCaseId:
        state.currentCaseId,
      completedCaseIds:
        state.completedCaseIds,
    },

    dust: state.dustIndex,
    stability:
      state.observerStability,
    consensus:
      state.consensus,

    investigatedPlaceIds:
      state.investigatedPlaceIds,

    discoveredEvidenceIds:
      state.discoveredEvidenceIds,

    analysedEvidenceIds:
      state.analysedEvidenceIds,

    discoveredDocumentIds:
      state.discoveredDocumentIds,

    readDocumentIds:
      state.readDocumentIds,

    decryptedDocumentIds:
      state.decryptedDocumentIds,

    completedReadingIds:
      state.completedReadingIds,

    listenedMediaIds:
      state.listenedMediaIds,

    analysedMediaIds:
      state.analysedMediaIds,

    scannedArtifactIds:
      state.scannedArtifactIds,

    boardConnections:
      state.boardConnections,

    hypotheses:
      state.hypotheses,

    hypothesisEvidence:
      state.hypothesisEvidence,

    knowledge:
      state.knowledge,

    contradictions:
      state.contradictions,

    inventoryIds:
      state.inventoryIds,

    codes:
      state.codes,

    narrativeFlags:
      state.narrativeFlags,

    suppressedCaseIds:
      state.suppressedCaseIds,

    activeAnomalyIds:
      state.activeAnomalyIds,

    seenAnomalyIds:
      state.seenAnomalyIds,
  };
}