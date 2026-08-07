'use client';

import React from 'react';
import { useUIStore } from '@/state/uiStore';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography, spacing, microform } from '@/styles/theme';

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
      className="fixed left-0 top-0 bottom-0 z-30 flex flex-col"
      style={{
        width: spacing.rail,
        background: `linear-gradient(180deg, ${microform.iron} 0%, ${microform.mahogany} 40%, ${colors.archive.black} 100%)`,
        borderRight: `1px solid ${microform.mahoganyLight}`,
        boxShadow: '4px 0 16px rgba(0,0,0,0.5), inset -2px 0 4px rgba(0,0,0,0.3)',
      }}
    >
      {/* Brass plate logo */}
      <div
        className="flex items-center justify-center h-12"
        style={{
          borderBottom: `2px solid ${microform.iron}`,
          boxShadow: '0 1px 0 rgba(255,255,255,0.03)',
          background: `linear-gradient(180deg, ${microform.mahogany} 0%, ${microform.iron} 100%)`,
        }}
      >
        <span
          style={{
            color: microform.halogen,
            fontFamily: typography.mono,
            fontSize: typography.sizes.xs,
            letterSpacing: '0.2em',
            fontWeight: typography.weights.bold,
            textShadow: '0 0 10px rgba(255,170,85,0.35)',
          }}
        >
          VP
        </span>
      </div>

      {/* Module tabs — microfiche card aesthetic */}
      <div className="flex-1 flex flex-col py-3 gap-1 overflow-y-auto">
        {MODULES.map((mod) => {
          const isActive = activeModule === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => {
                click();
                setActiveModule(isActive ? null : mod.id);
              }}
              className="relative flex flex-col items-center justify-center py-3 mx-1 transition-all duration-200"
              style={{
                color: isActive ? microform.halogen : colors.archive.gray,
                background: isActive
                  ? `linear-gradient(90deg, ${microform.mahoganyLight} 0%, transparent 90%)`
                  : 'transparent',
                borderLeft: isActive ? `3px solid ${colors.archive.amber}` : '3px solid transparent',
                borderRight: isActive ? `1px solid ${microform.mahoganyLight}` : '1px solid transparent',
                borderTop: `1px solid ${isActive ? 'rgba(255,255,255,0.03)' : 'transparent'}`,
                borderBottom: `1px solid ${isActive ? 'rgba(0,0,0,0.3)' : 'transparent'}`,
                transform: isActive ? 'translateX(3px)' : 'translateX(0)',
                boxShadow: isActive
                  ? `inset 0 0 12px ${microform.halogenDim}, 2px 2px 8px rgba(0,0,0,0.4)`
                  : 'none',
              }}
              title={mod.label}
            >
              <span
                style={{
                  fontSize: '0.875rem',
                  marginBottom: '0.3rem',
                  opacity: isActive ? 1 : 0.6,
                  filter: isActive ? 'drop-shadow(0 0 4px rgba(255,170,85,0.3))' : 'none',
                }}
              >
                {mod.icon}
              </span>
              <span
                style={{
                  fontFamily: typography.mono,
                  fontSize: '0.5rem',
                  letterSpacing: '0.08em',
                  fontWeight: isActive ? typography.weights.medium : typography.weights.normal,
                  textShadow: isActive ? microform.halogenText : 'none',
                }}
              >
                {mod.label}
              </span>

              {/* Tab edge: simulated paper thickness */}
              {isActive && (
                <div
                  className="absolute right-0 top-1 bottom-1 w-px"
                  style={{
                    background: `linear-gradient(180deg, transparent 0%, ${colors.archive.amber} 50%, transparent 100%)`,
                    opacity: 0.4,
                  }}
                />
              )}
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
        className="flex flex-col items-center justify-center py-3 border-t mx-1 mb-1 transition-all hover:bg-white/[0.03]"
        style={{
          borderColor: microform.mahoganyLight,
          color: colors.archive.gray,
        }}
      >
        <span style={{ fontSize: '0.875rem', marginBottom: '0.3rem', opacity: 0.6 }}>?</span>
        <span style={{ fontFamily: typography.mono, fontSize: '0.5rem', letterSpacing: '0.08em' }}>
          HELP
        </span>
      </button>

      {/* Terminal toggle */}
      <button
        onClick={() => {
          click();
          setTerminalOpen(true);
        }}
        className="flex flex-col items-center justify-center py-3 border-t mx-1 mb-1 transition-all hover:bg-white/[0.03]"
        style={{
          borderColor: microform.mahoganyLight,
          color: colors.archive.gray,
        }}
      >
        <span style={{ fontSize: '0.875rem', marginBottom: '0.3rem', opacity: 0.6 }}>&gt;_</span>
        <span style={{ fontFamily: typography.mono, fontSize: '0.5rem', letterSpacing: '0.08em' }}>
          TERM
        </span>
      </button>
    </div>
  );
};