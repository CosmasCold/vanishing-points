import { ACT_I_CASES, type ContentStatus } from '@/data/act1Cases';
import { getCanonicalCase } from '@/data/canonicalCases';
import { normalizeBoardConnection } from '@/state/progressionStore';

export interface AuthoredBoardRelationship {
  canonicalId: string;
  source: string;
  target: string;
  relationship: string;
  status: ContentStatus;
}

export interface BoardRelationshipResolution {
  canonical: boolean;
  canonicalId: string | null;
  relationship: AuthoredBoardRelationship | null;
  reason:
    | 'authored-source'
    | 'authored-proposed'
    | 'player-only'
    | 'case-not-investigated'
    | 'unknown-case';
}

/**
 * Resolve a player-drawn Evidence Board connection against authored Act I data.
 *
 * Important invariants:
 * - Player connections remain hypotheses until an authored SOURCE relationship
 *   exists between the same two case endpoints.
 * - Proposed authored relationships are never promoted into canonical facts.
 * - Both endpoint cases must have been investigated before the authored source
 *   relationship can become canonical progression state.
 * - The resolver is pure. It never mutates Zustand or UI state.
 *
 * Canonical case identity may come from the 36-case narrative registry, but
 * relationship authority still comes exclusively from authored Act I data.
 */
export function resolveBoardRelationship(
  source: string,
  target: string,
  investigatedPlaceIds: readonly string[],
): BoardRelationshipResolution {
  const canonicalId = normalizeBoardConnection(source, target);
  if (!canonicalId) {
    return {
      canonical: false,
      canonicalId: null,
      relationship: null,
      reason: 'unknown-case',
    };
  }

  const sourceCase =
    ACT_I_CASES.find((item) => item.slug === source) ??
    getCanonicalCase(source);

  const targetCase =
    ACT_I_CASES.find((item) => item.slug === target) ??
    getCanonicalCase(target);

  if (!sourceCase || !targetCase) {
    return {
      canonical: false,
      canonicalId,
      relationship: null,
      reason: 'unknown-case',
    };
  }

  let match: AuthoredBoardRelationship | null = null;

  for (const caseSpec of ACT_I_CASES) {
    for (const connection of caseSpec.connections) {
      if (
        normalizeBoardConnection(caseSpec.slug, connection.caseSlug) !==
        canonicalId
      ) {
        continue;
      }

      const candidate: AuthoredBoardRelationship = {
        canonicalId,
        source: caseSpec.slug,
        target: connection.caseSlug,
        relationship: connection.relationship,
        status: connection.status,
      };

      // Prefer a directly authored source-side declaration when both directions
      // happen to describe the same relationship.
      if (
        caseSpec.slug === source &&
        connection.caseSlug === target
      ) {
        match = candidate;
        break;
      }

      match ??= candidate;
    }

    if (match?.source === source && match?.target === target) break;
  }

  if (!match) {
    return {
      canonical: false,
      canonicalId,
      relationship: null,
      reason: 'player-only',
    };
  }

  if (match.status !== 'source') {
    return {
      canonical: false,
      canonicalId,
      relationship: match,
      reason: 'authored-proposed',
    };
  }

  const investigated = new Set(investigatedPlaceIds);
  if (!investigated.has(source) || !investigated.has(target)) {
    return {
      canonical: false,
      canonicalId,
      relationship: match,
      reason: 'case-not-investigated',
    };
  }

  return {
    canonical: true,
    canonicalId,
    relationship: match,
    reason: 'authored-source',
  };
}