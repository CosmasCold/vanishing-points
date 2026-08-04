'use client';

import React from 'react';
import { useUIStore } from '@/state/uiStore';
import { colors, typography, spacing } from '@/styles/theme';

export const StatusBar: React.FC = () => {
  const { status, terminalOpen } = useUIStore();
  
  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  const [time, setTime] = React.useState(formatTime());
  
  React.useEffect(() => {
    const interval = setInterval(() => setTime(formatTime()), 1000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between px-3 border-t"
      style={{ 
        height: spacing.statusBar,
        backgroundColor: colors.archive.surface,
        borderColor: colors.archive.gray,
        fontFamily: typography.mono,
        fontSize: typography.sizes.xs,
        marginLeft: spacing.rail,
        marginBottom: terminalOpen ? spacing.terminalHeight : 0,
        transition: 'margin-bottom 0.25s ease-in-out',
      }}
    >
      <div className="flex items-center gap-4">
        <span style={{ color: colors.archive.green }}>
          ● {status.systemIntegrity.toUpperCase()}
        </span>
        <span style={{ color: colors.archive.grayLight }}>
          DUST: {status.dustIndex}
        </span>
        <span style={{ color: colors.archive.grayLight }}>
          ATLAS: {status.atlasCoverage} km²
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        <span style={{ color: colors.archive.blue }}>
          {status.activeInvestigations} ACTIVE
        </span>
        <span style={{ color: colors.archive.gray }}>
          {time} UTC
        </span>
      </div>
    </div>
  );
};