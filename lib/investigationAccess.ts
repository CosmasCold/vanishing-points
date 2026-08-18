import type { Place } from '@/types/places';
import type { ProgressionState } from '@/state/progressionStore';
import type { EvidenceItem } from '@/types/investigation';
import {
  getCanonicalCase,
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
 * ProgressionState is the authoritative source for Dust and investigation
 * history.
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
  'dustIndex' | 'investigatedPlaceIds'
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
    case 'dust': {
      const required = gate.value;

      const unlocked =
        context.status.dustIndex >= required;

      return {
        unlocked,
        reason: unlocked
          ? ''
          : `Requires Dust Index ${required}.`,
      };
    }

    case 'centroid': {
      /*
       * The Grid Null Point is not a normal Dust-gated case.
       *
       * It materializes only after the three authored geographic anchors
       * have been investigated:
       *
       *   Mount Weather
       *   Cheyenne Mountain
       *   Raven Rock
       *
       * We use canonical investigatedPlaceIds here because the canonical
       * progression store owns investigation history.
       */
      const missingAnchors =
        gate.anchors.filter(
          (anchor) =>
            !getInvestigatedPlaceIds(
              context
            ).includes(anchor)
        );

      const unlocked =
        missingAnchors.length === 0;

      return {
        unlocked,
        reason: unlocked
          ? ''
          : `Requires reconstruction of the three military anchor sites. Missing ${missingAnchors.length} anchor investigation${
              missingAnchors.length === 1
                ? ''
                : 's'
            }.`,
      };
    }

    default: {
      const exhaustive: never = gate;

      return {
        unlocked: false,
        reason:
          `UNSUPPORTED CASE GATE: ${String(
            exhaustive
          )}`,
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