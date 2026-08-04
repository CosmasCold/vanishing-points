// hooks/useWitnessPolling.ts
'use client';

import { useEffect, useState, useRef } from 'react';
import { gameState } from '@/logic/gameState';
import { showToast } from '@/lib/toast';

export function useWitnessPolling(booted: boolean) {
  const [witnessCount, setWitnessCount] = useState(0);
  const [ghostWitness, setGhostWitness] = useState(false);
  const ghostTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!booted) return;

    const interval = setInterval(() => {
      fetch('/api/witnesses/active')
        .then((r) => r.json())
        .then((data) => {
          const dust = gameState.getState().dust;
          let count = data.count || 0;

          if (Math.random() < 0.04 && dust > 30 && !ghostWitness) {
            count += 1;
            setGhostWitness(true);
            showToast('Another witness is viewing the atlas.', 'warning');
            ghostTimeoutRef.current = setTimeout(() => {
              setGhostWitness(false);
            }, 30000);
          }

          setWitnessCount(count);
        })
        .catch(() => {});
    }, 15000);

    return () => {
      clearInterval(interval);
      if (ghostTimeoutRef.current) clearTimeout(ghostTimeoutRef.current);
    };
  }, [booted, ghostWitness]);

  return { witnessCount, ghostWitness };
}