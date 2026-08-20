/**
 * Vanishing Points
 * Canonical five-act case progression registry.
 *
 * SOURCE OF TRUTH:
 * - DECLASSIFIED CORE DOSSIER & NARRATIVE ARCHIVE: canonical 36-case Act I-V matrix.
 * - Runtime Atlas slugs are preserved where they differ from dossier slugs.
 *
 * IMPORTANT:
 * - This file defines authored narrative progression only.
 * - Atlas/place data remains responsible for geographic metadata.
 * - Historical Dust thresholds are retained as migration metadata only.
 *   Dust is observer exposure, not narrative progression.
 * - The five LEGACY cases at the bottom are retained in the corpus but are NOT
 *   part of the current 36-case narrative spine.
 */

export type CanonicalAct =
  | 1
  | 2
  | 3
  | 4
  | 5;

export type CanonicalGate =
  | {
      /**
       * Provisional migration gate for an act.
       *
       * Legacy Dust thresholds previously attached to individual cases are
       * intentionally not consulted. Until each case receives its authored
       * epistemic gate, cases inherit their act's availability frontier.
       */
      type: 'act';
      act: CanonicalAct;
    }
  | {
      /**
       * Final Grid Null Point convergence.
       *
       * The Null Point is not unlocked by geography alone. The player must
       * establish the three anchors, build the canonical geodetic triangle,
       * support the Signal hypothesis, and provide evidence for that hypothesis.
       */
      type: 'convergence';
      anchors: readonly [
        'mount-weather-emergency-operations-center',
        'cheyenne-mountain-complex',
        'raven-rock-mountain-complex',
      ];
      triangleConnections: readonly [
        readonly [
          'mount-weather-emergency-operations-center',
          'cheyenne-mountain-complex',
        ],
        readonly [
          'cheyenne-mountain-complex',
          'raven-rock-mountain-complex',
        ],
        readonly [
          'raven-rock-mountain-complex',
          'mount-weather-emergency-operations-center',
        ],
      ];
      signalHypothesisId: 'hyp-02-signal';
    };

export interface CanonicalCase {
  order: number;
  act: CanonicalAct;
  phase: string;
  slug: string;
  name: string;
  dossierSlug: string;
  gate: CanonicalGate;
}

/**
 * The current authored narrative spine.
 *
 * 36 cases:
 *   Act I   01-08
 *   Act II  09-16
 *   Act III 17-24
 *   Act IV  25-32
 *   Act V   33-36
 */
