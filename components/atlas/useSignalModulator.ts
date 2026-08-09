import { useEffect, useRef, useState } from "react";

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

  // Audio Nodes
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseFilterRef = useRef<BiquadFilterNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);

  const carrierOscRef = useRef<OscillatorNode | null>(null);
  const carrierGainRef = useRef<GainNode | null>(null);

  const driftLfoRef = useRef<OscillatorNode | null>(null);
  const driftGainRef = useRef<GainNode | null>(null);

  const masterGainRef = useRef<GainNode | null>(null);

  // Calculates a normalized distance [0..1] from active dials to targets
  const getTuningDistance = (): number => {
    // Treat the dials as a 3D coordinate space. Max distance on three 0-20 loops is roughly 34.6
    const maxVal = 20;
    const diffA = Math.min(Math.abs(activeDials.a - targetDials.a), maxVal - Math.abs(activeDials.a - targetDials.a));
    const diffB = Math.min(Math.abs(activeDials.b - targetDials.b), maxVal - Math.abs(activeDials.b - targetDials.b));
    const diffC = Math.min(Math.abs(activeDials.c - targetDials.c), maxVal - Math.abs(activeDials.c - targetDials.c));
    
    const distance = Math.sqrt(diffA * diffA + diffB * diffB + diffC * diffC);
    const maxDistance = Math.sqrt(3 * 10 * 10); // Max distance with wrap-around limits
    return Math.min(1, distance / maxDistance);
  };

  // 1. Initialize Audio Context and Nodes
  const initAudio = () => {
    if (audioCtxRef.current) return;

    // Standard cross-browser compatibility
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    // Master Output Gain
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.3, ctx.currentTime);
    master.connect(ctx.destination);
    masterGainRef.current = master;

    // --- Procedural White Noise Static ---
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(1000, ctx.currentTime);
    noiseFilter.Q.setValueAtTime(1.0, ctx.currentTime);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(baseStaticVolume, ctx.currentTime);

    // Chain: Noise Source -> Bandpass Filter -> Static Volume -> Master
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);

    noiseSourceRef.current = noiseSource;
    noiseFilterRef.current = noiseFilter;
    noiseGainRef.current = noiseGain;

    // --- Heterodyne Tuning Whistle/Carrier Hum ---
    const carrierOsc = ctx.createOscillator();
    // Using a triangle wave gives a beautifully warm, retro physical glass hum [1]
    carrierOsc.type = "triangle";
    carrierOsc.frequency.setValueAtTime(800, ctx.currentTime);

    const carrierGain = ctx.createGain();
    carrierGain.gain.setValueAtTime(0, ctx.currentTime); // Starts silent until tuned

    // Chain: Carrier -> Volume -> Master
    carrierOsc.connect(carrierGain);
    carrierGain.connect(master);

    carrierOscRef.current = carrierOsc;
    carrierGainRef.current = carrierGain;

    // --- Atmospheric Atmospheric Drift (AM Modulator / Hiss Wobble) [5] ---
    const driftLfo = ctx.createOscillator();
    driftLfo.type = "sine";
    driftLfo.frequency.setValueAtTime(0.3, ctx.currentTime); // Very slow fading wave (0.3Hz)

    const driftGain = ctx.createGain();
    driftGain.gain.setValueAtTime(0.04, ctx.currentTime); // Depth of fading

    // Connect LFO to modulate our noise gain to simulate fluctuating shortwave atmospheric fading
    driftLfo.connect(driftGain);
    driftGain.connect(noiseGain.gain);

    driftLfoRef.current = driftLfo;
    driftGainRef.current = driftGain;

    // Start Oscillators
    noiseSource.start();
    carrierOsc.start();
    driftLfo.start();

    setIsActive(true);
  };

  // 2. Tear down audio nodes on unmount or manual stop
  const stopAudio = () => {
    if (!audioCtxRef.current) return;

    try {
      noiseSourceRef.current?.stop();
      carrierOscRef.current?.stop();
      driftLfoRef.current?.stop();
    } catch (e) {
      // Ignore if nodes are already stopped
    }

    noiseSourceRef.current?.disconnect();
    noiseFilterRef.current?.disconnect();
    noiseGainRef.current?.disconnect();
    carrierOscRef.current?.disconnect();
    carrierGainRef.current?.disconnect();
    driftLfoRef.current?.disconnect();
    driftGainRef.current?.disconnect();
    masterGainRef.current?.disconnect();

    audioCtxRef.current.close();
    audioCtxRef.current = null;
    setIsActive(false);
  };

  // 3. Real-time sweep modulation loop tracking active dial modifications
  useEffect(() => {
    if (!audioCtxRef.current || !isActive) return;
    const ctx = audioCtxRef.current;

    const distance = getTuningDistance(); // [0..1]
    const now = ctx.currentTime;

    if (isUnlocked) {
      // Dynamic shift: Once decrypted, clear shortwave static collapses into a clean data tone [1]
      noiseGainRef.current?.gain.setTargetAtTime(0.01, now, 0.4);
      carrierOscRef.current?.frequency.setTargetAtTime(110, now, 0.2); // Low locked terminal hum
      carrierGainRef.current?.gain.setTargetAtTime(0.12, now, 0.3);
      return;
    }

    if (isProcessing) {
      // Synthesize processing cascade clicks and high pitch alignment frequency
      noiseGainRef.current?.gain.setTargetAtTime(0.03, now, 0.1);
      carrierOscRef.current?.frequency.setValueAtTime(1200 + Math.sin(now * 30) * 150, now);
      carrierGainRef.current?.gain.setTargetAtTime(0.06, now, 0.1);
      return;
    }

    // --- Dynamic Tuning sweep mechanics ---
    // At distance 1 (un-tuned static):
    // - Noise is fully un-filtered (low Q, wide spectrum) and loud.
    // - Heterodyne tuning whistle is high-pitched, faint, or out of range.
    // As distance approaches 0 (tuned target):
    // - Noise bandpass filter narrows (High Q) around target signal.
    // - Whistle pitch drops dynamically (Zero-Beat effect) and becomes clear and clean.

    const targetCenterFreq = 650; // Dynamic center frequency of target signal (Hz)
    const staticVolume = baseStaticVolume * (0.3 + distance * 0.7);
    const carrierVolume = baseCarrierVolume * (1.0 - distance);

    // Whistle pitch drops smoothly as alignment is neared
    // Standard Heterodyne Whistle Sweep range: 1200Hz -> zero-beat target at 440Hz
    const carrierPitch = 440 + distance * 760;

    // Filter sweeps: bandpass focuses and isolates target frequency
    const filterFreq = 400 + (1.0 - distance) * (targetCenterFreq - 400);
    const filterQ = 1.0 + (1.0 - distance) * 12.0; // Filter becomes extremely narrow as target centers

    // Apply smooth target transitions to prevent modern digital clicks, retaining heavy analog warmth [5]
    noiseGainRef.current?.gain.setTargetAtTime(staticVolume, now, 0.15);
    noiseFilterRef.current?.frequency.setTargetAtTime(filterFreq, now, 0.1);
    noiseFilterRef.current?.Q.setTargetAtTime(filterQ, now, 0.15);

    carrierOscRef.current?.frequency.setTargetAtTime(carrierPitch, now, 0.1);
    carrierGainRef.current?.gain.setTargetAtTime(carrierVolume, now, 0.12);

  }, [activeDials, targetDials, isProcessing, isUnlocked, isActive]);

  // Clean up audio on hook unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  return {
    isActive,
    start: initAudio,
    stop: stopAudio,
    tuningAccuracy: 1 - getTuningDistance(),
  };
}
