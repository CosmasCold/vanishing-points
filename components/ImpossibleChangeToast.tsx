'use client';

import React, { useEffect } from 'react';
import { useEnvironmentStore } from '@/state/environmentStore';
import { useProgressionStore } from '@/state/progressionStore';
import { useTerminalStore } from '@/state/terminalStore';
import { colors } from '@/styles/theme';

export const ImpossibleChangeToast: React.FC = () => {
  const { checkForChanges, applyChange } = useEnvironmentStore();
  const dustIndex = useProgressionStore((state) => state.dustIndex);
  const observerStability = useProgressionStore(
    (state) => state.observerStability
  );
  const { addCommand } = useTerminalStore();

  useEffect(() => {
    const interval = setInterval(() => {
      const candidates = checkForChanges(
        dustIndex,
        observerStability
      );

      if (candidates.length > 0) {
        const change = candidates[0];
        applyChange(change.id);

        // Inject into terminal as a system anomaly
        addCommand({
          id: `anomaly-${Date.now()}`,
          input: '',
          output: `SYSTEM ANOMALY DETECTED\n${change.description}\nLocation: ${change.location.toUpperCase()}\n[Timestamp: ${new Date().toISOString()}]`,
          timestamp: Date.now(),
          type: 'warning',
        });
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [
    dustIndex,
    observerStability,
    checkForChanges,
    applyChange,
    addCommand,
  ]);

  // This component renders nothing. It is a silent watcher.
  return null;
};