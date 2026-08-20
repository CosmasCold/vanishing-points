'use client';

import React, { useMemo } from 'react';
import { useAtlasStore } from '@/state/atlasStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useUIStore } from '@/state/uiStore';
import { useProgressionStore } from '@/state/progressionStore';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography } from '@/styles/theme';
import {
  BookOpen,
  AlertTriangle,
  ShieldAlert,
  FolderLock,
  FileDigit,
} from 'lucide-react';
import { evaluateCanonicalCaseAccess } from '@/lib/investigationAccess';
import { ACT_I_CASES } from '@/data/act1Cases';
import {
  CANONICAL_CASE_COUNT,
  getCanonicalCase,
} from '@/data/canonicalProgression';

/*
 * Canonical investigation registry.
 *
 * The Atlas is the geographic source of truth, but Cases is the narrative
 * source of truth. A case therefore must not disappear merely because its
 * geographic Place record has not been reconciled yet.
 *
 * IMPORTANT:
 * - Do not manufacture coordinates, addresses, danger levels, or access gates.
 * - Blackwood and St. Elmo have authored case data in the corpus.
 * - Cheyenne Mountain and Raven Rock are authored narrative anchors, but the
 *   current corpus does not contain individual Place records for them.
 * - Unmapped cases remain visible and explicitly locked until their Place
 *   records exist. This prevents a fake [0,0] marker or a fabricated location.
 */
interface CanonicalCaseDefinition {
  slug: string;
  name: string;
  fallbackTier: number;
  fallbackStatus: string;
  fallbackDangerLevel: number;
}

