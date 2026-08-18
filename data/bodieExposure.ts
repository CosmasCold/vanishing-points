import type { EvidenceItem } from '@/types/investigation';

export const BODIE_EXPOSURE_COST = 5;

export const BODIE_INTERNAL_WEATHERING_EVIDENCE: EvidenceItem = {
  id: 'bodie-internal-weathering-pattern',
  type: 'signal',
  title: 'Internal Weathering Pattern',
  description:
    'Several affected structures show deterioration beginning beneath the visible surface of the material. The pattern does not correspond to ordinary external exposure.',
  source: 'Bodie exposure record',
  status: 'available',
  relatedTo: ['bodie-weathering-record'],
  metadata: {
    classification: 'environmental anomaly',
    case: 'bodie-ghost-town',
    origin: 'dust exposure',
  },
};

export const BODIE_EXPOSURE_RESULT = {
  exposureId: 'bodie-weathering-exposure',
  sourceEvidenceId: 'bodie-weathering-record',
  resultEvidence: BODIE_INTERNAL_WEATHERING_EVIDENCE,
  cost: BODIE_EXPOSURE_COST,
} as const;
