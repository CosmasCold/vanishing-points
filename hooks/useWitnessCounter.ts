// hooks/useWitnessCounter.ts
'use client';

import { useEffect, useRef } from 'react';
import { gameState, useGameState } from '@/logic/gameState';
import { eventBus } from '@/logic/eventBus';

export function useWitnessCounter() {
  const state = useGameState();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    // Ghost witnesses appear at corruption stage 3+
    if (state.corruptionStage < 3) return;

    intervalRef.current = setInterval(() => {
      const base = Math.floor(Math.random() * 12) + 3;
      const ghost = Math.random() < 0.3 ? 1 : 0;

      gameState.setState({ ghostWitnesses: base + ghost });

      if (ghost) {
        eventBus.emit('ghost:encounter', {
          tier: state.corruptionStage,
          message: 'Concurrent investigator detected in grid sector 7.',
          source: 'witness-counter',
        });
      }
    }, 8000);

    return () => clearInterval(intervalRef.current);
  }, [state.corruptionStage]);

  return {
    witnesses: state.ghostWitnesses || Math.floor(Math.random() * 12) + 3,
    isGhostActive: state.corruptionStage >= 3,
  };
}