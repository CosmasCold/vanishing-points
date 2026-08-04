// hooks/useKeyboardShortcuts.ts
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { gameState } from '@/logic/gameState';
import { eventBus } from '@/logic/eventBus';
import { accumulateDust } from '@/logic/actions';

interface ShortcutConfig {
  onTogglePlanner?: () => void;
  onToggleLog?: () => void;
  onToggleLanterns?: () => void;
  onFitBounds?: () => void;
  onEscape?: () => void;
  onCommandPalette?: () => void;
}

export function useKeyboardShortcuts(config: ShortcutConfig) {
  const configRef = useRef(config);
  configRef.current = config;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in input/textarea
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Still accumulate dust for typing
      if (e.key.length === 1) {
        accumulateDust(0.2);
        eventBus.emit('keystroke', { key: e.key, dustAccumulated: 0.2 });
      }
      return;
    }

    const cfg = configRef.current;

    switch (e.key) {
      case 'Escape':
        cfg.onEscape?.();
        break;
      case 'p':
      case 'P':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          cfg.onTogglePlanner?.();
        }
        break;
      case 'l':
      case 'L':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          cfg.onToggleLog?.();
        }
        break;
      case 'f':
      case 'F':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          cfg.onFitBounds?.();
        }
        break;
      case 'k':
      case 'K':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          cfg.onCommandPalette?.();
        }
        break;
      default:
        if (e.key.length === 1) {
          accumulateDust(0.2);
          eventBus.emit('keystroke', { key: e.key, dustAccumulated: 0.2 });
        }
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}