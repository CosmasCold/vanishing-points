'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/state/uiStore';
import { ModuleId } from '@/types';
import { colors, typography, spacing, timing } from '@/styles/theme';
import { X } from 'lucide-react';
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
          className="fixed top-0 bottom-0 border-r overflow-hidden flex flex-col"
          style={{ 
            left: spacing.rail,
            width: '24rem',
            backgroundColor: colors.archive.surfaceRaised,
            borderColor: colors.archive.gray,
            marginBottom: spacing.statusBar,
            zIndex: 10,
          }}
        >
          {/* Panel header */}
          <div 
            className="flex items-center justify-between px-4 h-10 border-b shrink-0"
            style={{ borderColor: colors.archive.gray }}
          >
            <span style={{ 
              color: colors.archive.amber,
              fontFamily: typography.mono,
              fontSize: typography.sizes.sm,
              letterSpacing: '0.05em',
            }}>
              {title}
            </span>
            <button
              onClick={() => {
                click();
                setActiveModule(null);
              }}
              className="hover:opacity-70 transition-opacity"
              style={{ color: colors.archive.gray }}
            >
              <X size={14} />
            </button>
          </div>
          
          {/* Panel content */}
          <div className="flex-1 overflow-y-auto p-4">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};