export const CANONICAL_CASES: readonly CanonicalCase[] = [
  // ---------------------------------------------------------------------------
  // ACT I: GROUND STATE
  // ---------------------------------------------------------------------------
  {
    order: 1,
    act: 1,
    phase: 'GROUND STATE',
    slug: 'stelmo-light',
    name: 'St. Elmo Lighthouse',
    dossierSlug: 'stelmo-light',
    gate: { type: 'act', act: 1 },
  },
  {
    order: 2,
    act: 1,
    phase: 'GROUND STATE',
    slug: 'bodie-ghost-town',
    name: 'Bodie Ghost Town',
    dossierSlug: 'bodie-ghost-town',
    gate: { type: 'act', act: 1 },
  },
  {
    order: 3,
    act: 1,
    phase: 'GROUND STATE',
    slug: 'borovsko-bridge',
    name: 'Borovsko Bridge',
    dossierSlug: 'borovsko-bridge',
    gate: { type: 'act', act: 1 },
  },
  {
    order: 4,
    act: 1,
    phase: 'GROUND STATE',
    slug: 'wittenoom',
    name: 'Wittenoom',
    dossierSlug: 'wittenoom',
    gate: { type: 'act', act: 1 },
  },
  {
    order: 5,
    act: 1,
    phase: 'GROUND STATE',
    slug: 'sedlec-ossuary',
    name: 'Sedlec Ossuary',
    dossierSlug: 'sedlec-ossuary',
    gate: { type: 'act', act: 1 },
  },
  {
    order: 6,
    act: 1,
    phase: 'GROUND STATE',
    slug: 'canfranc-international-railway-station',
    name: 'Canfranc International Railway Station',
    dossierSlug: 'canfranc-railway',
    gate: { type: 'act', act: 1 },
  },
  {
    order: 7,
    act: 1,
    phase: 'GROUND STATE',
    slug: 'spreepark-berlin',
    name: 'Spreepark Berlin',
    dossierSlug: 'spreepark-berlin',
    gate: { type: 'act', act: 1 },
  },
  {
    order: 8,
    act: 1,
    phase: 'GROUND STATE',
    slug: 'rhyolite',
    name: 'Rhyolite',
    dossierSlug: 'rhyolite',
    gate: { type: 'act', act: 1 },
  },

  // ---------------------------------------------------------------------------
  // ACT II: ERASED LIVES
  // ---------------------------------------------------------------------------
  {
    order: 9,
    act: 2,
    phase: 'ERASED LIVES',
    slug: 'gila-river-relocation-center',
    name: 'Gila River Relocation Center',
    dossierSlug: 'gila-river',
    gate: { type: 'act', act: 2 },
  },
  {
    order: 10,
    act: 2,
    phase: 'ERASED LIVES',
    slug: 'pripyat-amusement-park',
    name: 'Pripyat Amusement Park',
    dossierSlug: 'pripyat-park',
    gate: { type: 'act', act: 2 },
  },
  {
    order: 11,
    act: 2,
    phase: 'ERASED LIVES',
    slug: 'hashima-island',
    name: 'Hashima Island',
    dossierSlug: 'hashima-island',
    gate: { type: 'act', act: 2 },
  },
  {
    order: 12,
    act: 2,
    phase: 'ERASED LIVES',
    slug: 'bhangarh-fort',
    name: 'Bhangarh Fort',
    dossierSlug: 'bhangarh-fort',
    gate: { type: 'act', act: 2 },
  },
  {
    order: 13,
    act: 2,
    phase: 'ERASED LIVES',
    slug: 'isla-de-las-muecas',
    name: 'Isla de las Muñecas',
    dossierSlug: 'isla-muecas',
    gate: { type: 'act', act: 2 },
  },
  {
    order: 14,
    act: 2,
    phase: 'ERASED LIVES',
    slug: 'kuldhara',
    name: 'Kuldhara',
    dossierSlug: 'kuldhara',
    gate: { type: 'act', act: 2 },
  },
  {
    order: 15,
    act: 2,
    phase: 'ERASED LIVES',
    slug: 'aokigahara-forest',
    name: 'Aokigahara Forest',
    dossierSlug: 'aokigahara',
    gate: { type: 'act', act: 2 },
  },
  {
    order: 16,
    act: 2,
    phase: 'ERASED LIVES',
    slug: 'nara-dreamland',
    name: 'Nara Dreamland',
    dossierSlug: 'nara-dreamland',
    gate: { type: 'act', act: 2 },
  },

  // ---------------------------------------------------------------------------
  // ACT III: TEMPORAL BLEED
  // ---------------------------------------------------------------------------
  {
    order: 17,
    act: 3,
    phase: 'TEMPORAL BLEED',
    slug: 'pripyat-hospital-126',
    name: 'Pripyat Hospital 126',
    dossierSlug: 'pripyat-hosp-126',
    gate: { type: 'act', act: 3 },
  },
  {
    order: 18,
    act: 3,
    phase: 'TEMPORAL BLEED',
    slug: 'duga-radar-array',
    name: 'DUGA Radar Array',
    dossierSlug: 'duga-radar',
    gate: { type: 'act', act: 3 },
  },
  {
    order: 19,
    act: 3,
    phase: 'TEMPORAL BLEED',
    slug: 'duga-control-room',
    name: 'DUGA Control Room',
    dossierSlug: 'duga-control',
    gate: { type: 'act', act: 3 },
  },
  {
    order: 20,
    act: 3,
    phase: 'TEMPORAL BLEED',
    slug: 'letchworth-village',
    name: 'Letchworth Village',
    dossierSlug: 'letchworth-vill',
    gate: { type: 'act', act: 3 },
  },
  {
    order: 21,
    act: 3,
    phase: 'TEMPORAL BLEED',
    slug: 'willard-asylum-suitcases',
    name: 'Willard Asylum',
    dossierSlug: 'willard-asylum',
    gate: { type: 'act', act: 3 },
  },
  {
    order: 22,
    act: 3,
    phase: 'TEMPORAL BLEED',
    slug: 'humberstone-saltpeter-works',
    name: 'Humberstone Saltpeter Works',
    dossierSlug: 'humberstone-works',
    gate: { type: 'act', act: 3 },
  },
  {
    order: 23,
    act: 3,
    phase: 'TEMPORAL BLEED',
    slug: 'humberstone-saltpeter-morgue',
    name: 'Humberstone Saltpeter Morgue',
    dossierSlug: 'humberstone-morg',
    gate: { type: 'act', act: 3 },
  },
  {
    order: 24,
    act: 3,
    phase: 'TEMPORAL BLEED',
    slug: 'eloise-psychiatric-hospital',
    name: 'Eloise Psychiatric Hospital',
    dossierSlug: 'eloise-hospital',
    gate: { type: 'act', act: 3 },
  },

  // ---------------------------------------------------------------------------
  // ACT IV: THE SILENCE
  // ---------------------------------------------------------------------------
  {
    order: 25,
    act: 4,
    phase: 'THE SILENCE',
    slug: 'teufelsberg-echo-dome',
    name: 'Teufelsberg Echo Dome',
    dossierSlug: 'teufelsberg-dome',
    gate: { type: 'act', act: 4 },
  },
  {
    order: 26,
    act: 4,
    phase: 'THE SILENCE',
    slug: 'byberry-state-hospital',
    name: 'Byberry State Hospital',
    dossierSlug: 'byberry-hospital',
    gate: { type: 'act', act: 4 },
  },
  {
    order: 27,
    act: 4,
    phase: 'THE SILENCE',
    slug: 'poveglia-subterranean-ward',
    name: 'Poveglia Subterranean Ward',
    dossierSlug: 'poveglia-ward-x',
    gate: { type: 'act', act: 4 },
  },
  {
    order: 28,
    act: 4,
    phase: 'THE SILENCE',
    slug: 'poveglia-island',
    name: 'Poveglia Island',
    dossierSlug: 'poveglia-island',
    gate: { type: 'act', act: 4 },
  },
  {
    order: 29,
    act: 4,
    phase: 'THE SILENCE',
    slug: 'chteau-de-brissac',
    name: 'Château de Brissac',
    dossierSlug: 'chateau-brissac',
    gate: { type: 'act', act: 4 },
  },
  {
    order: 30,
    act: 4,
    phase: 'THE SILENCE',
    slug: 'nocton-hall-raf-hospital',
    name: 'Nocton Hall RAF Hospital',
    dossierSlug: 'nocton-hall',
    gate: { type: 'act', act: 4 },
  },
  {
    order: 31,
    act: 4,
    phase: 'THE SILENCE',
    slug: 'the-leap-castle-bloody-chapel',
    name: 'The Leap Castle Bloody Chapel',
    dossierSlug: 'leap-castle',
    gate: { type: 'act', act: 4 },
  },
  {
    order: 32,
    act: 4,
    phase: 'THE SILENCE',
    slug: 'copemish-masonic-temple',
    name: 'Copemish Masonic Temple',
    dossierSlug: 'copemish-temple',
    gate: { type: 'act', act: 4 },
  },

  // ---------------------------------------------------------------------------
  // ACT V: CONVERGENCE
  // ---------------------------------------------------------------------------
  {
    order: 33,
    act: 5,
    phase: 'CONVERGENCE',
    slug: 'mount-weather-emergency-operations-center',
    name: 'Mount Weather EOC',
    dossierSlug: 'mount-weather',
    gate: { type: 'act', act: 5 },
  },
  {
    order: 34,
    act: 5,
    phase: 'CONVERGENCE',
    slug: 'cheyenne-mountain-complex',
    name: 'Cheyenne Mountain Complex',
    dossierSlug: 'cheyenne-mount',
    gate: { type: 'act', act: 5 },
  },
  {
    order: 35,
    act: 5,
    phase: 'CONVERGENCE',
    slug: 'raven-rock-mountain-complex',
    name: 'Raven Rock Complex',
    dossierSlug: 'raven-rock',
    gate: { type: 'act', act: 5 },
  },
  {
    order: 36,
    act: 5,
    phase: 'CONVERGENCE',
    slug: 'the-grid-null-point',
    name: 'The Grid Null Point',
    dossierSlug: 'grid-null-point',
    gate: {
      type: 'convergence',
      anchors: [
        'mount-weather-emergency-operations-center',
        'cheyenne-mountain-complex',
        'raven-rock-mountain-complex',
      ],
      triangleConnections: [
        [
          'mount-weather-emergency-operations-center',
          'cheyenne-mountain-complex',
        ],
        [
          'cheyenne-mountain-complex',
          'raven-rock-mountain-complex',
        ],
        [
          'raven-rock-mountain-complex',
          'mount-weather-emergency-operations-center',
        ],
      ],
      signalHypothesisId: 'hyp-02-signal',
    },
  },
] as const;

