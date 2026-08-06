'use client';

import { useEffect } from 'react';
import { initializeCommands } from '@/logic/commands';

export const ArchiveInitializer: React.FC = () => {
  useEffect(() => {
    initializeCommands();
    console.log('[BUNKER_7] Command registry initialized.');
  }, []);

  return null;
};