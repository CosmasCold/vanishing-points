'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors, typography, microform } from '@/styles/theme';
import { useUIStore } from '@/state/uiStore';
import { useAudioStore } from '@/state/audioStore';
import { KeyRound, Radio, Cpu, RotateCcw } from 'lucide-react';

interface DecrypterModalProps {
  onClose: () => void;
}

export const DecrypterModal: React.FC<DecrypterModalProps> = ({ onClose }) => {
  const { status, updateStatus } = useUIStore();
  const { click } = useAudioStore();

  // Mechanical Dial States
  const [dialA, setDialA] = useState(0);
  const [dialB, setDialB] = useState(0);
  const [dialC, setDialC] = useState(0);

  // Decryption States
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [dustAwarded, setDustAwarded] = useState(false);

  // Web Audio refs for procedural soundscapes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const staticGainRef = useRef<GainNode | null>(null);
  const beaconGainRef = useRef<GainNode | null>(null);
  const beaconOscRef = useRef<OscillatorNode | null>(null);

  // 1. Procedural Mechanical Clicks & Beacon Hums
  const playClickSound = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = audioCtxRef.current || new AudioContextClass();
      if (!audioCtxRef.current) audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150 + Math.random() * 50, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {}
  }, []);

  const playSuccessCascade = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      // Smooth sweep arpeggio upwards
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.6);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.6);
    } catch (e) {}
  }, []);

  // Initialize background shortwave noise
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // Continuous white noise buffer (shortwave static)
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.04, ctx.currentTime); // High initial static

      noiseSource.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSource.start();

      staticGainRef.current = noiseGain;

      // Lighthouse beacon loop (Pulsing 520Hz pure tone)
      const beaconOsc = ctx.createOscillator();
      const beaconGain = ctx.createGain();
      
      beaconOsc.type = 'sine';
      beaconOsc.frequency.setValueAtTime(520, ctx.currentTime);
      beaconGain.gain.setValueAtTime(0, ctx.currentTime);

      beaconOsc.connect(beaconGain);
      beaconGain.connect(ctx.destination);
      beaconOsc.start();

      beaconOscRef.current = beaconOsc;
      beaconGainRef.current = beaconGain;
    } catch (e) {}

    return () => {
      try {
        beaconOscRef.current?.stop();
        audioCtxRef.current?.close();
      } catch (e) {}
    };
  }, []);

  // 2. Dial rotation click triggers
  const handleDialChange = (dial: 'A' | 'B' | 'C', direction: 'up' | 'down') => {
    if (isDecrypted || isProcessing) return;
    playClickSound();

    const changeVal = (prev: number) => {
      if (direction === 'up') return prev === 20 ? 0 : prev + 1;
      return prev === 0 ? 20 : prev - 1;
    };

    if (dial === 'A') setDialA(changeVal);
    if (dial === 'B') setDialB(changeVal);
    if (dial === 'C') setDialC(changeVal);
  };

  // 3. Monitor input alignment for lock-on triggers
  useEffect(() => {
    // Solstice vector combination: 7 - 14 - 0
    if (dialA === 7 && dialB === 14 && dialC === 0 && !isDecrypted && !isProcessing) {
      setIsProcessing(true);
      click();
    }
  }, [dialA, dialB, dialC, isDecrypted, isProcessing, click]);

  // 4. Processing cascade progress loop
  useEffect(() => {
    if (!isProcessing) return;

    let interval: NodeJS.Timeout;
    const ctx = audioCtxRef.current;

    if (ctx) {
      // Dynamic Static Rampdown
      staticGainRef.current?.gain.linearRampToValueAtTime(0.002, ctx.currentTime + 2.5);
    }

    interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setIsDecrypted(true);
          playSuccessCascade();

          // Continuous Beacon Heartbeat pulse
          if (ctx && beaconGainRef.current) {
            beaconGainRef.current.gain.setValueAtTime(0.08, ctx.currentTime);
            // Pulse volume down slowly
            beaconGainRef.current.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
          }

          return 100;
        }
        return p + 4;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isProcessing, playSuccessCascade]);

  // 5. Award Dust on decryption completion
  useEffect(() => {
    if (isDecrypted && !dustAwarded) {
      setDustAwarded(true);
      // Award +15 Dust toward game progression
      updateStatus({
        dustIndex: status.dustIndex + 15,
      });
    }
  }, [isDecrypted, dustAwarded, status.dustIndex, updateStatus]);

  // 6. Reset Workstation
  const handleReset = () => {
    click();
    setDialA(0);
    setDialB(0);
    setDialC(0);
    setProgress(0);
    setIsProcessing(false);
    setIsDecrypted(false);
    const ctx = audioCtxRef.current;
    if (ctx) {
      staticGainRef.current?.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.3);
      beaconGainRef.current?.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-opacity-95"
        style={{ backgroundColor: 'rgba(10, 8, 6, 0.94)' }}
        onClick={() => {
          click();
          onClose();
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl border flex flex-col rounded-[2px]"
          style={{
            borderColor: colors.archive.grayDark,
            backgroundColor: colors.archive.black,
            boxShadow: '0 16px 48px rgba(0,0,0,0.9)',
          }}
        >
          {/* Workstation Bezel Header */}
          <div
            className="flex items-center justify-between px-4 h-11 shrink-0"
            style={{
              background: `linear-gradient(180deg, ${microform.mahogany || '#3a1b1b'} 0%, ${microform.iron || '#2a2a28'} 100%)`,
              borderBottom: `1px solid ${microform.iron || '#2a2a28'}`,
            }}
          >
            <div className="flex items-center gap-3">
              <Cpu size={14} className={isProcessing ? 'animate-spin' : ''} style={{ color: colors.archive.amber }} />
              <span
                style={{
                  color: microform.halogen || '#ffaa55',
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.xs,
                  letterSpacing: '0.12em',
                  textShadow: microform.halogenText,
                }}
              >
                ST. ELMO SHORTWAVE CRYPT / DEC-12
              </span>
            </div>
            <button
              onClick={() => {
                click();
                onClose();
              }}
              className="text-xs py-1 px-2 border transition-all hover:opacity-75"
              style={{
                borderColor: colors.archive.grayDark,
                color: colors.archive.gray,
                fontFamily: typography.mono,
              }}
            >
              × CLOSED
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Decrypter Matrix Display Screen */}
            <div
              className="p-4 rounded-[2px] border relative overflow-hidden h-36"
              style={{
                borderColor: '#26221d',
                backgroundColor: '#070709',
                boxShadow: 'inset 0 0 15px rgba(0,0,0,0.95)',
                fontFamily: typography.mono,
              }}
            >
              <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)', backgroundSize: '100% 4px' }} />
              
              {!isProcessing && !isDecrypted ? (
                <div className="space-y-1.5 text-xs text-amber-600/70">
                  <div style={{ color: colors.archive.amber }}>AWAITING SEQUENCE LOCK...</div>
                  <div className="text-[10px]" style={{ color: colors.archive.gray }}>CARRIER WAVE: Unregistered numbers loop (Channel 7)</div>
                  <div className="text-[10px]" style={{ color: colors.archive.gray }}>DIAL KEY COORDINATES: Solstice axis vector code</div>
                  <div className="mt-4 flex gap-1 items-center animate-pulse" style={{ color: colors.archive.red }}>
                    <Radio size={11} /> MONITORING SIGNAL BACKPLANE_
                  </div>
                </div>
              ) : isProcessing ? (
                <div className="space-y-4">
                  <div className="text-xs text-amber-500 animate-pulse">ALIGNED. DECIPHERING DATA VOLUMES...</div>
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-[#151310] overflow-hidden rounded-[1px]">
                      <div className="h-full bg-amber-600 transition-all duration-100" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px]" style={{ color: colors.archive.gray }}>
                      <span>DECRYPT STAGE: KERNEL_SWEEP</span>
                      <span>{progress}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2" style={{ color: colors.archive.green }}>
                    <KeyRound size={12} /> SEQUENCE RESOLVED: BEACON CARRIER LOCKED
                  </div>
                  <div className="border-t pt-2 mt-2 space-y-1" style={{ borderColor: '#221a15' }}>
                    <div className="text-[10px]" style={{ color: colors.archive.gray }}>DECRYPTED BEACON CODE [7.14.0]:</div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm font-bold tracking-wider leading-relaxed"
                      style={{ color: colors.archive.green }}
                    >
                      "THE LIGHT STILL WORKS. THAT'S ALL. THAT'S ENOUGH."
                    </motion.div>
                  </div>
                </div>
              )}
            </div>

            {/* Rotary Clicker Selector Dials */}
            <div className="flex justify-around items-center py-4">
              {/* Dial A */}
              <div className="flex flex-col items-center gap-3">
                <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: '10px' }}>KEY ALPHA</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={isDecrypted || isProcessing}
                    onClick={() => handleDialChange('A', 'down')}
                    className="w-7 h-7 border text-center font-bold text-xs bg-[#1a1714] disabled:opacity-30"
                    style={{ borderColor: colors.archive.grayDark, color: colors.archive.amber }}
                  >
                    -
                  </button>
                  <div
                    className="w-12 h-12 border flex items-center justify-center font-bold text-lg rounded-full"
                    style={{
                      borderColor: dialA === 7 ? colors.archive.green : colors.archive.gray,
                      fontFamily: typography.mono,
                      backgroundColor: '#0a0a0f',
                      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)',
                    }}
                  >
                    {dialA}
                  </div>
                  <button
                    disabled={isDecrypted || isProcessing}
                    onClick={() => handleDialChange('A', 'up')}
                    className="w-7 h-7 border text-center font-bold text-xs bg-[#1a1714] disabled:opacity-30"
                    style={{ borderColor: colors.archive.grayDark, color: colors.archive.amber }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Dial B */}
              <div className="flex flex-col items-center gap-3">
                <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: '10px' }}>KEY BETA</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={isDecrypted || isProcessing}
                    onClick={() => handleDialChange('B', 'down')}
                    className="w-7 h-7 border text-center font-bold text-xs bg-[#1a1714] disabled:opacity-30"
                    style={{ borderColor: colors.archive.grayDark, color: colors.archive.amber }}
                  >
                    -
                  </button>
                  <div
                    className="w-12 h-12 border flex items-center justify-center font-bold text-lg rounded-full"
                    style={{
                      borderColor: dialB === 14 ? colors.archive.green : colors.archive.gray,
                      fontFamily: typography.mono,
                      backgroundColor: '#0a0a0f',
                      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)',
                    }}
                  >
                    {dialB}
                  </div>
                  <button
                    disabled={isDecrypted || isProcessing}
                    onClick={() => handleDialChange('B', 'up')}
                    className="w-7 h-7 border text-center font-bold text-xs bg-[#1a1714] disabled:opacity-30"
                    style={{ borderColor: colors.archive.grayDark, color: colors.archive.amber }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Dial C */}
              <div className="flex flex-col items-center gap-3">
                <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: '10px' }}>KEY GAMMA</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={isDecrypted || isProcessing}
                    onClick={() => handleDialChange('C', 'down')}
                    className="w-7 h-7 border text-center font-bold text-xs bg-[#1a1714] disabled:opacity-30"
                    style={{ borderColor: colors.archive.grayDark, color: colors.archive.amber }}
                  >
                    -
                  </button>
                  <div
                    className="w-12 h-12 border flex items-center justify-center font-bold text-lg rounded-full"
                    style={{
                      borderColor: dialC === 0 ? colors.archive.green : colors.archive.gray,
                      fontFamily: typography.mono,
                      backgroundColor: '#0a0a0f',
                      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)',
                    }}
                  >
                    {dialC}
                  </div>
                  <button
                    disabled={isDecrypted || isProcessing}
                    onClick={() => handleDialChange('C', 'up')}
                    className="w-7 h-7 border text-center font-bold text-xs bg-[#1a1714] disabled:opacity-30"
                    style={{ borderColor: colors.archive.grayDark, color: colors.archive.amber }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Utility Workstation Controls */}
            <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: '#26221d' }}>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-1.5 border text-xs tracking-wider transition-colors hover:border-amber-700"
                style={{
                  borderColor: colors.archive.grayDark,
                  color: colors.archive.gray,
                  fontFamily: typography.mono,
                }}
              >
                <RotateCcw size={12} /> RESET DEC-12 DIALS
              </button>

              <div style={{ fontFamily: typography.mono, fontSize: '10px' }}>
                {isDecrypted ? (
                  <span style={{ color: colors.archive.green }}>REWARD: +15 DUST COMMITTED</span>
                ) : (
                  <span style={{ color: colors.archive.gray }}>ALIGN SEQUENCE TO UNLOCK</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};