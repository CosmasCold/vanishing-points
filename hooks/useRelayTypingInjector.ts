"use client";

import { useEffect, useRef, useCallback } from "react";
import { useUIStore } from "@/state/uiStore";

interface SolenoidConfig {
  baseVolume?: number;      // Master gain offset [0..1]
  pitchOffset?: number;     // Core spring resonance frequency (Hz)
  chatterRate?: number;     // Extra double-click rate under high Dust status
}

/**
 * Global Keyboard Solenoid Stepping Injector Hook
 * Implements:
 * 1. Solenoid keystroke clacks with inductive energization pre-hum.
 * 2. High-Dust (>=70) physical contact double-click chatter.
 * 3. THE UNSEEN OBSERVER: Under low stability (<45%), triggers microscopic,
 *    highly localized random acoustic scares (chair scrapes, breathing, ghost clicks)
 *    when the investigator remains idle at their desk.
 */
export function useRelayTypingInjector({ baseVolume = 0.22, pitchOffset = 145 }: SolenoidConfig = {}) {
  const { status } = useUIStore();
  const dustIndex = status?.dustIndex ?? 0;
  const observerStability = status?.observerStability ?? 100;

  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastInteractionRef = useRef<number>(Date.now());
  const observerTimerRef = useRef<any>(null);

  const initAudioCtx = useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
      return audioCtxRef.current;
    } catch (e) {
      return null;
    }
  }, []);

  // Synthesizes a physical, high-voltage clack
  const playSolenoidClick = useCallback(() => {
    const ctx = initAudioCtx();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    lastInteractionRef.current = Date.now(); // Track interaction

    // A. Inductive Coil Rise (0.015s pre-hum simulating coil energization)
    const riseOsc = ctx.createOscillator();
    const riseGain = ctx.createGain();
    riseOsc.type = "sine";
    riseOsc.frequency.setValueAtTime(90.0, now); // Deep low coil pre-hum

    riseGain.gain.setValueAtTime(0.0, now);
    riseGain.gain.linearRampToValueAtTime(0.18 * baseVolume, now + 0.01);
    riseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

    riseOsc.connect(riseGain);
    riseGain.connect(ctx.destination);
    riseOsc.start(now);
    riseOsc.stop(now + 0.02);

    // B. Main Solenoid Plunger Clack (Triggered at 12ms after pre-hum)
    const clickTime = now + 0.012;

    const clackOsc = ctx.createOscillator();
    const clackGain = ctx.createGain();
    clackOsc.type = "triangle";
    clackOsc.frequency.setValueAtTime(pitchOffset, clickTime);
    clackOsc.frequency.exponentialRampToValueAtTime(32, clickTime + 0.08);

    clackGain.gain.setValueAtTime(0.0, now);
    clackGain.gain.setValueAtTime(0.35 * baseVolume, clickTime);
    clackGain.gain.exponentialRampToValueAtTime(0.0001, clickTime + 0.08);

    clackOsc.connect(clackGain);
    clackGain.connect(ctx.destination);
    clackOsc.start(clickTime);
    clackOsc.stop(clickTime + 0.1);

    // C. Physical strike plate transient (Noise burst for high-passed crispness)
    const bufferSize = ctx.sampleRate * 0.006; // Sharp 6ms burst
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;

    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = "highpass";
    hpFilter.frequency.setValueAtTime(1800, clickTime);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0, now);
    noiseGain.gain.setValueAtTime(0.24 * baseVolume, clickTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, clickTime + 0.006);

    noiseNode.connect(hpFilter);
    hpFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noiseNode.start(clickTime);
    noiseNode.stop(clickTime + 0.01);

    // D. HIGH-DUST CONTACT CHATTER (Spring bouncing at Dust >= 70)
    if (dustIndex >= 70) {
      const chatterCount = Math.random() > 0.4 ? 2 : 1;
      for (let i = 1; i <= chatterCount; i++) {
        const chatterTime = clickTime + 0.022 * i + Math.random() * 0.015;
        const bounceGain = ctx.createGain();
        const bounceOsc = ctx.createOscillator();
        
        bounceOsc.type = "triangle";
        bounceOsc.frequency.setValueAtTime(pitchOffset * 1.3, chatterTime);
        bounceOsc.frequency.exponentialRampToValueAtTime(40, chatterTime + 0.03);

        bounceGain.gain.setValueAtTime(0.0, now);
        bounceGain.gain.setValueAtTime(0.06 * baseVolume, chatterTime);
        bounceGain.gain.exponentialRampToValueAtTime(0.0001, chatterTime + 0.03);

        bounceOsc.connect(bounceGain);
        bounceGain.connect(ctx.destination);
        bounceOsc.start(chatterTime);
        bounceOsc.stop(chatterTime + 0.04);
      }
    }
  }, [baseVolume, pitchOffset, dustIndex, initAudioCtx]);

  // -------------------------------------------------------------
  // THE UNSEEN OBSERVER ENGINE (Fires micro-scares during idles)
  // -------------------------------------------------------------
  const playObserverEvent = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state === "suspended") return;

    const now = ctx.currentTime;
    const type = Math.floor(Math.random() * 3); // Pick 1 of 3 scary anomalies

    // Keep master volume extremely quiet to blur reality (is it in the game or in my room?)
    const masterVol = 0.012; 

    if (type === 0) {
      // 🔊 GHOSTLY CHAIR SCRAPE: Heavy metal scraping concrete panned wildly
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const panner = ctx.createStereoPanner();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(145, now + 1.2); // Pitch-warping drag

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(320, now);
      filter.Q.setValueAtTime(4.0, now);

      // Pan from behind-left to far-right
      panner.pan.setValueAtTime(-0.85, now);
      panner.pan.linearRampToValueAtTime(0.75, now + 1.2);

      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(masterVol * 2.2, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      osc.connect(filter);
      filter.connect(panner);
      panner.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.5);

    } else if (type === 1) {
      // 🔊 THE BREATH: Soft, high-passed warm breathing directly in left ear
      const bufferSize = ctx.sampleRate * 2.0; // 2-second breath
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const bpFilter = ctx.createBiquadFilter();
      bpFilter.type = "bandpass";
      bpFilter.Q.setValueAtTime(1.8, now);
      // Sweep frequency slowly back and forth to simulate respiratory flow
      bpFilter.frequency.setValueAtTime(250, now);
      bpFilter.frequency.exponentialRampToValueAtTime(550, now + 0.9);
      bpFilter.frequency.exponentialRampToValueAtTime(180, now + 1.9);

      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(-0.95, now); // Whisper right behind left shoulder

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(masterVol * 3.5, now + 0.85); // Inhale
      gain.gain.linearRampToValueAtTime(0.0, now + 2.0); // Exhale fade

      noise.connect(bpFilter);
      bpFilter.connect(panner);
      panner.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 2.0);

    } else if (type === 2) {
      // 🔊 GHOST CLICK: A single Strowger solenoid relay slips when hands are off keys
      const clackOsc = ctx.createOscillator();
      const clackGain = ctx.createGain();

      clackOsc.type = "triangle";
      clackOsc.frequency.setValueAtTime(pitchOffset * 0.85, now); // Slightly duller thud
      clackOsc.frequency.exponentialRampToValueAtTime(28, now + 0.08);

      clackGain.gain.setValueAtTime(masterVol * 2.8, now);
      clackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      clackOsc.connect(clackGain);
      clackGain.connect(ctx.destination);

      clackOsc.start(now);
      clackOsc.stop(now + 0.1);
    }
  }, [baseVolume, pitchOffset]);

  // Handle keydown monitoring
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        ["Control", "Shift", "Alt", "Meta", "Escape"].includes(e.key) ||
        e.key.startsWith("Arrow") ||
        e.key.startsWith("F")
      ) {
        return;
      }

      if (e.key.length === 1 || ["Backspace", "Spacebar", " ", "Enter", "Tab"].includes(e.key)) {
        playSolenoidClick();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [playSolenoidClick]);

  // Handle Unseen Observer idle tracking loop
  useEffect(() => {
    // If investigator stability is healthy, keep the unseen observer silent
    if (observerStability >= 45) {
      if (observerTimerRef.current) {
        clearInterval(observerTimerRef.current);
        observerTimerRef.current = null;
      }
      return;
    }

    // Stabilize idle ticker once every 10 seconds
    observerTimerRef.current = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastInteractionRef.current;

      // Only fire if the investigator has been completely idle at the desk for at least 25 seconds
      if (idleTime > 25000) {
        // Roll dice: once every 10 seconds of idle time, there is a 24% chance of a micro-scare
        if (Math.random() < 0.24) {
          playObserverEvent();
        }
      }
    }, 10000);

    return () => {
      if (observerTimerRef.current) {
        clearInterval(observerTimerRef.current);
        observerTimerRef.current = null;
      }
    };
  }, [observerStability, playObserverEvent]);

  // Clean Audio Context safely on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  return null;
}
