import {
  CANONICAL_CASES as PROGRESSION_CASES,
  CANONICAL_CASE_COUNT as PROGRESSION_CASE_COUNT,
  getCanonicalCase as getProgressionCase,
} from '@/data/canonicalProgression';
import {
  CANONICAL_CASES as CONTRACT_CASES,
  getCanonicalCase as getContractCase,
} from '@/data/canonicalCases';

/**
 * Cross-registry validation for the canonical 36-case spine.
 *
 * canonicalProgression owns runtime access/gates.
 * canonicalCases owns authored narrative/completion contracts.
 *
 * Neither registry silently replaces the other.
 */

export interface CanonicalRegistryMismatch {
  slug: string;
  field:
    | 'count'
    | 'missing-from-progression'
    | 'missing-from-contract'
    | 'order'
    | 'act'
    | 'phase'
    | 'name';
  progression?: string | number;
  contract?: string | number;
}

export interface CanonicalRegistryValidation {
  valid: boolean;
  progressionCount: number;
  contractCount: number;
  mismatches: CanonicalRegistryMismatch[];
}

export function validateCanonicalCaseRegistries(): CanonicalRegistryValidation {
  const mismatches: CanonicalRegistryMismatch[] = [];

  const progressionCount = PROGRESSION_CASE_COUNT;
  const contractCount = CONTRACT_CASES.length;

  if (progressionCount !== contractCount) {
    mismatches.push({
      slug: '*',
      field: 'count',
      progression: progressionCount,
      contract: contractCount,
    });
  }

  for (const progressionCase of PROGRESSION_CASES) {
    const contractCase = getContractCase(progressionCase.slug);

    if (!contractCase) {
      mismatches.push({
        slug: progressionCase.slug,
        field: 'missing-from-contract',
      });
      continue;
    }

    if (progressionCase.order !== contractCase.order) {
      mismatches.push({
        slug: progressionCase.slug,
        field: 'order',
        progression: progressionCase.order,
        contract: contractCase.order,
      });
    }

    if (progressionCase.act !== contractCase.act) {
      mismatches.push({
        slug: progressionCase.slug,
        field: 'act',
        progression: progressionCase.act,
        contract: contractCase.act,
      });
    }

    if (progressionCase.phase !== contractCase.phase) {
      mismatches.push({
        slug: progressionCase.slug,
        field: 'phase',
        progression: progressionCase.phase,
        contract: contractCase.phase,
      });
    }

    if (progressionCase.name !== contractCase.name) {
      mismatches.push({
        slug: progressionCase.slug,
        field: 'name',
        progression: progressionCase.name,
        contract: contractCase.name,
      });
    }
  }

  for (const contractCase of CONTRACT_CASES) {
    if (!getProgressionCase(contractCase.slug)) {
      mismatches.push({
        slug: contractCase.slug,
        field: 'missing-from-progression',
      });
    }
  }

  return {
    valid: mismatches.length === 0,
    progressionCount,
    contractCount,
    mismatches,
  };
}