const CANONICAL_CASES: CanonicalCaseDefinition[] = [
  {
    slug: 'aokigahara-forest',
    name: 'Aokigahara Forest',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 5,
  },
  {
    slug: 'beelitz-surgery-basement',
    name: 'Beelitz Surgery Basement',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'bhangarh-fort',
    name: 'Bhangarh Fort',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'blackwood-hospital',
    name: 'Blackwood Hospital',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 3,
  },
  {
    slug: 'bodie-ghost-town',
    name: 'Bodie Ghost Town',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'borovsko-bridge',
    name: 'Borovsko Bridge',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'byberry-state-hospital',
    name: 'Byberry State Hospital',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'canfranc-international-railway-station',
    name: 'Canfranc International Railway Station',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'cheyenne-mountain-complex',
    name: 'Cheyenne Mountain Complex',
    fallbackTier: 3,
    fallbackStatus: 'mirage',
    fallbackDangerLevel: 4,
  },
  {
    slug: 'chteau-de-brissac',
    name: 'Château de Brissac',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'copemish-masonic-temple',
    name: 'Copemish Masonic Temple',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'duga-control-room',
    name: 'Duga Control Room',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'duga-radar-array',
    name: 'Duga Radar Array',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 4,
  },
  {
    slug: 'eastern-state-penitentiary',
    name: 'Eastern State Penitentiary',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 2,
  },
  {
    slug: 'eloise-psychiatric-hospital',
    name: 'Eloise Psychiatric Hospital',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'gila-river-relocation-center',
    name: 'Gila River Relocation Center',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'hashima-island',
    name: 'Hashima Island',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'humberstone-saltpeter-morgue',
    name: 'Humberstone Saltpeter Morgue',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'humberstone-saltpeter-works',
    name: 'Humberstone Saltpeter Works',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'isla-de-las-muecas',
    name: 'Isla de las Muñecas',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'kuldhara',
    name: 'Kuldhara',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'letchworth-village',
    name: 'Letchworth Village',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'mount-weather-emergency-operations-center',
    name: 'Mount Weather Emergency Operations Center',
    fallbackTier: 3,
    fallbackStatus: 'mirage',
    fallbackDangerLevel: 4,
  },
  {
    slug: 'nara-dreamland',
    name: 'Nara Dreamland',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'nocton-hall-raf-hospital',
    name: 'Nocton Hall RAF Hospital',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'oradour-church-crypt',
    name: 'Oradour Church Crypt',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'poveglia-island',
    name: 'Poveglia Island',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'poveglia-subterranean-ward',
    name: 'Poveglia Subterranean Ward',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'pripyat-amusement-park',
    name: 'Pripyat Amusement Park',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 4,
  },
  {
    slug: 'pripyat-hospital-126',
    name: 'Pripyat Hospital 126',
    fallbackTier: 0,
    fallbackStatus: 'sealed',
    fallbackDangerLevel: 5,
  },
  {
    slug: 'raven-rock-mountain-complex',
    name: 'Raven Rock Mountain Complex',
    fallbackTier: 3,
    fallbackStatus: 'mirage',
    fallbackDangerLevel: 4,
  },
  {
    slug: 'rhyolite',
    name: 'Rhyolite',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'sedlec-ossuary',
    name: 'Sedlec Ossuary',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'spreepark-berlin',
    name: 'Spreepark Berlin',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'stelmo-light',
    name: 'St. Elmo Lighthouse',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 2,
  },
  {
    slug: 'teufelsberg-echo-dome',
    name: 'Teufelsberg Echo Dome',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'the-grid-null-point',
    name: 'The Grid Null Point',
    fallbackTier: 3,
    fallbackStatus: 'mirage',
    fallbackDangerLevel: 3,
  },
  {
    slug: 'the-leap-castle-bloody-chapel',
    name: 'The Leap Castle Bloody Chapel',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'the-vanishing-hospital',
    name: 'The Vanishing Hospital',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'willard-asylum-suitcases',
    name: 'Willard Asylum Suitcases',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
  {
    slug: 'wittenoom',
    name: 'Wittenoom',
    fallbackTier: 0,
    fallbackStatus: 'verified',
    fallbackDangerLevel: 0,
  },
];

/**
 * Act I is the authored starting frontier.
 *
 * These eight cases are available at the beginning of the investigation.
 * They are intentionally independent of stale/legacy Atlas unlock conditions.
 */
const ACT_I_CASE_SLUGS = new Set(ACT_I_CASES.map((item) => item.slug));

/**
 * Evaluate narrative Case availability.
 *
 * The canonical narrative registry is authoritative.
 *
 * Atlas Place state and narrative Case state are deliberately separate:
 *
 *   Atlas Place.status === 'verified'
 *
 * does NOT automatically mean:
 *
 *   Case.isUnlocked === true
 *
 * This prevents legacy Tier-0 Atlas records from leaking into the
 * narrative starting roster.
 */
function evaluateCaseAccess(
  definition: CanonicalCaseDefinition,
  place: ReturnType<typeof useAtlasStore.getState>['places'][number] | undefined,
  context: Parameters<typeof evaluateCanonicalCaseAccess>[1],
) {
  /*
   * Act I remains explicitly available.
   *
   * This check happens before requiring a Place record because St. Elmo is
   * a canonical Act I case whose geographic Atlas record is currently absent.
   */
  if (ACT_I_CASE_SLUGS.has(definition.slug)) {
    return {
      unlocked: true,
      reason: '',
    };
  }

  /*
   * From this point onward, the canonical narrative registry controls access.
   *
   * This evaluates authored Dust gates and the special centroid gate.
   *
   * It deliberately does NOT inspect Place.unlockCondition.
   */
  const canonicalAccess = evaluateCanonicalCaseAccess(
    definition.slug,
    context,
  );

  if (canonicalAccess.unlocked) {
    return {
      unlocked: true,
      reason: '',
    };
  }

  /*
   * A verified Atlas Place cannot override a failed canonical narrative gate.
   *
   * Geographic reconciliation is not the same thing as narrative progression.
   */
  if (place?.status === 'verified') {
    return {
      unlocked: false,
      reason: canonicalAccess.reason,
    };
  }

  /*
   * Missing geographic records are valid for canonical narrative cases.
   *
   * If the canonical gate is not satisfied, preserve the actual canonical
   * reason rather than manufacturing a geographic error.
   */
  if (!place) {
    return {
      unlocked: false,
      reason: canonicalAccess.reason,
    };
  }

  return {
    unlocked: false,
    reason: canonicalAccess.reason,
  };
}

interface CaseView {
  slug: string;
  name: string;
  tier: number;
  status: string;
  dangerLevel: number;
  address?: {
    formatted?: string;
  };
  isUnlocked: boolean;
  reason: string;
  investigated: boolean;
  evidenceTotal: number;
  evidenceAnalyzed: number;
  hasNotes: boolean;
}

export const InvestigationsPanel: React.FC = () => {
  const { places } = useAtlasStore();
  const { evidence, notes, openInvestigation } = useInvestigationStore();
  const { setActiveModule } = useUIStore();
  const {
    dustIndex,
    investigatedPlaceIds,
    completedCaseIds,
    discoveredEvidenceIds,
    analysedEvidenceIds,
    boardConnections,
    hypotheses,
    hypothesisEvidence,
    knowledge,
    contradictions,
  } = useProgressionStore();
  const { play } = useAudioStore();

  const cases = useMemo<CaseView[]>(() => {
    const context = {
      status: {
        dustIndex,
        investigatedPlaceIds,
        completedCaseIds,
        discoveredEvidenceIds,
        analysedEvidenceIds,
        boardConnections,
        hypotheses,
        hypothesisEvidence,
        knowledge,
        contradictions,
      },
      places,
      evidence,
    };

    return CANONICAL_CASES
      .map((definition) => {
        const place = places.find(
          (candidate) => candidate.slug === definition.slug,
        );

        const caseEvidence = evidence[definition.slug] || [];

        /*
         * A real Place record remains authoritative for geographic metadata:
         *
         *   - tier
         *   - status
         *   - danger
         *   - address
         *
         * But Case access is determined by the canonical narrative registry.
         *
         * Missing Place records are represented explicitly rather than
         * synthesized into the Atlas.
         */
        if (!place) {
          const access = evaluateCaseAccess(
            definition,
            undefined,
            context,
          );

          return {
            slug: definition.slug,
            name: definition.name,
            tier: definition.fallbackTier,
            status: definition.fallbackStatus,
            dangerLevel: definition.fallbackDangerLevel,
            address: undefined,

            isUnlocked: access.unlocked,
            reason: access.reason,

            investigated: investigatedPlaceIds.includes(
              definition.slug,
            ),

            evidenceTotal: caseEvidence.length,

            evidenceAnalyzed: caseEvidence.filter(
              (item) =>
                item.status === 'analyzed' ||
                item.status === 'viewed',
            ).length,

            hasNotes:
              (notes[definition.slug] || '').trim().length > 0,
          };
        }

        const access = evaluateCaseAccess(
          definition,
          place,
          context,
        );

        return {
          slug: place.slug,
          name: place.name,
          tier: place.tier ?? definition.fallbackTier,
          status: place.status,
          dangerLevel: place.dangerLevel,
          address: place.address,

          isUnlocked: access.unlocked,
          reason: access.reason,

          investigated: investigatedPlaceIds.includes(
            place.slug,
          ),

          evidenceTotal: caseEvidence.length,

          evidenceAnalyzed: caseEvidence.filter(
            (item) =>
              item.status === 'analyzed' ||
              item.status === 'viewed',
          ).length,

          hasNotes:
            (notes[place.slug] || '').trim().length > 0,
        };
      })
      .sort((a, b) => {
        /*
         * Narrative order is authoritative for Cases.
         *
         * Do NOT sort by Place.tier here. Atlas tiers are geographic metadata
         * and several legacy records carry Tier 0 even though they belong to
         * later narrative acts.
         */
        const aOrder =
          getCanonicalCase(a.slug)?.order ??
          Number.MAX_SAFE_INTEGER;

        const bOrder =
          getCanonicalCase(b.slug)?.order ??
          Number.MAX_SAFE_INTEGER;

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        return a.name.localeCompare(b.name);
      });
  }, [
    places,
    dustIndex,
    investigatedPlaceIds,
    completedCaseIds,
    discoveredEvidenceIds,
    analysedEvidenceIds,
    boardConnections,
    hypotheses,
    hypothesisEvidence,
    knowledge,
    contradictions,
    evidence,
    notes,
  ]);

  /*
   * Only expose the next actionable progression frontier.
   *
   * We do NOT show every future locked case.
   *
   * The canonical narrative registry determines which case comes next.
   */
  const visibleCases = useMemo(() => {
    if (cases.length === 0) {
      return [];
    }

    /*
     * Show every currently accessible narrative case, then expose only the
     * immediate next canonical gate as the frontier.
     *
     * This prevents legacy Tier-0 Atlas records such as Bhangarh from leaking
     * into the starting roster merely because their Place metadata happens
     * to say Tier 0.
     */
    const unlocked = cases.filter(
      (item) => item.isUnlocked,
    );

    const nextLockedOrder = cases
      .filter((item) => !item.isUnlocked)
      .map(
        (item) =>
          getCanonicalCase(item.slug)?.order,
      )
      .filter(
        (order): order is number =>
          order !== undefined,
      )
      .sort((a, b) => a - b)[0];

    const frontier =
      nextLockedOrder === undefined
        ? []
        : cases.filter(
            (item) =>
              getCanonicalCase(item.slug)?.order ===
              nextLockedOrder,
          );

    return [...unlocked, ...frontier].sort(
      (a, b) => {
        const aOrder =
          getCanonicalCase(a.slug)?.order ??
          Number.MAX_SAFE_INTEGER;

        const bOrder =
          getCanonicalCase(b.slug)?.order ??
          Number.MAX_SAFE_INTEGER;

        return aOrder - bOrder;
      },
    );
  }, [cases]);

  const unlockedCount = cases.filter(
    (item) => item.isUnlocked,
  ).length;

  const frontierCases = visibleCases.filter(
    (item) => !item.isUnlocked,
  );

  const handleOpenCase = (item: CaseView) => {
    if (!item.isUnlocked) {
      play('error');
      return;
    }

    play('tape');
    openInvestigation(
      item.slug,
      item.name,
    );
    setActiveModule(null);
  };

  return (
    <div className="h-full overflow-y-auto p-6 font-mono text-xs select-none">
      <div className="mx-auto max-w-3xl space-y-5">

        {/* HEADER */}
        <div
          className="border-b pb-3"
          style={{
            borderColor:
              colors.archive.grayDark,
          }}
        >
          <h2
            style={{
              color: colors.archive.amber,
              fontSize: typography.sizes.xs,
              letterSpacing: '0.12em',
            }}
          >
            REGISTRY OF ACTIVE INVESTIGATIONS
          </h2>

          <div
            className="mt-1.5 text-[10px]"
            style={{
              color: colors.archive.gray,
            }}
          >
            {unlockedCount} OF {CANONICAL_CASE_COUNT}{' '}
            AUTHORIZED CASES ACCESSED
          </div>
        </div>

        {/* CURRENT CASES */}
        <section className="space-y-3">
          <div
            className="text-[9px] tracking-[0.18em]"
            style={{
              color: colors.archive.gray,
            }}
          >
            ACCESSIBLE INVESTIGATIONS
          </div>

          {visibleCases
            .filter((item) => item.isUnlocked)
            .map((item) => {
              const statusColor =
                item.status === 'sealed'
                  ? colors.archive.red
                  : item.status === 'whispered'
                    ? colors.archive.blue
                    : item.status === 'mirage'
                      ? '#bf9f62'
                      : colors.archive.green;

              return (
                <CaseCard
                  key={item.slug}
                  item={item}
                  statusColor={statusColor}
                  onOpen={handleOpenCase}
                />
              );
            })}

          {visibleCases.filter(
            (item) => item.isUnlocked,
          ).length === 0 && (
            <div
              className="border p-5 text-center"
              style={{
                borderColor:
                  colors.archive.grayDark,
                color:
                  colors.archive.gray,
              }}
            >
              NO INVESTIGATIONS CURRENTLY CLEARED.
            </div>
          )}
        </section>

        {/* NEXT FRONTIER */}
        {frontierCases.length > 0 && (
          <section className="space-y-3 pt-2">
            <div
              className="text-[9px] tracking-[0.18em]"
              style={{
                color: colors.archive.amber,
              }}
            >
              NEXT ACCESS FRONTIER
            </div>

            {frontierCases.map((item) => (
              <CaseCard
                key={item.slug}
                item={item}
                statusColor={
                  colors.archive.gray
                }
                onOpen={handleOpenCase}
              />
            ))}
          </section>
        )}

        {/* TERMINAL END STATE */}
        {frontierCases.length === 0 &&
          unlockedCount > 0 && (
            <div
              className="border p-4 text-center text-[9px]"
              style={{
                borderColor:
                  colors.archive.grayDark,
                color:
                  colors.archive.gray,
              }}
            >
              REGISTRY FRONTIER EXHAUSTED.
              <br />
              NO FURTHER AUTHORIZED CASES DETECTED.
            </div>
          )}
      </div>
    </div>
  );
};

interface CaseCardProps {
  item: CaseView;
  statusColor: string;
  onOpen: (item: CaseView) => void;
}

const CaseCard: React.FC<CaseCardProps> = ({
  item,
  statusColor,
  onOpen,
}) => {
  const locked = !item.isUnlocked;

  return (
    <div
      onClick={() => onOpen(item)}
      className={`border p-4 transition-all ${
        locked
          ? 'cursor-default bg-stone-950/40'
          : 'cursor-pointer bg-stone-950/90 hover:border-[#4d443a]'
      }`}
      style={{
        borderColor: locked
          ? colors.archive.grayDark
          : '#2d2924',
        opacity: locked ? 0.58 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {locked ? (
              <FolderLock
                size={12}
                className="shrink-0 text-stone-500"
              />
            ) : (
              <BookOpen
                size={12}
                className="shrink-0"
                style={{
                  color: statusColor,
                }}
              />
            )}

            <span
              className="truncate font-bold text-xs"
              style={{
                color: locked
                  ? colors.archive.gray
                  : colors.archive.white,
              }}
            >
              {item.name}
            </span>
          </div>

          <div
            className="mt-1 text-[10px]"
            style={{
              color:
                colors.archive.grayLight,
            }}
          >
            {item.address?.formatted ||
              (item.reason.includes(
                'GEOGRAPHIC REGISTRY RECORD MISSING',
              )
                ? 'GEOGRAPHIC RECORD UNRESOLVED'
                : 'COORDINATES CLASSIFIED')}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div
            className="text-[8px]"
            style={{
              color: colors.archive.gray,
            }}
          >
            TIER {item.tier}
          </div>

          {!locked && (
            <span
              className="mt-1 inline-block border px-1.5 py-0.5 text-[8px] font-bold"
              style={{
                color: statusColor,
                borderColor: statusColor,
              }}
            >
              {item.status.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {locked ? (
        <div
          className="mt-3 flex items-center gap-1.5 border-t pt-2 text-[9.5px]"
          style={{
            borderColor:
              'rgba(255,255,255,0.03)',
            color:
              colors.archive.redBright,
          }}
        >
          <ShieldAlert size={12} />

          <span>
            {item.reason ||
              'REGISTRY CLASSIFIED'}
          </span>
        </div>
      ) : (
        <div
          className="mt-3 flex items-center justify-between border-t pt-2 text-[10px]"
          style={{
            borderColor:
              'rgba(255,255,255,0.03)',
          }}
        >
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <FileDigit
                size={11}
                style={{
                  color:
                    colors.archive.green,
                }}
              />

              EVIDENCE{' '}
              {item.evidenceAnalyzed}/
              {item.evidenceTotal}
            </span>

            {item.hasNotes && (
              <span
                className="rounded-[1px] px-1 text-[9px]"
                style={{
                  backgroundColor:
                    '#2e2a24',
                  color:
                    '#bf9f62',
                }}
              >
                NOTES ACTIVE
              </span>
            )}
          </div>

          {item.dangerLevel >= 4 && (
            <span
              className="flex items-center gap-0.5 text-[9px]"
              style={{
                color:
                  colors.archive.red,
              }}
            >
              <AlertTriangle size={10} />
              D{item.dangerLevel} THREAT
            </span>
          )}
        </div>
      )}

      {!locked && item.investigated && (
        <div
          className="mt-2 text-[8px] tracking-wider"
          style={{
            color:
              colors.archive.green,
          }}
        >
          INVESTIGATION LOGGED
        </div>
      )}
    </div>
  );
};

export default InvestigationsPanel;