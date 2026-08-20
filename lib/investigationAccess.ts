import type { Place } from '@/types/places';
import {
  normalizeBoardConnection,
  type ProgressionState,
} from '@/state/progressionStore';
import type { EvidenceItem } from '@/types/investigation';
import {
  CANONICAL_CASES,
  getCanonicalCase,
  type CanonicalAct,
  type CanonicalCase,
} from '@/data/canonicalProgression';

/**
 * Single access gate for authored investigation progression.
 *
 * IMPORTANT:
 * There are two different concepts here:
 *
 * 1. PLACE ACCESS
 *    Geographic Atlas availability. This continues to use Place.unlockCondition.
 *
 * 2. CASE ACCESS
 *    Narrative investigation availability. This uses canonicalProgression.ts.
 *
 * Do not use Atlas unlockCondition as the narrative case progression system.
 */

/**
 * Canonical progression fields required by the access evaluator.
 *
 * ProgressionState is the authoritative source for canonical investigation
 * history and epistemic state. Dust remains available here only for the
 * separate geographic Place-access evaluator.
 *
 * `investigatedSlugs` remains optional only as a migration compatibility
 * projection for callers that have not yet been moved off the legacy UI store.
 *
 * Canonical precedence:
 *
 *     investigatedPlaceIds
 *             ↓
 *     investigatedSlugs fallback
 */
export type InvestigationAccessStatus = Pick<
  ProgressionState,
  | 'dustIndex'
  | 'investigatedPlaceIds'
  | 'completedCaseIds'
  | 'discoveredEvidenceIds'
  | 'analysedEvidenceIds'
  | 'boardConnections'
  | 'hypotheses'
  | 'hypothesisEvidence'
  | 'knowledge'
  | 'contradictions'
> & {
  investigatedSlugs?: string[];
};

export interface InvestigationAccessContext {
  status: InvestigationAccessStatus;
  places: Place[];
  evidence: Record<string, EvidenceItem[]>;
}

export interface InvestigationAccessResult {
  unlocked: boolean;
  reason: string;
}

type RawCondition = {
  type?: string;
  value?: unknown;
  message?: string;
};

/**
 * Return the canonical investigation history.
 *
 * ProgressionState.investigatedPlaceIds is authoritative.
 * investigatedSlugs exists only as a temporary compatibility fallback.
 */
function getInvestigatedPlaceIds(
  context: InvestigationAccessContext
): string[] {
  return context.status.investigatedPlaceIds;
}

function verifiedInvestigations(
  context: InvestigationAccessContext
): number {
  const investigated = new Set(
    getInvestigatedPlaceIds(context)
  );

  return context.places.filter(
    (place) =>
      place.status === 'verified' &&
      investigated.has(place.slug)
  ).length;
}

function totalEvidence(
  context: InvestigationAccessContext
): number {
  return Object.values(context.evidence).reduce(
    (total, items) => total + items.length,
    0
  );
}

/**
 * ---------------------------------------------------------------------------
 * ATLAS / PLACE ACCESS
 * ---------------------------------------------------------------------------
 *
 * This is the existing geographic access system.
 *
 * It intentionally remains independent from canonical narrative progression.
 */
export function evaluatePlaceAccess(
  place: Place,
  context: InvestigationAccessContext
): InvestigationAccessResult {
  const condition =
    place.unlockCondition as RawCondition | undefined;

  // No authored geographic gate means the PLACE is available in the Atlas.
  //
  // This does NOT mean the place is automatically a playable narrative case.
  if (!condition) {
    return {
      unlocked: true,
      reason: '',
    };
  }

  const value = condition.value;

  switch (condition.type) {
    case 'dust': {
      const required = Number(value);
      const unlocked =
        context.status.dustIndex >= required;

      return {
        unlocked,
        reason: unlocked
          ? ''
          : condition.message ||
            `Requires Dust Index ${required}.`,
      };
    }

    case 'visit': {
      // Numeric visit conditions mean:
      // "Investigate N verified locations."
      if (typeof value === 'number') {
        const count =
          verifiedInvestigations(context);
        const unlocked = count >= value;

        return {
          unlocked,
          reason: unlocked
            ? ''
            : condition.message ||
              `Investigate ${value} verified locations to unlock.`,
        };
      }

      // String visit conditions name a prerequisite place.
      const prerequisite =
        String(value || '').trim();

      const unlocked =
        prerequisite.length > 0 &&
        getInvestigatedPlaceIds(context).includes(
          prerequisite
        );

      return {
        unlocked,
        reason: unlocked
          ? ''
          : condition.message ||
            `Investigate ${prerequisite} first.`,
      };
    }

    case 'evidence': {
      const required = Number(value);
      const count = totalEvidence(context);
      const unlocked = count >= required;

      return {
        unlocked,
        reason: unlocked
          ? ''
          : condition.message ||
            `Collect ${required} evidence items to unlock.`,
      };
    }

    case 'code':
      // Code/reveal commands own the mutation that removes the authored
      // unlockCondition from the Atlas Place.
      return {
        unlocked: false,
        reason:
          condition.message ||
          'Requires decryption access.',
      };

    case 'reading':
      // Same principle as code gates.
      return {
        unlocked: false,
        reason:
          condition.message ||
          'Requires the specified BUNKER_7 reading.',
      };

    default:
      // Fail closed.
      //
      // An unknown Atlas condition must never accidentally expose a place.
      return {
        unlocked: false,
        reason:
          condition.message ||
          'REGISTRY CLASSIFIED',
      };
  }
}

