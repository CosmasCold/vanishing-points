// hooks/useWitchingHour.ts
'use client';

import { useEffect, useState } from 'react';
import { eventBus } from '@/logic/eventBus';

export function useWitchingHour(): boolean {
  const [isWitching, setIsWitching] = useState(false);

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const active = now.getHours() === 3 && now.getMinutes() === 14;
      setIsWitching(active);
      if (active) {
        eventBus.emit('time:witching', { hour: 3, minute: 14 });
      }
    };

    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, []);

  return isWitching;
}