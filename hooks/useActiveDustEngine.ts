// hooks/useActiveDustEngine.ts
'use client';

import { useEffect, useRef } from 'react';
import { gameState } from '@/logic/gameState';
import { eventBus } from '@/logic/eventBus';
import { accumulateDust } from '@/logic/actions';
import { showToast } from '@/lib/toast';

export function useActiveDustEngine(booted: boolean) {
  const lastKeyTime = useRef(Date.now());

  useEffect(() => {
    if (!booted) return;

    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (!isTyping && !e.key.match(/^[a-zA-Z]$/)) return;

      const now = Date.now();
      const delta = now - lastKeyTime.current;
      lastKeyTime.current = now;

      let amount = 0.3;
      if (delta < 150 && delta > 0) {
        amount = 0.2;
        if (Math.random() < 0.03) {
          showToast(
            'The terminal flickers. A ghost line passes through.',
            'warning'
          );
          const enc =
            parseInt(localStorage.getItem('vp-other-encounters') || '0', 10) ||
            gameState.getState().otherEncounters;
          localStorage.setItem('vp-other-encounters', String(enc + 1));
          gameState.setState({ otherEncounters: enc + 1 });
          window.dispatchEvent(
            new CustomEvent('vp-ghost-trigger', {
              detail: { source: 'typing' },
            })
          );
        }
      } else if (delta > 300) {
        amount = 0.5;
      }

      accumulateDust(amount);
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [booted]);
}