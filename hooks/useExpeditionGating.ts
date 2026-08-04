// hooks/useExpeditionGating.ts
'use client';

import { useState, useCallback } from 'react';
import { gameState } from '@/logic/gameState';
import { burnDust } from '@/logic/actions';
import { showToast } from '@/lib/toast';

export function useExpeditionGating() {
  const [isOpen, setIsOpen] = useState(false);

  const openExpedition = useCallback((cost: number = 10) => {
    const dust = gameState.getState().dust;
    if (dust < cost) {
      showToast(
        `Insufficient dust. The expedition requires ${cost}% contamination. You carry ${dust}%.`,
        'warning'
      );
      return false;
    }
    burnDust(cost);
    // Legacy dust notification
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vp-dust-change'));
    }
    setIsOpen(true);
    return true;
  }, []);

  const closeExpedition = useCallback(() => {
    setIsOpen(false);
  }, []);

  return { isOpen, openExpedition, closeExpedition };
}