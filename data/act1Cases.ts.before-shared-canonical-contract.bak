/**
 * VANISHING POINTS :: ACT I RECONCILED CASE DATA
 *
 * Reconciled against the existing project corpus.
 *
 * STATUS VALUES:
 *   source   = directly supported by existing authored project material
 *   proposed = new design material, not yet canonized
 *
 * This file is DATA-ONLY. It is not imported by runtime code yet.
 */

export type ContentStatus = 'source' | 'proposed';

export type ExposureDepth =
  | 'minor'
  | 'moderate'
  | 'deep';

export interface EvidenceSpec {
  id: string;
  title: string;
  status: ContentStatus;
  purpose: string;
}

export interface CaseConnection {
  caseSlug: string;
  relationship: string;
  status: ContentStatus;
}

export interface Act1CaseSpec {
  slug: string;
  name: string;
  act: 1;
  tier: 0;

  canonicalRole: string;
  roleStatus: ContentStatus;

  existingPrimaryDocument?: string;

  exposure: {
    id: string;
    depth: ExposureDepth;
    dustCost: 5 | 8 | 15;
    minimumDust: 5 | 8 | 15;
    status: ContentStatus;
  };

  primaryAnomaly: {
    statement: string;
    status: ContentStatus;
  };

  evidence: EvidenceSpec[];

  contradiction: {
    statement: string;
    status: ContentStatus;
  };

  connections: CaseConnection[];

  hypothesis: {
    id: string;
    statement: string;
    status: ContentStatus;
  };

  /**
   * Canonical case-completion contract.
   *
   * The optional fields are deliberately additive. They do not become
   * requirements until an individual case explicitly authors them and its
   * completion status is promoted to `source`.
   */
  completion: {
    requiredEvidence: string[];
    requiredHypothesis: string;
    requiredHypothesisEvidence?: string[];
    requiredBoardConnections?: string[];
    requiredKnowledge?: string[];
    requiredContradictions?: string[];
    status: ContentStatus;
  };

  payoff: {
    statement: string;
    status: ContentStatus;
  };
}

/**
 * ACT I: GROUND STATE
 *
 * Canonical eight-case lineup from the master narrative:
 * St. Elmo, Bodie, Borovsko, Wittenoom, Sedlec, Canfranc,
 * Spreepark, Rhyolite.
 *
 * The exact authored exposure results remain proposed unless
 * explicitly supported by existing project material.
 */
