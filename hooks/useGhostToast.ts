// hooks/useGhostToast.ts
'use client';

import { useEffect } from 'react';
import { gameState } from '@/logic/gameState';
import { showToast } from '@/lib/toast';

export function useGhostToast(booted: boolean) {
  useEffect(() => {
    if (!booted || typeof window === 'undefined') return;

    const logs = JSON.parse(localStorage.getItem('vp-expedition-log') || '[]');
    const hasNotified = localStorage.getItem('vp-ghost-toast-3') === 'true';

    if (logs.length >= 3 && !hasNotified) {
      localStorage.setItem('vp-ghost-toast-3', 'true');
      showToast(
        'The terminal at BUNKER_7 has noticed your movement.',
        'warning'
      );
    }
  }, [booted]);
}