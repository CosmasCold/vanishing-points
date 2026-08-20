import type { EvidenceItem } from '@/types/investigation';
import { ACT_I_CASES } from '@/data/act1Cases';
import {
  getCanonicalCase,
  isCanonicalCaseCompletionAuthored,
} from '@/data/canonicalCases';

/**
 * Materialize authored source evidence from the reconciled Act I dossier.
 * These are catalogue records, not invented findings. Their purpose is to make
 * the authored case evidence available to the persistent investigation store
 * before a Dust exposure produces derived evidence.
 */
export function getAuthoredCaseEvidence(caseSlug: string): EvidenceItem[] {
  const spec = ACT_I_CASES.find((item) => item.slug === caseSlug);
  if (!spec) return [];

  return spec.evidence
    .filter((item) => item.status === 'source')
    .map((item) => ({
      id: item.id,
      type: 'document' as const,
      title: item.title,
      description: item.purpose,
      source: `Canonical dossier: ${spec.name}`,
      status: 'available',
      relatedTo: [],
      metadata: {
        case: spec.slug,
        contentStatus: item.status,
      },
    }));
}

export function getCanonicalRequiredEvidence(caseSlug: string): string[] {
  const spec = ACT_I_CASES.find((item) => item.slug === caseSlug);

  if (!spec || spec.completion.status !== 'source') {
    return [];
  }

  return spec.completion.requiredEvidence;
}

/**
 * Resolve a case against the canonical 36-case narrative spine.
 *
 * This is intentionally metadata-only for now.
 * It does not replace Act I authored evidence or completion evaluation.
 *
 * An outline case is never treated as runtime-complete merely because it
 * exists in the canonical registry.
 */
export function getCanonicalCaseStatus(caseSlug: string) {
  const canonicalCase = getCanonicalCase(caseSlug);

  if (!canonicalCase) {
    return {
      exists: false,
      authored: false,
      completionAuthored: false,
      case: undefined,
    };
  }

  return {
    exists: true,
    authored: canonicalCase.authoringStatus === 'authored-source',
    completionAuthored: isCanonicalCaseCompletionAuthored(caseSlug),
    case: canonicalCase,
  };
}