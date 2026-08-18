import type { ConditionContext } from '@/types/conditions';
import type { ProgressionState } from '@/types/progression';
import { useProgressionStore } from '@/state/progressionStore';

export interface ProgressionContextOptions {
  /**
   * Explicit override for callers that are evaluating a simulated state.
   * When omitted, the canonical persisted session count is used.
   */
  sessionCount?: number;
  evidenceCount?: number;
  currentTime?: string;
}

/**
 * Convert canonical progression state into the primitive context consumed by
 * the pure condition evaluator.
 *
 * IMPORTANT:
 * - No Zustand store is passed into the evaluator.
 * - Authored corpus objects are not copied into the context.
 * - Collections are converted to Set/Map so condition evaluation remains
 *   deterministic and side-effect free.
 */
export function buildProgressionContext(
  state: ProgressionState,
  options: ProgressionContextOptions = {},
): ConditionContext {
  return {
    dustIndex: state.dustIndex,
    observerStability: state.observerStability,
    

    sessionCount:
      options.sessionCount ?? state.sessionCount,

    inventoryIds: new Set(state.inventoryIds),

    visitedPlaceIds:
      new Set(state.investigatedPlaceIds),

    readDocumentIds:
      new Set(state.readDocumentIds),

    readingIds:
      new Set(state.completedReadingIds),

    scannedArtifactIds:
      new Set(state.scannedArtifactIds),

    boardConnections:
      new Set(state.boardConnections),

    hypotheses:
      new Map(Object.entries(state.hypotheses)),

    codes:
      new Set(state.codes),

    currentTime:
      options.currentTime,

    evidenceCount:
      options.evidenceCount ??
      state.discoveredEvidenceIds.length,
  };
}

/**
 * Canonical runtime adapter.
 *
 * Use this when evaluating the player's real current progression.
 * Simulation/tests should continue using buildProgressionContext(state,...)
 * with an explicit state object.
 */
export function getCurrentProgressionContext(
  options: Omit<ProgressionContextOptions, 'sessionCount'> = {},
): ConditionContext {
  const state = useProgressionStore.getState();

  return buildProgressionContext(state, {
    ...options,
    sessionCount: state.sessionCount,
  });
}