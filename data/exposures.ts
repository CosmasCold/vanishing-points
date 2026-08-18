import type { ExposureDefinition } from '@/logic/progression/exposure';
import { EXPOSURE_COSTS, registerExposure } from '@/logic/progression/exposure';

/**
 * Canonical authored Dust exposures.
 *
 * minimumDust is the perceptual threshold.
 * dustCost is the actual Dust expenditure.
 * These are deliberately separate concepts.
 */
export const EXPOSURES: ExposureDefinition[] = [
  {
    id: 'stelmo-locked-drawer',
    caseId: 'stelmo-light',
    title: 'St. Elmo — Document Provenance',
    depth: 'minor',
    dustCost: EXPOSURE_COSTS.minor,
    minimumDust: 5,
    resultEvidenceId: 'evidence-stelmo-locked-drawer',
    resultTitle: "Document Provenance — St. Elmo Keeper's Log",
    resultDescription:
      "The keeper's log is authenticated as Edward Vance's handwriting. Its recorded recovery location is a desk drawer that had been rusted shut since 1918. The document is dated 1942. No meaningful discrepancy was found in the handwriting or ink.",
    source: "BUNKER_7 Exposure Register / St. Elmo Keeper's Log",
    relatedTo: ['stelmo-light', 'doc-stelmo-001'],
  },
  {
    id: 'bodie-weathering-sequence',
    caseId: 'bodie-ghost-town',
    title: 'Bodie — Weathering Sequence',
    depth: 'minor',
    dustCost: EXPOSURE_COSTS.minor,
    minimumDust: 5,
    resultEvidenceId: 'evidence-bodie-weathering-sequence',
    resultTitle: 'Weathering Sequence Report',
    resultDescription:
      'A supplemental comparison of Bodie structures records exterior degradation preceding corresponding degradation of interior paper and textiles. The pattern repeats across multiple structures. No environmental explanation is recorded for the ordering.',
    source: 'BUNKER_7 Exposure Register / Bodie Closure Survey',
    relatedTo: ['bodie-ghost-town', 'doc-bod-001'],
  },
  {
    id: 'borovsko-missing-frequency',
    caseId: 'borovsko-bridge',
    title: 'Borovsko — Seismic Observation Addendum',
    depth: 'minor',
    dustCost: EXPOSURE_COSTS.minor,
    minimumDust: 5,
    resultEvidenceId: 'evidence-borovsko-missing-frequency',
    resultTitle: 'Seismic Observation Addendum',
    resultDescription:
      'The known 18 Hz signal persists beyond the expected observation area. A second monitoring position recorded a phase relationship incompatible with a single fixed source, despite no second source being identified.',
    source: 'BUNKER_7 Exposure Register / Borovsko Seismic Survey',
    relatedTo: ['borovsko-bridge', 'doc-bor-001'],
  },
  {
    id: 'wittenoom-deletion-index',
    caseId: 'wittenoom',
    title: 'Wittenoom — Regional Deletion Index',
    depth: 'moderate',
    dustCost: EXPOSURE_COSTS.moderate,
    minimumDust: 8,
    resultEvidenceId: 'evidence-wittenoom-deletion-index',
    resultTitle: 'Regional Deletion Index — WIT-07',
    resultDescription:
      'A regional deletion record confirms that Wittenoom was removed from public systems. The same administrative process retained 2,056 records classified as containing no indexable content. The erasure itself therefore left a persistent archival footprint.',
    source: 'BUNKER_7 Exposure Register / WIT-07 Administrative Deletion Batch',
    relatedTo: ['wittenoom', 'doc-wit-001'],
  },
  {
    id: 'sedlec-acoustic-pattern',
    caseId: 'sedlec-ossuary',
    title: 'Sedlec — Acoustic Pattern Analysis',
    depth: 'minor',
    dustCost: EXPOSURE_COSTS.minor,
    minimumDust: 5,
    resultEvidenceId: 'evidence-sedlec-acoustic-pattern',
    resultTitle: 'Acoustic Pattern Analysis — Sedlec',
    resultDescription:
      'The recorded 110 Hz acoustic signal contains a recurring deviation at approximately 47-second intervals. Across nineteen observed cycles, the deviations correlate with three structural positions within the chandelier. Correlation does not establish causation.',
    source: 'BUNKER_7 Exposure Register / Sedlec Acoustic Survey',
    relatedTo: ['sedlec-ossuary', 'doc-sed-001'],
  },
  {
    id: 'canfranc-future-crossreference',
    caseId: 'canfranc-station',
    title: 'Canfranc — Temporal Cross-Reference',
    depth: 'moderate',
    dustCost: EXPOSURE_COSTS.moderate,
    minimumDust: 8,
    resultEvidenceId: 'evidence-canfranc-future-crossreference',
    resultTitle: 'Temporal Cross-Reference',
    resultDescription:
      'The 2047 timestamp embedded in the 1943 manifest survives document-integrity checks. A second archival occurrence of the same date is confirmed, but its source remains unavailable. The date cannot presently be classified as an isolated archival error.',
    source: 'BUNKER_7 Exposure Register / Canfranc Temporal Index',
    relatedTo: ['canfranc-station', 'doc-can-001'],
  },
  {
    id: 'spreepark-empty-rotation',
    caseId: 'spreepark-berlin',
    title: 'Spreepark — Motion Signature Analysis',
    depth: 'moderate',
    dustCost: EXPOSURE_COSTS.moderate,
    minimumDust: 8,
    resultEvidenceId: 'evidence-spreepark-empty-rotation',
    resultTitle: 'Motion Signature Analysis — Ferris Wheel',
    resultDescription:
      'The Ferris wheel produces a stable 12 CPM carriage-frequency signature despite no measurable mechanical rotation, drive activity, or corresponding bearing movement. The signal behaves as though the ride is operating while the mechanism is not.',
    source: 'BUNKER_7 Exposure Register / Spreepark Motion Survey',
    relatedTo: ['spreepark-berlin', 'doc-spr-001'],
  },
  {
    id: 'rhyolite-unobserved-interval',
    caseId: 'rhyolite',
    title: 'Rhyolite — Geodetic Observation Interruption',
    depth: 'moderate',
    dustCost: EXPOSURE_COSTS.moderate,
    minimumDust: 8,
    resultEvidenceId: 'evidence-rhyolite-unobserved-interval',
    resultTitle: 'Geodetic Observation Interruption',
    resultDescription:
      'A controlled observation of Rhyolite was interrupted for seventeen seconds. When observation resumed, the recorded coordinates had shifted by 0.003 degrees. The Archive already contained an observation at the resulting coordinates attributed to INV_RED-7 during the current session.',
    source: 'BUNKER_7 Exposure Register / Rhyolite Geodetic Observation',
    relatedTo: ['rhyolite', 'doc-rhy-001'],
  },
];

EXPOSURES.forEach(registerExposure);

export function getAuthoredExposure(id: string): ExposureDefinition | undefined {
  return EXPOSURES.find((exposure) => exposure.id === id);
}
/** Backward-compatible lookup for command modules that still import getExposure. */
export const getExposure = getAuthoredExposure;
