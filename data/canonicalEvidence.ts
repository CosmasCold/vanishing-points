import type { EvidenceItem } from '@/types/investigation';
import { ACT_I_CASES } from '@/data/act1Cases';

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
      source: 'ACT I CASE DOSSIER',
      status: 'available' as const,
      relatedTo: [caseSlug],
      metadata: {
        classification: 'authored source evidence',
        case: caseSlug,
        contentStatus: item.status,
      },
    }));
}

export function getCanonicalRequiredEvidence(caseSlug: string): string[] {
  const spec = ACT_I_CASES.find((item) => item.slug === caseSlug);
  return spec ? [...new Set(spec.completion.requiredEvidence)] : [];
}
