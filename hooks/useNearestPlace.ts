// hooks/useNearestPlace.ts
'use client';

import { useState, useCallback } from 'react';
import { gameState, type Place } from '@/logic/gameState';
import { showToast } from '@/lib/toast';

function haversine(
  [lon1, lat1]: [number, number],
  [lon2, lat2]: [number, number]
) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useNearestPlace() {
  const [nearest, setNearest] = useState<{
    place: Place;
    distance: number;
  } | null>(null);

  const findNearest = useCallback(() => {
    const places = Object.values(gameState.getState().places);
    if (!navigator.geolocation) {
      showToast(
        'Geolocation unavailable. The atlas cannot locate you.',
        'warning'
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const user: [number, number] = [
          pos.coords.longitude,
          pos.coords.latitude,
        ];
        const result = places.reduce<{
          place: Place | null;
          distance: number;
        }>(
          (best, place) => {
            const d = haversine(user, place.coordinates);
            return d < best.distance ? { place, distance: d } : best;
          },
          { place: null, distance: Infinity }
        );

        if (result.place) {
          setNearest({ place: result.place, distance: result.distance });
        }
      },
      () => {
        showToast('Location signal lost. The atlas reads silence.', 'warning');
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  const clearNearest = useCallback(() => setNearest(null), []);

  return { nearest, findNearest, clearNearest };
}