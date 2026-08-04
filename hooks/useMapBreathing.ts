// hooks/useMapBreathing.ts
'use client';

import { useEffect } from 'react';

export function useMapBreathing() {
  useEffect(() => {
    const handleHeartbeat = (e: CustomEvent) => {
      const intensity = (e.detail?.intensity || 50) / 100;
      document.documentElement.style.setProperty(
        '--map-breath-scale',
        String(1 + intensity * 0.003)
      );
      setTimeout(() => {
        document.documentElement.style.setProperty('--map-breath-scale', '1');
      }, 150);
    };

    window.addEventListener(
      'vp-heartbeat',
      handleHeartbeat as EventListener
    );
    return () =>
      window.removeEventListener(
        'vp-heartbeat',
        handleHeartbeat as EventListener
      );
  }, []);
}