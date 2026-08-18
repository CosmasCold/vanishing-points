import { useEffect } from 'react';
import { useProgressionStore } from '@/state/progressionStore';
import { useAtlasStore } from '@/state/atlasStore';
import { useAudioStore } from '@/state/audioStore';

const WEATHER_SLUGS = [
  'mount-weather-emergency-operations-center',
  'mount-weather',
];

const CHEYENNE_SLUGS = [
  'cheyenne-mountain-complex',
  'cheyenne-mountain',
  'cheyenne-mount',
];

const RAVEN_SLUGS = [
  'raven-rock-mountain-complex',
  'raven-rock',
];

const NULL_POINT_SLUG = 'the-grid-null-point';

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^place:/, '');
}

function connectionMatches(
  connection: string,
  slugsA: string[],
  slugsB: string[],
): boolean {
  const [rawSource, rawTarget] = connection.split('::');

  if (!rawSource || !rawTarget) {
    return false;
  }

  const source = normalizeSlug(rawSource);
  const target = normalizeSlug(rawTarget);

  return (
    (slugsA.includes(source) && slugsB.includes(target)) ||
    (slugsA.includes(target) && slugsB.includes(source))
  );
}

/**
 * Resonance Triangulation presentation layer.
 *
 * IMPORTANT:
 * Player-created Evidence Board relationships are hypotheses.
 * They must never establish canonical world state.
 *
 * Canonical triangulation is therefore read exclusively from
 * progressionStore.boardConnections.
 *
 * The hook may react to an already-established canonical
 * triangulation by updating presentation state and playing
 * diegetic feedback, but it does not create progression itself.
 */
export function useResonanceTriangulation() {
  const boardConnections = useProgressionStore(
    (state) => state.boardConnections,
  );

  const { places, setPlaces } = useAtlasStore();
  const { playCalibrationDrone, play } = useAudioStore();

  useEffect(() => {
    const hasConnection = (
      slugsA: string[],
      slugsB: string[],
    ) =>
      boardConnections.some((connection) =>
        connectionMatches(
          connection,
          slugsA,
          slugsB,
        ),
      );

    const conn1 = hasConnection(
      WEATHER_SLUGS,
      CHEYENNE_SLUGS,
    );

    const conn2 = hasConnection(
      CHEYENNE_SLUGS,
      RAVEN_SLUGS,
    );

    const conn3 = hasConnection(
      RAVEN_SLUGS,
      WEATHER_SLUGS,
    );

    /*
     * Canonical triangulation requires the same
     * dual-link condition used by the existing system.
     *
     * The important architectural distinction is that
     * these links can now only come from progressionStore.
     */
    const isTriangulated =
      (conn1 && conn2) ||
      (conn2 && conn3) ||
      (conn3 && conn1);

    if (!isTriangulated) {
      return;
    }

    const nullPoint = places.find(
      (place) => place.slug === NULL_POINT_SLUG,
    );

    if (!nullPoint || nullPoint.status === 'verified') {
      return;
    }

    const updatedPlaces = places.map((place) => {
      if (place.slug === NULL_POINT_SLUG) {
        return {
          ...place,
          status: 'verified' as const,
        };
      }

      if (
        WEATHER_SLUGS.includes(place.slug) ||
        CHEYENNE_SLUGS.includes(place.slug) ||
        RAVEN_SLUGS.includes(place.slug)
      ) {
        if (
          place.status === 'mirage' ||
          place.status === 'sealed'
        ) {
          return {
            ...place,
            status: 'verified' as const,
          };
        }
      }

      return place;
    });

    setPlaces(updatedPlaces);

    if (typeof playCalibrationDrone === 'function') {
      playCalibrationDrone();
    }

    if (typeof play === 'function') {
      play('alert');
    }

    console.log(
      '[BUNKER_7] Canonical triangulation detected. ' +
        '4.5 Hz Bedrock signal synchronized. ' +
        'Kansas Null Point coordinates unredacted.',
    );
  }, [
    boardConnections,
    places,
    setPlaces,
    playCalibrationDrone,
    play,
  ]);
}