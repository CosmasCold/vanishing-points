'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBootStore } from '@/state/bootStore';
import { useUIStore } from '@/state/uiStore';
import { colors, typography } from '@/styles/theme';

export const BootSequence: React.FC = () => {
  const { phase, phaseIndex, phases, isComplete, startBoot } = useBootStore();
  const { setBooted } = useUIStore();
  
  useEffect(() => {
    startBoot();
  }, [startBoot]);
  
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => setBooted(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, setBooted]);
  
  const currentPhase = phases[phaseIndex];
  
  return (
    <div 
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ backgroundColor: colors.archive.black }}
    >
      <div className="w-full max-w-md px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 
            className="tracking-widest uppercase"
            style={{ 
              color: colors.archive.green,
              fontFamily: typography.mono,
              fontSize: typography.sizes.lg,
              fontWeight: typography.weights.semibold,
            }}
          >
            Vanishing Points
          </h1>
          <div 
            className="mt-1"
            style={{ 
              color: colors.archive.gray,
              fontFamily: typography.mono,
              fontSize: typography.sizes.xs,
            }}
          >
            ARCHIVE KERNEL v2.4.1
          </div>
        </motion.div>
        
        {/* Boot log */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {phases.slice(0, phaseIndex + 1).map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-baseline justify-between"
              >
                <span
                  style={{
                    color: i === phaseIndex && !isComplete 
                      ? colors.archive.amber 
                      : colors.archive.green,
                    fontFamily: typography.mono,
                    fontSize: typography.sizes.sm,
                  }}
                >
                  {p.label}
                </span>
                {p.detail && (
                  <span
                    style={{
                      color: colors.archive.gray,
                      fontFamily: typography.mono,
                      fontSize: typography.sizes.xs,
                    }}
                  >
                    {p.detail}
                  </span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {/* Progress bar */}
        <div className="mt-6">
          <div 
            className="h-px w-full overflow-hidden"
            style={{ backgroundColor: colors.archive.gray }}
          >
            <motion.div
              className="h-full"
              style={{ backgroundColor: colors.archive.green }}
              initial={{ width: '0%' }}
              animate={{ 
                width: `${((phaseIndex + 1) / phases.length) * 100}%` 
              }}
              transition={{ duration: 0.3, ease: 'linear' }}
            />
          </div>
        </div>
        
        {/* Cursor blink on final phase */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4"
            style={{
              color: colors.archive.amber,
              fontFamily: typography.mono,
              fontSize: typography.sizes.sm,
            }}
          >
            <span className="animate-pulse">_</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};