/**
 * These exist in the current runtime Layer-A registry but do not belong to the
 * current 36-case Act I-V dossier.
 *
 * RETAINED: yes
 * NARRATIVE SPINE: no
 * ACTION: do not delete yet. Route them out of canonical case progression.
 */
export const LEGACY_CASE_SLUGS = [
  'blackwood-hospital',
  'eastern-state-penitentiary',
  'the-stanley-hotel',
  'pyramiden',
  'the-vanishing-hospital',
] as const;

export const CANONICAL_CASE_BY_SLUG = new Map(
  CANONICAL_CASES.map((item) => [item.slug, item]),
);

export const CANONICAL_CASE_COUNT = CANONICAL_CASES.length;

export function getCanonicalCase(slug: string): CanonicalCase | undefined {
  return CANONICAL_CASE_BY_SLUG.get(slug);
}

export function getCanonicalAct(slug: string): CanonicalAct | undefined {
  return getCanonicalCase(slug)?.act;
}

/**
 * Dust is no longer a canonical narrative gate.
 *
 * Exposure definitions own Dust requirements. This helper remains exported
 * temporarily so legacy consumers fail safely rather than reintroducing Dust
 * as story progression.
 */
export function getCanonicalDustGate(slug: string): undefined {
  void slug;
  return undefined;
}
