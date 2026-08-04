// hooks/useAtlasKeyboardShortcuts.ts
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface ShortcutState {
  selectedPlace: boolean;
  showPlanner: boolean;
  showLog: boolean;
  showLanterns: boolean;
  showHelp: boolean;
  nearest: boolean;
}

interface ShortcutActions {
  togglePlanner: () => void;
  toggleLog: () => void;
  toggleLanterns: () => void;
  toggleHelp: () => void;
  findNearest: () => void;
  selectRandomPlace: () => void;
  clearSelection: () => void;
  clearNearest: () => void;
}

export function useAtlasKeyboardShortcuts(
  state: ShortcutState,
  actions: ShortcutActions
) {
  const stateRef = useRef(state);
  const actionsRef = useRef(actions);
  const routerRef = useRouter();

  // Keep refs current without re-registering listener
  stateRef.current = state;
  actionsRef.current = actions;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;
      const hasModifier = e.metaKey || e.ctrlKey || e.altKey;

      if (isTyping || hasModifier) return;

      const s = stateRef.current;
      const a = actionsRef.current;

      switch (e.key.toLowerCase()) {
        case 'e':
          e.preventDefault();
          a.togglePlanner();
          break;
        case 'n':
          e.preventDefault();
          a.findNearest();
          break;
        case 'r':
          e.preventDefault();
          a.selectRandomPlace();
          break;
        case 'a':
          e.preventDefault();
          routerRef.push('/list');
          break;
        case 's':
          e.preventDefault();
          routerRef.push('/submit');
          break;
        case 'l':
          e.preventDefault();
          a.toggleLog();
          break;
        case 'k':
          e.preventDefault();
          a.toggleLanterns();
          break;
        case '?':
          e.preventDefault();
          a.toggleHelp();
          break;
        case 'escape':
          e.preventDefault();
          if (s.showHelp) {
            a.toggleHelp();
          } else if (s.selectedPlace) {
            a.clearSelection();
          } else if (s.showPlanner) {
            a.togglePlanner();
          } else if (s.showLog) {
            a.toggleLog();
          } else if (s.showLanterns) {
            a.toggleLanterns();
          } else if (s.nearest) {
            a.clearNearest();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []); // Intentionally empty — refs provide current state
}