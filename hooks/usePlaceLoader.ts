// hooks/usePlaceLoader.ts
'use client';

import { useEffect, useState } from 'react';
import { gameState, type Place } from '@/logic/gameState';

export function usePlaceLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/places')
      .then((r) => r.json())
      .then((data) => {
        const places: Place[] = data.places || [];
        const record: Record<string, Place> = {};
        places.forEach((p) => {
          record[p.slug] = p;
        });
        gameState.setState({ places: record });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { loading };
}