// hooks/usePlaceDossier.ts
'use client';

import { useState, useEffect } from 'react';
import { getSignalDossier } from '@/lib/echoesContent';
import { gameState } from '@/logic/gameState';

export function usePlaceDossier(placeSlug: string) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const dossier = getSignalDossier(placeSlug);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check legacy signal unlock
    const signalUnlocked =
      localStorage.getItem(`vp-signal-${placeSlug}`) === 'true';

    // Check legacy dossier unlock
    const dossierUnlocked =
      localStorage.getItem(`vp-dossier-${placeSlug}`) === 'true';

    if (signalUnlocked && dossier && !dossierUnlocked) {
      // Auto-unlock on open (matches original behavior)
      localStorage.setItem(`vp-dossier-${placeSlug}`, 'true');
      setIsUnlocked(true);
    } else {
      setIsUnlocked(dossierUnlocked);
    }
  }, [placeSlug, dossier]);

  return { dossier, isUnlocked };
}