'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/state/uiStore';
import { ModuleId } from '@/types';
import { colors, typography, spacing, timing, microform } from '@/styles/theme';
import { useAudioStore } from '@/state/audioStore';

interface ModulePanelProps {
  moduleId: ModuleId;
  title: string;
  children: React.ReactNode;
}

export const ModulePanel: React.FC<ModulePanelProps> = ({ moduleId, title, children }) => {
  const { activeModule, setActiveModule } = useUIStore();
  const { click } = useAudioStore();
  const isOpen = activeModule === moduleId;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          transition={{ duration: timing.panelSlide, ease: 'easeOut' }}
          className="fixed top-0 bottom-0 overflow-hidden flex flex-col"
          style={{
            left: spacing.rail,
            width: '24rem',
            backgroundColor: colors.archive.black,
            backgroundImage: `
              linear-gradient(180deg, ${microform.mahogany} 0%, ${colors.archive.black} 40%),
              url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")
            `,
            borderRight: `1px solid ${microform.iron}`,
            boxShadow: `
              4px 0 24px rgba(0,0,0,0.5),
              inset -2px 0 4px rgba(0,0,0,0.3),
              inset 0 1px 0 rgba(255,255,255,0.02)
            `,
            marginBottom: spacing.statusBar,
            zIndex: 10,
          }}
        >
          {/* Stamped brass header */}
          <div
            className="flex items-center justify-between px-4 h-10 shrink-0"
            style={{
              background: `linear-gradient(180deg, ${microform.mahoganyLight} 0%, ${microform.mahogany} 100%)`,
              borderBottom: `1px solid ${microform.iron}`,
              boxShadow: '0 1px 0 rgba(255,255,255,0.03), 0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <span style={{
              color: microform.halogen,
              fontFamily: typography.mono,
              fontSize: typography.sizes.xs,
              letterSpacing: '0.12em',
              textShadow: microform.halogenText,
            }}>
              {title}
            </span>
            <button
              onClick={() => {
                click();
                setActiveModule(null);
              }}
              className="px-2 py-0.5 text-xs transition-all hover:opacity-70"
              style={{
                color: colors.archive.gray,
                fontFamily: typography.mono,
                border: `1px solid ${microform.mahoganyLight}`,
                background: microform.iron,
              }}
            >
              ×
            </button>
          </div>

          {/* Panel content */}
          <div
            className="flex-1 overflow-y-auto"
            style={{
              padding: '1rem',
            }}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};