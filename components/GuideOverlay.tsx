'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioStore } from '@/state/audioStore';
import { useUIStore } from '@/state/uiStore';
import { colors, typography } from '@/styles/theme';

const STEPS = [
  {
    title: 'WELCOME TO THE ARCHIVE',
    body: 'You are the new investigator assigned to BUNKER_7. Your workstation contains everything needed to document anomalous locations.',
  },
  {
    title: '1. THE ATLAS',
    body: 'Click the ATLAS button on the left rail (◎) to open the map. Each glowing dot is a location waiting to be investigated. Click any marker to select it.',
  },
  {
    title: '2. OPEN A CASE',
    body: 'Once a location is selected, click OPEN INVESTIGATION. This creates a case file with evidence, timeline, and witness testimony.',
  },
  {
    title: '3. EXAMINE EVIDENCE',
    body: 'Inside a case, click the EVIDENCE tab. Documents open in the document viewer. Audio plays through the tape deck. Video plays on the CRT monitor. Everything costs Dust to examine.',
  },
  {
    title: '4. THE TERMINAL',
    body: 'Press the ` key (backtick) or click TERM to open BUNKER_7. Type "help" for commands. Try "status" to check your Dust level. Use "ground" to restore stability.',
  },
  {
    title: '5. CONNECTIONS',
    body: 'The EVIDENCE BOARD (⬡) shows how cases link together. Draw suspected connections between locations. BUNKER_7 will confirm or deny them.',
  },
  {
    title: 'REMEMBER',
    body: 'Your Dust index rises with every discovery. High Dust makes the Archive unstable. Ground yourself often. And trust the equipment — it remembers when you cannot.',
  },
];

export const GuideOverlay: React.FC = () => {
  const { guideOpen, setGuideOpen } = useUIStore();
  const [step, setStep] = React.useState(0);
  const { click } = useAudioStore();

  React.useEffect(() => {
    if (guideOpen) setStep(0);
  }, [guideOpen]);

  const handleNext = () => {
    click();
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setGuideOpen(false);
    }
  };

  const handleClose = () => {
    click();
    setGuideOpen(false);
  };

  return (
    <AnimatePresence>
      {guideOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(20, 20, 18, 0.92)' }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-lg mx-4 border p-8 relative"
            style={{
              borderColor: colors.archive.grayDark,
              backgroundColor: colors.archive.surface,
              boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            }}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 hover:opacity-70 transition-opacity"
              style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}
            >
              × CLOSE
            </button>

            <div
              className="mb-6"
              style={{
                color: colors.archive.amber,
                fontFamily: typography.mono,
                fontSize: typography.sizes.xs,
                letterSpacing: '0.1em',
              }}
            >
              BUNKER_7 // OPERATOR BRIEFING
            </div>

            <div
              className="mb-4"
              style={{
                color: colors.archive.white,
                fontFamily: typography.mono,
                fontSize: typography.sizes.lg,
                letterSpacing: '0.02em',
              }}
            >
              {STEPS[step].title}
            </div>

            <p
              className="mb-8 leading-relaxed"
              style={{
                color: colors.archive.grayLight,
                fontFamily: typography.serif,
                fontSize: typography.sizes.base,
              }}
            >
              {STEPS[step].body}
            </p>

            <div className="flex gap-2 mb-6">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="h-1 transition-all"
                  style={{
                    width: i === step ? '2rem' : '0.5rem',
                    backgroundColor: i === step ? colors.archive.amber : colors.archive.grayDark,
                  }}
                />
              ))}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={handleClose}
                className="hover:opacity-70 transition-opacity"
                style={{
                  color: colors.archive.gray,
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.xs,
                }}
              >
                [DISMISS]
              </button>

              <button
                onClick={handleNext}
                className="px-6 py-2 border transition-colors hover:border-amber-700"
                style={{
                  borderColor: colors.archive.amber,
                  color: colors.archive.amber,
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.sm,
                  letterSpacing: '0.05em',
                }}
              >
                {step < STEPS.length - 1 ? 'NEXT →' : 'RETURN TO ARCHIVE'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};