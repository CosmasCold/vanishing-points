// hooks/usePhosphorPulse.ts
'use client';

import { useEffect, useRef } from 'react';
import { gameState } from '@/logic/gameState';
import { eventBus } from '@/logic/eventBus';

const THRESHOLDS = [10, 25, 50, 75];

export function usePhosphorPulse() {
  const lastTriggeredRef = useRef<number>(0);

  useEffect(() => {
    // Initialize from legacy localStorage
    if (typeof window !== 'undefined') {
      const legacy = parseInt(
        localStorage.getItem('vp-last-pulse') || '0',
        10
      );
      if (legacy > lastTriggeredRef.current) {
        lastTriggeredRef.current = legacy;
      }
    }

    const unsubscribe = gameState.subscribe((state) => {
      const crossed = THRESHOLDS.find(
        (t) => state.dust >= t && lastTriggeredRef.current < t
      );

      if (crossed) {
        lastTriggeredRef.current = crossed;
        localStorage.setItem('vp-last-pulse', String(crossed));

        // Set CSS custom properties on document root
        document.documentElement.style.setProperty(
          '--phosphor-scale-x',
          '1.004'
        );
        document.documentElement.style.setProperty(
          '--phosphor-scale-y',
          '0.998'
        );
        document.documentElement.style.setProperty(
          '--phosphor-brightness',
          '1.02'
        );

        setTimeout(() => {
          document.documentElement.style.setProperty(
            '--phosphor-scale-x',
            '1'
          );
          document.documentElement.style.setProperty(
            '--phosphor-scale-y',
            '1'
          );
          document.documentElement.style.setProperty(
            '--phosphor-brightness',
            '1'
          );
        }, 800);

        // Backward-compatible DOM event
        window.dispatchEvent(
          new CustomEvent('vp-heartbeat', {
            detail: { intensity: state.dust },
          })
        );

        // New event bus emission
        eventBus.emit('phosphor:pulse', { intensity: state.dust });
      }
    });

    return unsubscribe;
  }, []);
}