export const ACT_I_CASES: Act1CaseSpec[] = [
  {
    slug: 'stelmo-light',
    name: 'St. Elmo Lighthouse',
    act: 1,
    tier: 0,

    canonicalRole: 'Subtle, mechanical sags.',
    roleStatus: "source",

    existingPrimaryDocument: 'doc-stelmo-001',

    exposure: {
      id: 'stelmo-mechanical-exposure',
      depth: 'minor',
      dustCost: 5,
      minimumDust: 5,
      status: "proposed",
    },

    primaryAnomaly: {
      statement:
        'Keeper Edward Vance reports that the lamp was already lit when he woke, despite his forty-year record of personally maintaining it.',
      status: "source",
    },

    evidence: [
      {
        id: 'doc-stelmo-001',
        title: "Keeper's Log — St. Elmo Light",
        status: "source",
        purpose:
          'Existing Tier 0 keeper log documenting the lamp lighting itself and the archive anomaly around the locked drawer.',
      },
      {
        id: 'evidence-stelmo-locked-drawer',
        title: 'Mechanical Exposure Record',
        status: "proposed",
        purpose:
          'New evidence to be authored as the Dust exposure result.',
      },
    ],

    contradiction: {
      statement:
        "Vance's account conflicts with his established maintenance routine: the lamp performs its function without the action that historically caused it.",
      status: "proposed",
    },

    connections: [
      {
        caseSlug: 'bodie-ghost-town',
        relationship:
          'Both begin with ordinary physical conditions that do not cleanly match their records.',
        status: "proposed",
      },
    ],

    hypothesis: {
      id: 'hyp-physical-record-drift',
      statement:
        'Physical states at abandoned sites may not correspond reliably to their archived histories.',
      status: "proposed",
    },

    completion: {
      requiredEvidence: [
        'doc-stelmo-001',
        'evidence-stelmo-locked-drawer',
      ],
      requiredHypothesis: 'hyp-physical-record-drift',
      status: "proposed",
    },

    payoff: {
      statement:
        'The investigator learns to compare a documented physical process with the record of who or what performed it.',
      status: "proposed",
    },
  },

  {
    slug: 'bodie-ghost-town',
    name: 'Bodie Ghost Town',
    act: 1,
    tier: 0,

    canonicalRole: 'Uncanny weathering logs.',
    roleStatus: "source",

    existingPrimaryDocument: 'doc-bod-001',

    exposure: {
      id: 'bodie-closure-echo',
      depth: 'minor',
      dustCost: 5,
      minimumDust: 5,
      status: "source",
    },

    primaryAnomaly: {
      statement:
        'The existing investigation evidence describes deterioration that does not consistently correspond with documented exposure history across several structures.',
      status: "source",
    },

    evidence: [
      {
        id: 'doc-bod-001',
        title: 'Historical Dossier — Bodie Survey of 1942',
        status: "source",
        purpose:
          'Existing closure survey describing the untouched residences, dinner settings, schoolbooks, and lack of footprints.',
      },
      {
        id: 'bodie-weathering-record',
        title: 'Weathering Record',
        status: "source",
        purpose:
          'Existing investigation evidence already catalogued in the working game.',
      },
      {
        id: 'evidence-bodie-weathering-sequence',
        title: 'Exposure Record — Bodie Closure Echo',
        status: "proposed",
        purpose:
          'New evidence produced by the canonical 5-Dust exposure.',
      },
    ],

    contradiction: {
      statement:
        'The recorded deterioration does not consistently match the documented exposure history of the affected structures.',
      status: "source",
    },

    connections: [
      {
        caseSlug: 'stelmo-light',
        relationship:
          'Both establish a mismatch between an observed physical state and its record.',
        status: "proposed",
      },
    ],

    hypothesis: {
      id: 'hyp-physical-record-drift',
      statement:
        'Physical states at abandoned sites may not correspond reliably to their archived histories.',
      status: "proposed",
    },

    completion: {
      requiredEvidence: [
        'doc-bod-001',
        'bodie-weathering-record',
        'evidence-bodie-weathering-sequence',
      ],
      requiredHypothesis: 'hyp-physical-record-drift',
      status: "proposed",
    },

    payoff: {
      statement:
        'Bodie becomes the first demonstrated distinction between ordinary evidence and deliberately induced exposure.',
      status: "proposed",
    },
  },

  {
    slug: 'borovsko-bridge',
    name: 'Borovsko Bridge',
    act: 1,
    tier: 0,

    canonicalRole: 'Tier 0 anomaly.',
    roleStatus: "source",

    existingPrimaryDocument: 'doc-bor-001',

    exposure: {
      id: 'borovsko-dead-span',
      depth: 'minor',
      dustCost: 5,
      minimumDust: 5,
      status: "proposed",
    },

    primaryAnomaly: {
      statement:
        'The completed reinforced-concrete arch ends 20 meters above the reservoir with no approach roads or connected spans, while its eastern pylon records constant 18 Hz infrasound.',
      status: "source",
    },

    evidence: [
      {
        id: 'doc-bor-001',
        title: 'Pylon Engineering Survey — Borovsko Bridge',
        status: "source",
        purpose:
          'Existing Tier 0 blueprint describing the impossible bridge geometry and 18 Hz vibration.',
      },
      {
        id: 'evidence-borovsko-missing-frequency',
        title: 'Dead Span Measurement',
        status: "proposed",
        purpose:
          'New exposure result to be authored from the existing bridge anomaly.',
      },
    ],

    contradiction: {
      statement:
        'The engineering record documents a completed bridge whose intended destination was never physically connected to the structure.',
      status: "source",
    },

    connections: [
      {
        caseSlug: 'stelmo-light',
        relationship:
          'Both use physical infrastructure as the first observable contradiction.',
        status: "proposed",
      },
      {
        caseSlug: 'bodie-ghost-town',
        relationship:
          'Both expose a mismatch between a surviving physical state and the history that should explain it.',
        status: "proposed",
      },
    ],

    hypothesis: {
      id: 'hyp-physical-record-drift',
      statement:
        'Physical infrastructure can preserve a state that its historical explanation cannot fully account for.',
      status: "proposed",
    },

    completion: {
      requiredEvidence: [
        'doc-bor-001',
        'evidence-borovsko-missing-frequency',
      ],
      requiredHypothesis: 'hyp-physical-record-drift',
      status: "proposed",
    },

    payoff: {
      statement:
        'The investigator learns that a technical record can itself be the anomalous object.',
      status: "proposed",
    },
  },

  {
    slug: 'wittenoom',
    name: 'Wittenoom',
    act: 1,
    tier: 0,

    canonicalRole: 'Erasure / institutional absence.',
    roleStatus: "source",

    existingPrimaryDocument: 'doc-wit-001',

    exposure: {
      id: 'wittenoom-erasure-recovery',
      depth: 'moderate',
      dustCost: 8,
      minimumDust: 8,
      status: "proposed",
    },

    primaryAnomaly: {
      statement:
        'Municipal services, signs, mail routes, and the town itself were officially removed, yet the original municipal seals remain readable under coaxial UV.',
      status: "source",
    },

    evidence: [
      {
        id: 'doc-wit-001',
        title: 'Municipal Erasure Dossier — Wittenoom Blue Asbestos',
        status: "source",
        purpose:
          'Existing Tier 0 dossier documenting administrative erasure and the surviving UV-readable municipal seals.',
      },
      {
        id: 'evidence-wittenoom-deletion-index',
        title: 'Recovered Municipal Seal',
        status: "proposed",
        purpose:
          'New exposure result isolating the contradiction between official absence and surviving archival identity.',
      },
    ],

    contradiction: {
      statement:
        'The administrative record removes Wittenoom while retaining a surviving identifier for the thing it says has been removed.',
      status: "source",
    },

    connections: [
      {
        caseSlug: 'sedlec-ossuary',
        relationship:
          'Both require attention to information embedded in records and markings rather than only the location itself.',
        status: "proposed",
      },
    ],

    hypothesis: {
      id: 'hyp-systematic-erasure',
      statement:
        'Administrative absence can itself become observable evidence.',
      status: "proposed",
    },

    completion: {
      requiredEvidence: [
        'doc-wit-001',
        'evidence-wittenoom-deletion-index',
      ],
      requiredHypothesis: 'hyp-systematic-erasure',
      status: "proposed",
    },

    payoff: {
      statement:
        'The player begins to suspect that the Archive may preserve traces of things that official records attempt to erase.',
      status: "proposed",
    },
  },

  {
    slug: 'sedlec-ossuary',
    name: 'Sedlec Ossuary',
    act: 1,
    tier: 0,

    canonicalRole: 'Tier 0 anomaly.',
    roleStatus: "source",

    existingPrimaryDocument: 'doc-sed-001',

    exposure: {
      id: 'sedlec-chime-pattern',
      depth: 'minor',
      dustCost: 5,
      minimumDust: 5,
      status: "proposed",
    },

    primaryAnomaly: {
      statement:
        'The chandelier assembly record describes forty thousand skeletons, a UV-readable signature in bone, and a slow-warp 110 Hz acoustic loop recorded by geophones.',
      status: "source",
    },

    evidence: [
      {
        id: 'doc-sed-001',
        title: 'Chandelier Assembly Logs — Sedlec Ossuary',
        status: "source",
        purpose:
          'Existing Tier 0 journal containing the 110 Hz chime and UV signature.',
      },
      {
        id: 'evidence-sedlec-acoustic-pattern',
        title: 'Chime Pattern Record',
        status: "proposed",
        purpose:
          'New exposure result focusing the investigation on the repeatable acoustic pattern.',
      },
    ],

    contradiction: {
      statement:
        'The documented decorative arrangement is associated with a repeatable acoustic behavior that its ordinary historical description does not explain.',
      status: "proposed",
    },

    connections: [
      {
        caseSlug: 'borovsko-bridge',
        relationship:
          'Both contain measurable signals embedded in otherwise ordinary structural records.',
        status: "proposed",
      },
    ],

    hypothesis: {
      id: 'hyp-recurring-pattern',
      statement:
        'Repeatable patterns inside ordinary records may carry investigative significance.',
      status: "proposed",
    },

    completion: {
      requiredEvidence: [
        'doc-sed-001',
        'evidence-sedlec-acoustic-pattern',
      ],
      requiredHypothesis: 'hyp-recurring-pattern',
      status: "proposed",
    },

    payoff: {
      statement:
        'The investigator learns to look for recurrence rather than merely unusual individual events.',
      status: "proposed",
    },
  },

  {
    slug: 'canfranc-international-railway-station',
    name: 'Canfranc International Railway Station',
    act: 1,
    tier: 0,

    canonicalRole: 'Tier 0 anomaly.',
    roleStatus: "source",

    existingPrimaryDocument: 'doc-can-001',

    exposure: {
      id: 'canfranc-future-timestamp',
      depth: 'moderate',
      dustCost: 8,
      minimumDust: 8,
      status: "proposed",
    },

    primaryAnomaly: {
      statement:
        'A 1943 transit manifest contains the timestamp December 17, 2047, while the station is empty, its clocks are stopped, and Hangar 3 produces a steady non-repeating acoustic hum.',
      status: "source",
    },

    evidence: [
      {
        id: 'doc-can-001',
        title: 'Gold Transit Manifest — Canfranc International Station',
        status: "source",
        purpose:
          'Existing Tier 0 telegram containing the impossible 2047 timestamp and Hangar 3 anomaly.',
      },
      {
        id: 'evidence-canfranc-future-crossreference',
        title: 'Future Timestamp Analysis',
        status: "proposed",
        purpose:
          'New exposure result isolating the temporal contradiction already present in the manifest.',
      },
    ],

    contradiction: {
      statement:
        'A document dated within the 1943 investigation contains a timestamp from 2047.',
      status: "source",
    },

    connections: [
      {
        caseSlug: 'wittenoom',
        relationship:
          'Wittenoom demonstrates archival erasure; Canfranc demonstrates an impossible archival presence.',
        status: "proposed",
      },
      {
        caseSlug: 'spreepark-berlin',
        relationship:
          'Canfranc establishes the first explicit temporal contradiction in Act I; Spreepark will examine physical persistence against its own record.',
        status: "proposed",
      },
    ],

    hypothesis: {
      id: 'hyp-temporal-displacement',
      statement:
        'The Archive may contain records whose chronological relationships are not stable.',
      status: "proposed",
    },

    completion: {
      requiredEvidence: [
        'doc-can-001',
        'evidence-canfranc-future-crossreference',
      ],
      requiredHypothesis: 'hyp-temporal-displacement',
      status: "proposed",
    },

    payoff: {
      statement:
        'The player encounters a future date inside a historical record without receiving an explanation for it.',
      status: "proposed",
    },
  },

  {
    slug: 'spreepark-berlin',
    name: 'Spreepark Berlin',
    act: 1,
    tier: 0,

    canonicalRole: 'Tier 0 anomaly.',
    roleStatus: "source",

    existingPrimaryDocument: 'doc-spr-001',

    exposure: {
      id: 'spreepark-impossible-motion',
      depth: 'moderate',
      dustCost: 8,
      minimumDust: 8,
      status: "proposed",
    },

    primaryAnomaly: {
      statement:
        'The Ferris wheel rotates slightly in wind even though its drive mechanics have been locked by rust since 1999, while geophones detect a rhythmic 12 CPM carriage thud.',
      status: "source",
    },

    evidence: [
      {
        id: 'doc-spr-001',
        title: 'Narcotics Seizure — Spreepark Berlin',
        status: "source",
        purpose:
          'Existing Tier 0 field report containing the locked Ferris wheel and 12 CPM signal.',
      },
      {
        id: 'evidence-spreepark-empty-rotation',
        title: 'Impossible Motion Record',
        status: "proposed",
        purpose:
          'New exposure result isolating the relationship between locked mechanics and observed motion.',
      },
    ],

    contradiction: {
      statement:
        'The recorded motion is inconsistent with the documented mechanical condition of the Ferris wheel.',
      status: "source",
    },

    connections: [
      {
        caseSlug: 'canfranc-international-railway-station',
        relationship:
          'Canfranc destabilizes chronology; Spreepark destabilizes the expected relationship between a physical cause and its recorded effect.',
        status: "proposed",
      },
      {
        caseSlug: 'stelmo-light',
        relationship:
          'Both involve a system continuing to operate after the documented operator or mechanism should have ceased doing so.',
        status: "proposed",
      },
    ],

    hypothesis: {
      id: 'hyp-causal-displacement',
      statement:
        'An observed effect may persist after the recorded cause is absent or no longer capable of producing it.',
      status: "proposed",
    },

    completion: {
      requiredEvidence: [
        'doc-spr-001',
        'evidence-spreepark-empty-rotation',
      ],
      requiredHypothesis: 'hyp-causal-displacement',
      status: "proposed",
    },

    payoff: {
      statement:
        'The investigator begins separating an event from the mechanism that supposedly produced it.',
      status: "proposed",
    },
  },

  {
    slug: 'rhyolite',
    name: 'Rhyolite',
    act: 1,
    tier: 0,

    canonicalRole: 'Tier 0 anomaly.',
    roleStatus: "source",

    existingPrimaryDocument: 'doc-rhy-001',

    exposure: {
      id: 'rhyolite-coordinate-drift',
      depth: 'deep',
      dustCost: 15,
      minimumDust: 15,
      status: "source",
    },

    primaryAnomaly: {
      statement:
        "The location's coordinates drift by 0.003 degrees when no one is observing.",
      status: "source",
    },

    evidence: [
      {
        id: 'doc-rhy-001',
        title: 'Marble Transit Ledger — Cook Bank, Rhyolite',
        status: "source",
        purpose:
          'Existing Tier 0 ledger describing the bank, the self-writing ledger, and shadows moving without light.',
      },
      {
        id: 'evidence-rhyolite-unobserved-interval',
        title: 'Coordinate Drift Record',
        status: "proposed",
        purpose:
          'New exposure result directly derived from the existing authored resonance note.',
      },
      {
        id: 'evidence-rhyolite-observer-index',
        title: 'Observer Index',
        status: "proposed",
        purpose:
          'Possible later-stage evidence connecting the anomaly to the observer; not yet established as Act I canon.',
      },
    ],

    contradiction: {
      statement:
        "A location's recorded coordinates change depending on whether anyone is observing it.",
      status: "source",
    },

    connections: [
      {
        caseSlug: 'bodie-ghost-town',
        relationship:
          'Both involve a physical state that resists stable archival description.',
        status: "source",
      },
      {
        caseSlug: 'canfranc-international-railway-station',
        relationship:
          'Canfranc destabilizes time in the record; Rhyolite destabilizes spatial position under observation.',
        status: "proposed",
      },
    ],

    hypothesis: {
      id: 'hyp-observer-dependent-state',
      statement:
        'The state of a location may depend on whether it is being observed.',
      status: "proposed",
    },

    completion: {
      requiredEvidence: [
        'doc-rhy-001',
        'evidence-rhyolite-unobserved-interval',
      ],
      requiredHypothesis: 'hyp-observer-dependent-state',
      status: "proposed",
    },

    payoff: {
      statement:
        'Act I ends by shifting the investigator from asking what is wrong with a place to asking whether observation itself is part of the anomaly.',
      status: "proposed",
    },
  },
];

export const ACT_I_CASE_BY_SLUG = new Map(
  ACT_I_CASES.map((caseSpec) => [caseSpec.slug, caseSpec])
);

/** Executable exposure registry reconciliation. The narrative case slug and
 * the runtime exposure caseId intentionally differ for Canfranc. */
export const ACT_I_EXPOSURE_CASE_IDS: Record<string, string> = {
  'canfranc-international-railway-station': 'canfranc-station',
};
