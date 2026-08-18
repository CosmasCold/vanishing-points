import type { EvidenceItem } from '@/types/investigation';

export const BODIE_WEATHERING_RECORD: EvidenceItem = {
  id: 'bodie-weathering-record',
  type: 'document',
  title: 'Weathering Record',
  description:
    'Recorded deterioration does not correspond consistently with the documented exposure history of several structures. The affected surfaces do not share a common orientation, material, or apparent weather pattern.',
  source: 'BUNKER_7 resonance log',
  status: 'available',
  relatedTo: [],
  metadata: {
    classification: 'environmental anomaly',
    case: 'bodie-ghost-town',
  },
};