/**
 * ---------------------------------------------------------------------------
 * CANONICAL NARRATIVE CASE ACCESS
 * ---------------------------------------------------------------------------
 *
 * This is the progression system for the 36-case narrative spine.
 *
 * It deliberately does NOT inspect Place.unlockCondition.
 *
 * A case can therefore be:
 *
 *   - geographically present but narratively locked
 *   - geographically missing but narratively valid
 *   - geographically available but not yet a playable case
 */
export function evaluateCanonicalCaseAccess(
  slug: string,
  context: InvestigationAccessContext
): InvestigationAccessResult {
  const definition =
    getCanonicalCase(slug);

  if (!definition) {
    return {
      unlocked: false,
      reason:
        'CASE NOT PRESENT IN CURRENT NARRATIVE SPINE.',
    };
  }

  return evaluateCanonicalDefinitionAccess(
    definition,
    context
  );
}

/**
 * Evaluate one authored case definition.
 */
function evaluateCanonicalDefinitionAccess(
  definition: CanonicalCase,
  context: InvestigationAccessContext
): InvestigationAccessResult {
  const gate = definition.gate;

  switch (gate.type) {
    case 'act': {
      /*
       * MIGRATION RULE
       *
       * Historical case definitions used Dust thresholds as narrative gates.
       * Those thresholds are no longer consulted.
       *
       * Act I is the authored starting frontier and remains available.
       * For Acts II-IV, legacy Dust-gated cases are provisionally available
       * when every case in the immediately preceding act is complete.
       *
       * This is an INTERMEDIATE migration state, not the final epistemic
       * gate design. Individual cases will later receive authored
       * knowledge/evidence/relationship requirements as the lore audit
       * resolves them. We must not invent those requirements prematurely.
       */
      if (gate.act === 1) {
        return {
          unlocked: true,
          reason: '',
        };
      }

      const previousAct = (gate.act - 1) as CanonicalAct;
      const previousActCases = CANONICAL_CASES.filter(
        (candidate) => candidate.act === previousAct,
      );

      const completed = previousActCases.filter((candidate) =>
        context.status.completedCaseIds.includes(candidate.slug),
      );

      const unlocked =
        previousActCases.length > 0 &&
        completed.length === previousActCases.length;

      return {
        unlocked,
        reason: unlocked
          ? ''
          : `Requires completion of the ${previousActCases.length} canonical cases in Act ${previousAct}.`,
      };
    }

    case 'convergence': {
      /*
       * THE GRID NULL POINT IS AN EPISTEMIC GATE.
       *
       * The canon requires:
       *   1. all three military anchors established
       *   2. the three correct Board relationships
       *   3. the Signal hypothesis supported/confirmed
       *   4. evidence attached to that hypothesis
       *
       * This deliberately reads canonical progression state only.
       */
      const investigated = getInvestigatedPlaceIds(context);

      const missingAnchors = gate.anchors.filter(
        (anchor) => !investigated.includes(anchor),
      );

      const boardConnections = new Set(
        context.status.boardConnections.map((connection) =>
          normalizeBoardConnection(connection),
        ),
      );

      const requiredConnections = gate.triangleConnections.map(
        ([source, target]) =>
          normalizeBoardConnection(`${source}::${target}`),
      );

      const missingConnections =
        requiredConnections.filter(
          (required) => !boardConnections.has(required),
        );

      const hypothesis =
        context.status.hypotheses[gate.signalHypothesisId];

      const hypothesisStatus =
        typeof hypothesis === 'object' &&
        hypothesis !== null
          ? String(
              (hypothesis as {
                status?: unknown;
                state?: unknown;
              }).status ??
                (hypothesis as {
                  status?: unknown;
                  state?: unknown;
                }).state ??
                '',
            ).toLowerCase()
          : '';

      const signalSupported =
        hypothesisStatus === 'supported' ||
        hypothesisStatus === 'confirmed';

      const hypothesisEvidence =
        context.status.hypothesisEvidence[
          gate.signalHypothesisId
        ] ?? [];

      const evidenceVerified =
        hypothesisEvidence.length > 0;

      const unlocked =
        missingAnchors.length === 0 &&
        missingConnections.length === 0 &&
        signalSupported &&
        evidenceVerified;

      if (unlocked) {
        return {
          unlocked: true,
          reason: '',
        };
      }

      const blockers: string[] = [];

      if (missingAnchors.length > 0) {
        blockers.push(
          `${missingAnchors.length} anchor investigation${
            missingAnchors.length === 1 ? '' : 's'
          }`,
        );
      }

      if (missingConnections.length > 0) {
        blockers.push(
          `${missingConnections.length} geodetic Board relationship${
            missingConnections.length === 1 ? '' : 's'
          }`,
        );
      }

      if (!signalSupported) {
        blockers.push('supported Signal hypothesis');
      }

      if (!evidenceVerified) {
        blockers.push('evidence attached to the Signal hypothesis');
      }

      return {
        unlocked: false,
        reason: `Grid Null Point convergence incomplete: ${blockers.join(', ')}.`,
      };
    }
  }
}

export function canAccessCanonicalCase(
  slug: string,
  context: InvestigationAccessContext
): boolean {
  return evaluateCanonicalCaseAccess(
    slug,
    context
  ).unlocked;
}

/**
 * Convenience helper when the caller already has
 * the canonical definition.
 */
export function canAccessCanonicalDefinition(
  definition: CanonicalCase,
  context: InvestigationAccessContext
): boolean {
  return evaluateCanonicalDefinitionAccess(
    definition,
    context
  ).unlocked;
}

/**
 * Existing Atlas helper.
 */
export function canAccessPlace(
  place: Place,
  context: InvestigationAccessContext
): boolean {
  return evaluatePlaceAccess(
    place,
    context
  ).unlocked;
}