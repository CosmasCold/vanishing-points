'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/state/uiStore';
import { useAudioStore } from '@/state/audioStore';

export const KeyboardManager: React.FC = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        useAudioStore.getState().click();
        useUIStore.getState().toggleTerminal();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return null;
};