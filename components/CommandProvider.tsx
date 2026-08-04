'use client';

import { useEffect } from 'react';
import { initializeCommands } from '@/logic/commands';

export const CommandProvider: React.FC = () => {
  useEffect(() => {
    initializeCommands();
  }, []);
  
  return null;
};