'use client';

import React, { useEffect } from 'react';
import { useEnvironmentStore } from '@/state/environmentStore';
import { useUIStore } from '@/state/uiStore';
import { useTerminalStore } from '@/state/terminalStore';
import { colors } from '@/styles/theme';

export const ImpossibleChangeToast: React.FC = () => {
  const { changes, checkForChanges, applyChange } = useEnvironmentStore();
  const { status } = useUIStore();
  const { addCommand } = useTerminalStore();

  useEffect(() => {
    const interval = setInterval(() => {
      const candidates = checkForChanges(status.dustIndex, status.observerStability);
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
  }, [status.dustIndex, status.observerStability, checkForChanges, applyChange, addCommand]);

  // This component renders nothing. It is a silent watcher.
  return null;
};