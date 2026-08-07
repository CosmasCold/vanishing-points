'use client';

import React from 'react';
import { useUIStore } from '@/state/uiStore';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography, spacing } from '@/styles/theme';

const MODULES = [
  { id: 'inbox', label: 'INBOX', icon: '◫' },
  { id: 'atlas', label: 'ATLAS', icon: '◎' },
  { id: 'investigations', label: 'CASES', icon: '▣' },
  { id: 'evidence', label: 'BOARD', icon: '⬡' },
  { id: 'signals', label: 'SIG', icon: '〜' },
  { id: 'documents', label: 'DOCS', icon: '▤' },
  { id: 'research', label: 'R&D', icon: '◬' },
  { id: 'inventory', label: 'INV', icon: '▪' },
  { id: 'discoveries', label: 'DISC', icon: '✦' },
  { id: 'system', label: 'SYS', icon: '◉' },
] as const;

export const NavigationRail: React.FC = () => {
  const { activeModule, setActiveModule, setTerminalOpen, setGuideOpen } = useUIStore();
  const { click } = useAudioStore();

  return (
    <div
      className="fixed left-0 top-0 bottom-0 z-30 flex flex-col border-r"
      style={{
        width: spacing.rail,
        borderColor: colors.archive.grayDark,
        backgroundColor: colors.archive.surface,
        boxShadow: '4px 0 12px rgba(0,0,0,0.2)',
      }}
    >
      {/* Logo area */}
      <div
        className="flex items-center justify-center h-12 border-b"
        style={{ borderColor: colors.archive.grayDark }}
      >
        <span
          style={{
            color: colors.archive.amber,
            fontFamily: typography.mono,
            fontSize: typography.sizes.xs,
            letterSpacing: '0.15em',
            fontWeight: typography.weights.bold,
          }}
        >
          VP
        </span>
      </div>

      {/* Module buttons */}
      <div className="flex-1 flex flex-col py-2 gap-0.5 overflow-y-auto">
        {MODULES.map((mod) => {
          const isActive = activeModule === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => {
                click();
                setActiveModule(isActive ? null : mod.id);
              }}
              className="flex flex-col items-center justify-center py-3 mx-1 rounded transition-all hover:bg-white/5"
              style={{
                color: isActive ? colors.archive.amber : colors.archive.gray,
                backgroundColor: isActive ? 'rgba(201, 169, 110, 0.08)' : 'transparent',
                borderLeft: isActive ? `2px solid ${colors.archive.amber}` : '2px solid transparent',
              }}
              title={mod.label}
            >
              <span style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{mod.icon}</span>
              <span style={{ fontFamily: typography.mono, fontSize: '0.5625rem', letterSpacing: '0.05em' }}>
                {mod.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Help toggle */}
      <button
        onClick={() => {
          click();
          setGuideOpen(true);
        }}
        className="flex flex-col items-center justify-center py-3 border-t mx-1 mb-1 rounded transition-all hover:bg-white/5"
        style={{ borderColor: colors.archive.grayDark, color: colors.archive.gray }}
      >
        <span style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>?</span>
        <span style={{ fontFamily: typography.mono, fontSize: '0.5625rem', letterSpacing: '0.05em' }}>
          HELP
        </span>
      </button>

      {/* Terminal toggle */}
      <button
        onClick={() => {
          click();
          setTerminalOpen(true);
        }}
        className="flex flex-col items-center justify-center py-3 border-t mx-1 mb-1 rounded transition-all hover:bg-white/5"
        style={{ borderColor: colors.archive.grayDark, color: colors.archive.gray }}
      >
        <span style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>&gt;_</span>
        <span style={{ fontFamily: typography.mono, fontSize: '0.5625rem', letterSpacing: '0.05em' }}>
          TERM
        </span>
      </button>
    </div>
  );
};