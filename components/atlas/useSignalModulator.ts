import { useEffect, useRef, useState, useCallback } from "react";

interface DialState {
  a: number;
  b: number;
  c: number;
}

interface ModulatorConfig {
  activeDials: DialState;
  targetDials: DialState;
  isProcessing: boolean;
  isUnlocked: boolean;
  baseStaticVolume?: number;
  baseCarrierVolume?: number;
}

/**
 * HIGH-PERFORMANCE PROCEDURAL SIGNAL TUNING & STATIC MODULATOR HOOK
 * Synthesizes shortwave background static, ionospheric crackle, and carrier oscillations.
 * Evaluates real-time 3D geodetic dial alignment vectors to dynamically fade signals.
 *
 * Core Enhancements:
 * 1. PERSISTENT AUDIOCONTEXT: Lazily initializes and caches a single AudioContext ref,
 *    preventing modern browser heap leak exhaustion (Error 15GB heap crash).
 * 2. MEMOIZED LIFECYCLE CALLBACKS: Wraps start() and stop() inside useCallback() to prevent
 *    hot-recreation render cycles inside Modal wrappers.
 * 3. REAL-TIME PARAMETER SLIDING: Updates gains smoothly via Web Audio AudioParams (.setTargetAtTime)
 *    to block digital pops and eliminate the need to tear down nodes during active tuning.
 */
