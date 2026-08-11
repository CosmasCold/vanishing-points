"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioStore } from '@/state/audioStore';
import { useUIStore } from '@/state/uiStore';
import { colors, typography, microform } from '@/styles/theme';
import { BookOpen, ShieldAlert, Cpu, Radio, Sparkles, X, ChevronRight, ChevronLeft } from 'lucide-react';

const STEPS = [
  {
    title: 'WELCOME COMRADE // SYSTEM 7-B BRIEFING',
    icon: Cpu,
    body: 'You are the new investigator assigned to Carrel 7-B. Your terminal is an active, declassified telemetry link to the Vanishing Points Archive—a repository of locations where consensus reality has become unstable.',
  },
  {
    title: '1. THE GEODETIC ATLAS (◎)',
    icon: Radio,
    body: 'Select the ATLAS rail icon to open the cartographic map. Each glowing marker represents an unstable sector. Select a coordinate pylon to read its declassified geodetic survey.',
  },
  {
    title: '2. DOSSIER INITIATION',
    icon: BookOpen,
    body: 'Once a coordinate is verified, click "OPEN INVESTIGATION" to initialize its case dossier. This opens declassified transcripts, timeline structures, and margin observations.',
  },
  {
    title: '3. COGNITIVE INTENSITY (DUST)',
    icon: Sparkles,
    body: 'Examining RESTRICTED evidence releases residual informational particulate (Dust). As Dust rises, the Archive reveals deeper layers, but the terminal\'s vacuum-tube voltage will begin to sag and warp.',
  },
  {
    title: '4. THE CONSENSUS WINDOW',
    icon: ShieldAlert,
    body: 'Heavily redacted materials are best perceived within a strict psychological range (Consensus Window). Keep your Dust level between 35% and 65%, and Stability between 50% and 80%, to unredact files successfully.',
  },
  {
    title: '5. RED-YARN FELT BOARD (⬡)',
    icon: Sparkles,
    body: 'Connect apparently unrelated cases on the felt board. Drawing the correct threads will demagnetize and unlock highly secret, restricted coordinate sectors and declassified dossiers.',
  },
  {
    title: '6. ELECTROSTATIC DAMPENING',
    icon: Cpu,
    body: 'When scanlines slip or characters shiver, use terminal commands (/ground or /restore) to bleed off static charge. Calibration cycles require active investigative progress before they can be deployed.',
  },
];

export const GuideOverlay: React.FC = () => {
  const { guideOpen, setGuideOpen } = useUIStore();
  const [step, setStep] = useState(0);
  const { click, play } = useAudioStore();

  useEffect(() => {
    if (guideOpen) setStep(0);
  }, [guideOpen]);

  if (!guideOpen) return null;

  const activeStep = STEPS[step];
  const Icon = activeStep.icon;

  const handleNext = () => {
    click();
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setGuideOpen(false);
    }
  };

  const handlePrev = () => {
    click();
    if (step > 0) {
      setStep(step - 1);
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10, 8, 6, 0.94)' }}
          onClick={handleClose}
        >
          {/* CRT scanlines overlay */}
          <div className="absolute inset-0 pointer-events-none crt-scanlines z-10 opacity-30" />

          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full max-w-lg border p-8 relative flex flex-col gap-5 text-left font-mono select-none"
            style={{
              borderColor: colors.archive.grayDark || '#2a2a28',
              backgroundColor: 'rgba(15, 13, 11, 0.98)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.95), inset 0 0 40px rgba(0,0,0,0.95)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Custom Header stamp */}
            <div className="flex justify-between items-start border-b pb-3" style={{ borderColor: 'rgba(255,170,85,0.15)' }}>
              <div className="flex items-center gap-2.5">
                <Icon size={14} style={{ color: colors.archive.amber }} className="animate-pulse" />
                <span style={{ color: microform.halogen, fontSize: '9px', letterSpacing: '0.12em', fontWeight: 'bold' }}>
                  OPERATOR GUIDE // FORM-7B
                </span>
              </div>
              <button 
                onClick={handleClose} 
                className="text-[10px] text-stone-500 hover:text-stone-300 transition-colors uppercase"
              >
                × DISCONNECT
              </button>
            </div>

            {/* Content body */}
            <div className="space-y-4 py-2">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                {activeStep.title}
              </h3>
              <p 
                className="text-xs leading-relaxed text-stone-300 transition-all duration-300"
                style={{ fontFamily: typography.serif, fontSize: '13.5px' }}
              >
                {activeStep.body}
              </p>
            </div>

            {/* Bottom buttons panel */}
            <div className="flex justify-between items-center border-t pt-4 mt-2" style={{ borderColor: 'rgba(255,255,255,0.02)' }}>
              {/* Steps indicators */}
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                    style={{ 
                      backgroundColor: i === step ? microform.halogen : '#1c1916',
                      boxShadow: i === step ? `0 0 6px ${microform.halogen}` : 'none'
                    }}
                  />
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                {step > 0 && (
                  <button
                    onClick={handlePrev}
                    className="px-3 py-1 border font-mono text-[10px] tracking-wider hover:bg-[#1f1a16] active:scale-95 transition-all text-stone-400 flex items-center gap-1"
                    style={{ borderColor: colors.archive.grayDark }}
                  >
                    <ChevronLeft size={10} /> BACK
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-4 py-1 border font-mono text-[10px] tracking-wider hover:bg-[#1f1a16] active:scale-95 transition-all text-white flex items-center gap-1"
                  style={{ borderColor: microform.halogen, color: microform.halogen }}
                >
                  {step === STEPS.length - 1 ? 'BEGIN CYCLE' : 'CONTINUE'} <ChevronRight size={10} />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GuideOverlay;
