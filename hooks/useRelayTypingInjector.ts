"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useUIStore } from '@/state/uiStore';

interface SolenoidConfig {
  baseVolume?: number;      // Master gain offset [0..1]
  pitchOffset?: number;     // Core spring resonance frequency (Hz)
  chatterRate?: number;     // Extra double-click rate under high Dust status
}

/**
 * Custom Web Audio hook to procedurally synthesize cold-war era Strowger stepping relays,
 * copper coil inductive rises, and spring-loaded solenoid contact clicks.
 * Intercepts keyboard alphanumeric keypresses globally and modulates auditory decay,
 * metal frame resonance, and contact chatter dynamically based on Observer Dust Index [2, 5, 22].
 */
export function useRelayTypingInjector(config: SolenoidConfig = {}) {
  const {
    baseVolume = 0.22,
    pitchOffset = 145, // Resonant pitch of the heavy mechanical terminal frame
  } = config;

  const { status } = useUIStore();
  const dustIndex = status?.dustIndex || 0;

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Initialize browser audio nodes safely on user action
  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.setValueAtTime(baseVolume, ctx.currentTime);
    master.connect(ctx.destination);
    masterGainRef.current = master;

    return ctx;
  }, [baseVolume]);

  /**
   * Procedurally synthesizes a physical Strowger relay cycle:
   * 1. Electromagnetic Coil Inductive Hum (Pre-click rise)
   * 2. Armature Impact Strike (Low-frequency frame resonance)
   * 3. Contact Reed Snap (High-frequency spring transient)
   * 4. High-Dust Chatter (Erratic magnetic contact bounces) [20, 22]
   */
  const triggerRelayClick = useCallback(() => {
    const ctx = initAudio();
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    // Resume suspended audio context if browser flagged idle
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Introduce dynamic thermal drift and mechanical age fluctuations based on Dust status [20]
    const drift = (Math.random() * 20 - 10) * (1.0 + dustIndex / 50.0);
    const framePitch = pitchOffset + drift;

    // ── STEP 1: INDUCTIVE COIL RISE ─────────────────────────────────
    // Simulates the copper solenoid coil building an electromagnetic field [5]
    const coilOsc = ctx.createOscillator();
    const coilGain = ctx.createGain();
    coilOsc.type = 'sine';
    coilOsc.frequency.setValueAtTime(60, now); // 60Hz mains magnetic hum leakage [22]
    
    coilGain.gain.setValueAtTime(0.001, now);
    coilGain.gain.exponentialRampToValueAtTime(0.06, now + 0.008);
    coilGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    coilOsc.connect(coilGain);
    coilGain.connect(master);
    coilOsc.start(now);
    coilOsc.stop(now + 0.02);

    // ── STEP 2: CHASSIS FRAME RESONANCE ─────────────────────────────
    // Simulates the heavy iron armature striking the stop block [2]
    const frameOsc = ctx.createOscillator();
    const frameGain = ctx.createGain();
    frameOsc.type = 'triangle'; // Warm, hollow wooden/cast-iron resonance
    frameOsc.frequency.setValueAtTime(framePitch, now + 0.005);

    // Dampen the chassis resonance faster as dust particles accumulate inside hinges [20]
    const dampingConstant = Math.max(0.012, 0.035 - (dustIndex / 100) * 0.02);

    frameGain.gain.setValueAtTime(0.001, now);
    frameGain.gain.setValueAtTime(0.4, now + 0.005);
    frameGain.gain.exponentialRampToValueAtTime(0.001, now + 0.005 + dampingConstant);

    frameOsc.connect(frameGain);
    frameGain.connect(master);
    frameOsc.start(now + 0.005);
    frameOsc.stop(now + 0.1);

    // ── STEP 3: CONTACT REED SNAP ──────────────────────────────────
    // Simulates the sharp metallic transient pop of the physical switch reed contact
    const bufferSize = ctx.sampleRate * 0.006; // Ultra-short 6ms contact click
    const clickBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const bufferData = clickBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      bufferData[i] = Math.random() * 2 - 1; // Pure White Noise
    }

    const clickSource = ctx.createBufferSource();
    clickSource.buffer = clickBuffer;

    const clickFilter = ctx.createBiquadFilter();
    clickFilter.type = 'highpass';
    clickFilter.frequency.setValueAtTime(2400 + Math.random() * 800, now + 0.005); // High metallic snap

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.001, now);
    clickGain.gain.setValueAtTime(0.18, now + 0.005);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.011);

    clickSource.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(master);
    clickSource.start(now + 0.005);

    // ── STEP 4: DUST CHATTER (ANOMALOUS ELECTROSTATIC MULTI-CLICKS) ──
    // Under high Dust load, electromagnetic interference causes contacts to chatter/flicker [29, 30]
    if (dustIndex >= 40 && Math.random() < (dustIndex / 120)) {
      const chatterCount = Math.floor(1 + Math.random() * 2);
      for (let c = 1; c <= chatterCount; c++) {
        const chatterDelay = 0.018 * c + Math.random() * 0.005;
        const chatterOsc = ctx.createOscillator();
        const chatterGain = ctx.createGain();

        chatterOsc.type = 'sine';
        chatterOsc.frequency.setValueAtTime(framePitch * 1.8, now + chatterDelay);

        chatterGain.gain.setValueAtTime(0.001, now);
        chatterGain.gain.setValueAtTime(0.15 / c, now + chatterDelay);
        chatterGain.gain.exponentialRampToValueAtTime(0.001, now + chatterDelay + 0.008);

        chatterOsc.connect(chatterGain);
        chatterGain.connect(master);
        chatterOsc.start(now + chatterDelay);
        chatterOsc.stop(now + chatterDelay + 0.02);
      }
    }
  }, [initAudio, pitchOffset, dustIndex]);

  // Global keyboard input event sniffer
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore navigation, shortcuts, modifiers, and workspace operations
      if (
        e.ctrlKey || 
        e.metaKey || 
        e.altKey || 
        e.key === 'Control' || 
        e.key === 'Shift' || 
        e.key === 'Alt' || 
        e.key === 'Meta' ||
        e.key === 'Escape' ||
        e.key.startsWith('Arrow') ||
        e.key.startsWith('F') // Ignore function keys
      ) {
        return;
      }

      // Only click on actual textual inputs, commands, backticks, or spacebars [22]
      if (
        e.key.length === 1 || // Alphanumeric keys & symbols
        e.key === 'Backspace' || 
        e.key === 'Spacebar' || 
        e.key === ' ' || 
        e.key === 'Enter' ||
        e.key === '`'
      ) {
        triggerRelayClick();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [triggerRelayClick]);

  // Handle teardown on layout unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        masterGainRef.current?.disconnect();
        audioCtxRef.current.close();
      }
    };
  }, []);

  return {
    triggerRelayClick,
    audioContext: audioCtxRef.current,
  };
}
