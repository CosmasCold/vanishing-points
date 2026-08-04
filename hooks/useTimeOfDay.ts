// hooks/useTimeOfDay.ts
'use client';

import { useEffect } from 'react';
import { gameState, deriveTimeOfDay } from '@/logic/gameState';

export function useTimeOfDay() {
  useEffect(() => {
    const update = () => {
      gameState.setState({ timeOfDay: deriveTimeOfDay() });
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);
}