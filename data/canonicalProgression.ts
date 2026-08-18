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
 * - Dust thresholds are authored exposure gates from the dossier.
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
      type: 'dust';
      value: number;
    }
  | {
      type: 'centroid';
      anchors: readonly [
        'mount-weather-emergency-operations-center',
        'cheyenne-mountain-complex',
        'raven-rock-mountain-complex',
      ];
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
    gate: { type: 'dust', value: 0 },
  },
  {
    order: 2,
    act: 1,
    phase: 'GROUND STATE',
    slug: 'bodie-ghost-town',
    name: 'Bodie Ghost Town',
    dossierSlug: 'bodie-ghost-town',
    gate: { type: 'dust', value: 0 },
  },
  {
    order: 3,
    act: 1,
    phase: 'GROUND STATE',
    slug: 'borovsko-bridge',
    name: 'Borovsko Bridge',
    dossierSlug: 'borovsko-bridge',
    gate: { type: 'dust', value: 0 },
  },
  {
    order: 4,
    act: 1,
    phase: 'GROUND STATE',
    slug: 'wittenoom',
    name: 'Wittenoom',
    dossierSlug: 'wittenoom',
    gate: { type: 'dust', value: 0 },
  },
  {
    order: 5,
    act: 1,
    phase: 'GROUND STATE',
    slug: 'sedlec-ossuary',
    name: 'Sedlec Ossuary',
    dossierSlug: 'sedlec-ossuary',
    gate: { type: 'dust', value: 0 },
  },
  {
    order: 6,
    act: 1,
    phase: 'GROUND STATE',
    slug: 'canfranc-international-railway-station',
    name: 'Canfranc International Railway Station',
    dossierSlug: 'canfranc-railway',
    gate: { type: 'dust', value: 0 },
  },
  {
    order: 7,
    act: 1,
    phase: 'GROUND STATE',
    slug: 'spreepark-berlin',
    name: 'Spreepark Berlin',
    dossierSlug: 'spreepark-berlin',
    gate: { type: 'dust', value: 0 },
  },
  {
    order: 8,
    act: 1,
    phase: 'GROUND STATE',
    slug: 'rhyolite',
    name: 'Rhyolite',
    dossierSlug: 'rhyolite',
    gate: { type: 'dust', value: 0 },
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
    gate: { type: 'dust', value: 15 },
  },
  {
    order: 10,
    act: 2,
    phase: 'ERASED LIVES',
    slug: 'pripyat-amusement-park',
    name: 'Pripyat Amusement Park',
    dossierSlug: 'pripyat-park',
    gate: { type: 'dust', value: 15 },
  },
  {
    order: 11,
    act: 2,
    phase: 'ERASED LIVES',
    slug: 'hashima-island',
    name: 'Hashima Island',
    dossierSlug: 'hashima-island',
    gate: { type: 'dust', value: 20 },
  },
  {
    order: 12,
    act: 2,
    phase: 'ERASED LIVES',
    slug: 'bhangarh-fort',
    name: 'Bhangarh Fort',
    dossierSlug: 'bhangarh-fort',
    gate: { type: 'dust', value: 20 },
  },
  {
    order: 13,
    act: 2,
    phase: 'ERASED LIVES',
    slug: 'isla-de-las-muecas',
    name: 'Isla de las Muñecas',
    dossierSlug: 'isla-muecas',
    gate: { type: 'dust', value: 25 },
  },
  {
    order: 14,
    act: 2,
    phase: 'ERASED LIVES',
    slug: 'kuldhara',
    name: 'Kuldhara',
    dossierSlug: 'kuldhara',
    gate: { type: 'dust', value: 25 },
  },
  {
    order: 15,
    act: 2,
    phase: 'ERASED LIVES',
    slug: 'aokigahara-forest',
    name: 'Aokigahara Forest',
    dossierSlug: 'aokigahara',
    gate: { type: 'dust', value: 30 },
  },
  {
    order: 16,
    act: 2,
    phase: 'ERASED LIVES',
    slug: 'nara-dreamland',
    name: 'Nara Dreamland',
    dossierSlug: 'nara-dreamland',
    gate: { type: 'dust', value: 30 },
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
    gate: { type: 'dust', value: 40 },
  },
  {
    order: 18,
    act: 3,
    phase: 'TEMPORAL BLEED',
    slug: 'duga-radar-array',
    name: 'DUGA Radar Array',
    dossierSlug: 'duga-radar',
    gate: { type: 'dust', value: 40 },
  },
  {
    order: 19,
    act: 3,
    phase: 'TEMPORAL BLEED',
    slug: 'duga-control-room',
    name: 'DUGA Control Room',
    dossierSlug: 'duga-control',
    gate: { type: 'dust', value: 45 },
  },
  {
    order: 20,
    act: 3,
    phase: 'TEMPORAL BLEED',
    slug: 'letchworth-village',
    name: 'Letchworth Village',
    dossierSlug: 'letchworth-vill',
    gate: { type: 'dust', value: 45 },
  },
  {
    order: 21,
    act: 3,
    phase: 'TEMPORAL BLEED',
    slug: 'willard-asylum-suitcases',
    name: 'Willard Asylum',
    dossierSlug: 'willard-asylum',
    gate: { type: 'dust', value: 50 },
  },
  {
    order: 22,
    act: 3,
    phase: 'TEMPORAL BLEED',
    slug: 'humberstone-saltpeter-works',
    name: 'Humberstone Saltpeter Works',
    dossierSlug: 'humberstone-works',
    gate: { type: 'dust', value: 50 },
  },
  {
    order: 23,
    act: 3,
    phase: 'TEMPORAL BLEED',
    slug: 'humberstone-saltpeter-morgue',
    name: 'Humberstone Saltpeter Morgue',
    dossierSlug: 'humberstone-morg',
    gate: { type: 'dust', value: 55 },
  },
  {
    order: 24,
    act: 3,
    phase: 'TEMPORAL BLEED',
    slug: 'eloise-psychiatric-hospital',
    name: 'Eloise Psychiatric Hospital',
    dossierSlug: 'eloise-hospital',
    gate: { type: 'dust', value: 55 },
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
    gate: { type: 'dust', value: 66 },
  },
  {
    order: 26,
    act: 4,
    phase: 'THE SILENCE',
    slug: 'byberry-state-hospital',
    name: 'Byberry State Hospital',
    dossierSlug: 'byberry-hospital',
    gate: { type: 'dust', value: 66 },
  },
  {
    order: 27,
    act: 4,
    phase: 'THE SILENCE',
    slug: 'poveglia-subterranean-ward',
    name: 'Poveglia Subterranean Ward',
    dossierSlug: 'poveglia-ward-x',
    gate: { type: 'dust', value: 70 },
  },
  {
    order: 28,
    act: 4,
    phase: 'THE SILENCE',
    slug: 'poveglia-island',
    name: 'Poveglia Island',
    dossierSlug: 'poveglia-island',
    gate: { type: 'dust', value: 70 },
  },
  {
    order: 29,
    act: 4,
    phase: 'THE SILENCE',
    slug: 'chteau-de-brissac',
    name: 'Château de Brissac',
    dossierSlug: 'chateau-brissac',
    gate: { type: 'dust', value: 75 },
  },
  {
    order: 30,
    act: 4,
    phase: 'THE SILENCE',
    slug: 'nocton-hall-raf-hospital',
    name: 'Nocton Hall RAF Hospital',
    dossierSlug: 'nocton-hall',
    gate: { type: 'dust', value: 75 },
  },
  {
    order: 31,
    act: 4,
    phase: 'THE SILENCE',
    slug: 'the-leap-castle-bloody-chapel',
    name: 'The Leap Castle Bloody Chapel',
    dossierSlug: 'leap-castle',
    gate: { type: 'dust', value: 80 },
  },
  {
    order: 32,
    act: 4,
    phase: 'THE SILENCE',
    slug: 'copemish-masonic-temple',
    name: 'Copemish Masonic Temple',
    dossierSlug: 'copemish-temple',
    gate: { type: 'dust', value: 80 },
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
    gate: { type: 'dust', value: 85 },
  },
  {
    order: 34,
    act: 5,
    phase: 'CONVERGENCE',
    slug: 'cheyenne-mountain-complex',
    name: 'Cheyenne Mountain Complex',
    dossierSlug: 'cheyenne-mount',
    gate: { type: 'dust', value: 85 },
  },
  {
    order: 35,
    act: 5,
    phase: 'CONVERGENCE',
    slug: 'raven-rock-mountain-complex',
    name: 'Raven Rock Complex',
    dossierSlug: 'raven-rock',
    gate: { type: 'dust', value: 85 },
  },
  {
    order: 36,
    act: 5,
    phase: 'CONVERGENCE',
    slug: 'the-grid-null-point',
    name: 'The Grid Null Point',
    dossierSlug: 'grid-null-point',
    gate: {
      type: 'centroid',
      anchors: [
        'mount-weather-emergency-operations-center',
        'cheyenne-mountain-complex',
        'raven-rock-mountain-complex',
      ],
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

export function getCanonicalDustGate(slug: string): number | undefined {
  const gate = getCanonicalCase(slug)?.gate;
  return gate?.type === 'dust' ? gate.value : undefined;
}
