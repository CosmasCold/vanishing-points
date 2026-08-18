import { useInvestigationStore } from '@/state/investigationStore';
import { useProgressionStore } from '@/state/progressionStore';

export type ExposureDepth = 'minor' | 'moderate' | 'deep';

export interface ExposureDefinition {
  id: string;
  caseId: string;

  depth: ExposureDepth;
  dustCost: 5 | 8 | 15;
  minimumDust: 5 | 8 | 15;

  source: string;
  relatedTo: string[];

  title: string;
  resultTitle: string;
  resultDescription: string;
  resultEvidenceId: string;
}

export const EXPOSURE_COSTS = {
  minor: 5,
  moderate: 8,
  deep: 15,
} as const;

export type ExposureFailure =
  | 'NOT_FOUND'
  | 'ALREADY_EXPOSED'
  | 'INSUFFICIENT_DUST';

export interface ExposureResult {
  allowed: boolean;
  success: boolean;

  exposure?: ExposureDefinition;

  reason?: ExposureFailure;

  dustBefore?: number;
  dustAfter?: number;

  resultTitle?: string;
  resultDescription?: string;
  resultEvidenceId?: string;
}

const EXPOSURES: ExposureDefinition[] = [];

export function registerExposure(
  exposure: ExposureDefinition
): void {
  if (EXPOSURES.some((existing) => existing.id === exposure.id)) {
    throw new Error(
      `[Exposure] Duplicate exposure registration: "${exposure.id}"`
    );
  }

  EXPOSURES.push(exposure);
}

export function getExposure(
  exposureId: string
): ExposureDefinition | undefined {
  return EXPOSURES.find(
    (exposure) => exposure.id === exposureId
  );
}

export function getExposuresForCase(
  caseId: string
): ExposureDefinition[] {
  return EXPOSURES.filter(
    (exposure) => exposure.caseId === caseId
  );
}

/**
 * Execute one authored exposure.
 *
 * The command layer passes the complete ExposureDefinition.
 * Dust is owned by the canonical progression store.
 * InvestigationStore remains responsible for the consumable exposure record.
 */
export function performExposure(
  exposure: ExposureDefinition
): ExposureResult {
  const progressionStore = useProgressionStore.getState();
  const investigationState =
    useInvestigationStore.getState();

  const dustBefore = progressionStore.dustIndex;

  const existingExposures =
    investigationState.exposures[exposure.caseId] || [];

  /*
   * An exposure is permanently consumable.
   *
   * Check this before touching Dust so repeated execution
   * can never consume Dust again.
   */
  if (existingExposures.includes(exposure.id)) {
    return {
      allowed: false,
      success: false,
      exposure,
      reason: 'ALREADY_EXPOSED',
      dustBefore,
      dustAfter: dustBefore,
      resultTitle: exposure.resultTitle,
      resultDescription: exposure.resultDescription,
      resultEvidenceId: exposure.resultEvidenceId,
    };
  }

  if (dustBefore < exposure.dustCost) {
    return {
      allowed: false,
      success: false,
      exposure,
      reason: 'INSUFFICIENT_DUST',
      dustBefore,
      dustAfter: dustBefore,
      resultTitle: exposure.resultTitle,
      resultDescription: exposure.resultDescription,
      resultEvidenceId: exposure.resultEvidenceId,
    };
  }

  /*
   * Dust is the canonical observer-state metric.
   * spendDust() also guarantees that insufficient Dust cannot
   * produce a partial transaction.
   */
  const spent = progressionStore.spendDust(exposure.dustCost);

  if (!spent) {
    const currentDust = useProgressionStore.getState().dustIndex;

    return {
      allowed: false,
      success: false,
      exposure,
      reason: 'INSUFFICIENT_DUST',
      dustBefore,
      dustAfter: currentDust,
      resultTitle: exposure.resultTitle,
      resultDescription: exposure.resultDescription,
      resultEvidenceId: exposure.resultEvidenceId,
    };
  }

  const dustAfter = useProgressionStore.getState().dustIndex;

  /*
   * InvestigationStore owns the consumable exposure record.
   * It does not own the Dust transaction.
   */
  useInvestigationStore
    .getState()
    .recordExposure(exposure.caseId, exposure.id);

  return {
    allowed: true,
    success: true,
    exposure,
    dustBefore,
    dustAfter,
    resultTitle: exposure.resultTitle,
    resultDescription: exposure.resultDescription,
    resultEvidenceId: exposure.resultEvidenceId,
  };
}

/**
 * Compatibility helper for callers that only have an ID.
 */
export function attemptExposure(
  exposureId: string
): ExposureResult {
  const exposure = getExposure(exposureId);

  if (!exposure) {
    return {
      allowed: false,
      success: false,
      reason: 'NOT_FOUND',
    };
  }

  return performExposure(exposure);
}