export function useSignalModulator({
  activeDials,
  targetDials,
  isProcessing,
  isUnlocked,
  baseStaticVolume = 0.15,
  baseCarrierVolume = 0.08,
}: ModulatorConfig) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [isActive, setIsActive] = useState(false);

  // Audio Node Refs
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseFilterRef = useRef<BiquadFilterNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);

  const carrierOscRef = useRef<OscillatorNode | null>(null);
  const carrierGainRef = useRef<GainNode | null>(null);

  const driftLfoRef = useRef<OscillatorNode | null>(null);
  const driftGainRef = useRef<GainNode | null>(null);

  const masterGainRef = useRef<GainNode | null>(null);

  // Calculates normalized 3D dial vector offset distance [0..1]
  const getTuningDistance = useCallback((): number => {
    const maxVal = 21; // Dials loop on a 0..20 modulus base
    
    const diffA = Math.min(
      Math.abs(activeDials.a - targetDials.a),
      maxVal - Math.abs(activeDials.a - targetDials.a)
    );
    const diffB = Math.min(
      Math.abs(activeDials.b - targetDials.b),
      maxVal - Math.abs(activeDials.b - targetDials.b)
    );
    const diffC = Math.min(
      Math.abs(activeDials.c - targetDials.c),
      maxVal - Math.abs(activeDials.c - targetDials.c)
    );

    const dist = Math.sqrt(diffA * diffA + diffB * diffB + diffC * diffC);
    const maxDist = Math.sqrt(10.5 * 10.5 + 10.5 * 10.5 + 10.5 * 10.5); // Max loops offset
    return Math.min(1.0, dist / (maxDist || 1));
  }, [activeDials, targetDials]);

  const tuningAccuracy = 1 - getTuningDistance();

  // Lazy constructor for our procedural AudioContext
  const initAudio = useCallback(() => {
    if (typeof window === "undefined") return;
    const { getSharedAudioContext } = require("@/lib/sharedAudioContext");
    audioCtxRef.current = getSharedAudioContext();
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      setIsActive(true);
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const now = ctx.currentTime;

      // ── 1. MASTER OUTPUT SHIELDING ──
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(1.0, now);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // ── 2. ATMOSPHERIC WHITE NOISE (Shortwave Static) ──
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      // Bandpass filter to sculpt static into shortwave spectral band
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(1600, now);
      noiseFilter.Q.setValueAtTime(1.2, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(baseStaticVolume, now);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noiseSource.start(now);

      noiseSourceRef.current = noiseSource;
      noiseFilterRef.current = noiseFilter;
      noiseGainRef.current = noiseGain;

      // ── 3. CLEAN SIGNAL CARRIER WAVE (AM Whistle / Resonance) ──
      const carrierOsc = ctx.createOscillator();
      carrierOsc.type = "sine";
      carrierOsc.frequency.setValueAtTime(800.0, now); // Sweet-spot AM whistle

      const carrierGain = ctx.createGain();
      carrierGain.gain.setValueAtTime(0.0, now); // Fades in on alignment!

      carrierOsc.connect(carrierGain);
      carrierGain.connect(masterGain);
      carrierOsc.start(now);

      carrierOscRef.current = carrierOsc;
      carrierGainRef.current = carrierGain;

      // ── 4. IONOSPHERIC DRIFT LFO (Atmospheric Signal Flutter) ──
      const driftLfo = ctx.createOscillator();
      driftLfo.type = "triangle";
      driftLfo.frequency.setValueAtTime(1.5, now); // 1.5 Hz slow drift

      const driftGain = ctx.createGain();
      driftGain.gain.setValueAtTime(18.0, now); // Modulates carrier pitch by up to 18Hz

      driftLfo.connect(driftGain);
      driftGain.connect(carrierOsc.frequency); // Sweep the pitch!
      driftLfo.start(now);

      driftLfoRef.current = driftLfo;
      driftGainRef.current = driftGain;

      setIsActive(true);
    } catch (e) {
      console.warn("[Web Audio Modulator] Failed to energize static nodes:", e);
    }
  }, [baseStaticVolume]);

  const stopAudio = useCallback(() => {
    setIsActive(false);
    
    // Smoothly fade master output to prevent loud click pops
    const ctx = audioCtxRef.current;
    if (ctx && masterGainRef.current) {
      try {
        masterGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      } catch (e) {}
    }
  }, []);

  // Safe manual destructor on component unmount
  useEffect(() => {
    return () => {
      // Direct hard clean-up of oscillators and buffer sources to prevent memory leaks
      try {
        noiseSourceRef.current?.stop();
        carrierOscRef.current?.stop();
        driftLfoRef.current?.stop();
      } catch (e) {}

      noiseSourceRef.current?.disconnect();
      noiseFilterRef.current?.disconnect();
      noiseGainRef.current?.disconnect();

      carrierOscRef.current?.disconnect();
      carrierGainRef.current?.disconnect();

      driftLfoRef.current?.disconnect();
      driftGainRef.current?.disconnect();

      masterGainRef.current?.disconnect();

      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  // Real-time parameter slides (Runs inside the rendering sweep loop)
  useEffect(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || !isActive) return;

    const now = ctx.currentTime;

    // Static volume fades out as dials align, leaving a clean signal payload
    const targetStaticVol = isUnlocked
      ? 0.01 // Minimal background whisper when fully cracked
      : baseStaticVolume * (1.1 - tuningAccuracy * 0.95);

    // Carrier payload whistles louder and clarifies pitch as dials align
    const targetCarrierVol = isUnlocked
      ? 0.0
      : isProcessing
      ? baseCarrierVolume * 0.4 // Muffled hum during decryption bursts
      : baseCarrierVolume * Math.pow(tuningAccuracy, 4); // Exp curve makes tuning narrow & tactile

    // Modulate bandpass static filter width
    const filterFreq = 1600 - (tuningAccuracy * 800); // Freq shifts deeper as signal locks
    const filterQ = 1.2 + (tuningAccuracy * 4.5); // Static narrows into a pure whistling hiss

    noiseGainRef.current?.gain.setTargetAtTime(targetStaticVol, now, 0.12);
    noiseFilterRef.current?.frequency.setTargetAtTime(filterFreq, now, 0.15);
    noiseFilterRef.current?.Q.setTargetAtTime(filterQ, now, 0.15);

    carrierGainRef.current?.gain.setTargetAtTime(targetCarrierVol, now, 0.08);

    // Modulate slow LFO speed to reflect signal clarity
    const driftSpeed = 1.5 + (1 - tuningAccuracy) * 4.0; // Slows down and stabilizes as locked
    driftLfoRef.current?.frequency.setTargetAtTime(driftSpeed, now, 0.2);

  }, [isActive, tuningAccuracy, isProcessing, isUnlocked, baseStaticVolume, baseCarrierVolume]);

  return {
    isActive,
    start: initAudio,
    stop: stopAudio,
    tuningAccuracy,
  };
}
