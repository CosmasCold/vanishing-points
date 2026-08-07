'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioStore } from '@/state/audioStore';
import { useUIStore } from '@/state/uiStore';
import { colors, typography } from '@/styles/theme';

const PAGES = [
  {
    label: 'TRANSMISSION 001',
    text: `In 1983, a Soviet geologist in the Kola Peninsula drilled deeper than any human before. At 12,262 meters, the borehole began to sing. The microphones recorded a sound that should not exist at that depth — a chorus of voices, speaking in unison, in a language that has never been translated. The project was sealed. The borehole was capped with concrete. The geologist was reassigned to a weather station above the Arctic Circle. He died in 1994. His journals were destroyed. But the data survived. It was copied, smuggled, and eventually purchased by a private foundation with no name and no country.`,
  },
  {
    label: 'TRANSMISSION 002',
    text: `That foundation built BUNKER_7. Not a military installation — an archive. A terminal-driven repository for locations where the membrane between the known and the suspected grows thin. Abandoned cities that were not simply left but evacuated. Hospitals where the patients never checked out. Prisons where the silence was engineered so thoroughly that it became a physical substance. The archive does not collect ghosts. It collects coordinates, frequencies, and the precise moment when a place stops behaving like geography and starts behaving like a wound.`,
  },
  {
    label: 'TRANSMISSION 003',
    text: `You have been assigned to this terminal because someone, somewhere, believes you can withstand the information. The archive is not safe. The data carries weight. Every file you open, every photograph you enlarge, every audio log you play increases your Dust index — a measure of how much of this place has entered you. High Dust causes instability. Hallucinations. False memories. The equipment will remind you what is real. Trust the equipment. It remembers when you cannot. Ground yourself often. And do not investigate alone after midnight. The archive is not indifferent. It is hungry.`,
  },
  {
    label: 'OPERATOR BRIEFING',
    text: `Your workstation contains the Atlas — a map of all indexed locations. Select a marker to open a case file. Inside each case you will find evidence, witness testimony, and resonance connections to other sites. Use the terminal to query BUNKER_7 directly. Type "help" to begin. The Evidence Board allows you to draw suspected connections between cases. BUNKER_7 will confirm or deny them. Some cases are sealed until your Dust index is high enough. Some are sealed forever. Begin with the verified locations. Work outward. And remember: the archive is not a library. It is an investigation into a geography that does not want to be mapped.`,
  },
];

export const PrologueOverlay: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [page, setPage] = useState(0);
  const { click } = useAudioStore();
  const { setPrologueComplete } = useUIStore();

  useEffect(() => {
    const seen = localStorage.getItem('vp-prologue-seen');
    if (!seen) {
      setVisible(true);
    } else {
      setPrologueComplete();
    }
  }, [setPrologueComplete]);

  const handleNext = () => {
    click();
    if (page < PAGES.length - 1) {
      setPage(page + 1);
    } else {
      setVisible(false);
      localStorage.setItem('vp-prologue-seen', 'true');
      setPrologueComplete();
    }
  };

  const handleSkip = () => {
    click();
    setVisible(false);
    localStorage.setItem('vp-prologue-seen', 'true');
    setPrologueComplete();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ backgroundColor: colors.archive.black }}
        >
          {/* CRT scanlines */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
              backgroundSize: '100% 4px',
            }}
          />

          <motion.div
            key={page}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl mx-6 relative"
          >
            <div
              className="mb-8"
              style={{
                color: colors.archive.amber,
                fontFamily: typography.mono,
                fontSize: typography.sizes.xs,
                letterSpacing: '0.15em',
              }}
            >
              BUNKER_7 // {PAGES[page].label}
            </div>

            <div
              className="mb-10 leading-[1.8]"
              style={{
                color: colors.archive.grayLight,
                fontFamily: typography.serif,
                fontSize: typography.sizes.base,
              }}
            >
              {PAGES[page].text}
            </div>

            {/* Progress */}
            <div className="flex gap-2 mb-8">
              {PAGES.map((_, i) => (
                <div
                  key={i}
                  className="h-0.5 transition-all"
                  style={{
                    width: i === page ? '3rem' : '0.75rem',
                    backgroundColor: i === page ? colors.archive.amber : colors.archive.grayDark,
                  }}
                />
              ))}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={handleSkip}
                className="hover:opacity-70 transition-opacity"
                style={{
                  color: colors.archive.gray,
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.xs,
                }}
              >
                [SKIP TRANSMISSION]
              </button>

              <button
                onClick={handleNext}
                className="px-8 py-2 border transition-colors hover:border-amber-700"
                style={{
                  borderColor: colors.archive.amber,
                  color: colors.archive.amber,
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.sm,
                  letterSpacing: '0.05em',
                }}
              >
                {page < PAGES.length - 1 ? 'NEXT →' : 'ENTER ARCHIVE'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};