// hooks/useDustEngine.ts
'use client';

import { useCallback } from 'react';
import { gameState, useGameState } from '@/logic/gameState';
import { accumulateDust } from '@/logic/actions';

export function useDustEngine() {
  const state = useGameState();

  const addDust = useCallback((amount: number) => {
    accumulateDust(amount);
    return gameState.getState().dust;
  }, []);

  const burnDust = useCallback((amount: number) => {
    const prev = gameState.getState().dust;
    const next = Math.max(0, prev - amount);
    gameState.setState({ dust: next });
    return next;
  }, []);

  return {
    dust: state.dust,
    cappedDust: Math.min(state.dust, 100),
    corruptionStage: state.corruptionStage,
    addDust,
    burnDust,
  };
}