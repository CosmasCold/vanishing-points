import { useEffect, useRef, useState, useCallback } from "react";
import { useUIStore } from "@/state/uiStore";

interface TapeDegradationConfig {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
}

export function useTapeDegradation({ audioElement, isPlaying }: TapeDegradationConfig) {
  const { status } = useUIStore();
  const dustIndex = status?.dustIndex ?? 0;

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  // Analyser node for VU meters
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Degradation nodes
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  
  // LFO nodes for Wow and Flutter
  const wowLfoRef = useRef<OscillatorNode | null>(null);
  const wowGainRef = useRef<GainNode | null>(null);
  const flutterLfoRef = useRef<OscillatorNode | null>(null);
  const flutterGainRef = useRef<GainNode | null>(null);

  // Atmospheric background sounds (Mains hum, tape hiss)
  const humOscRef = useRef<OscillatorNode | null>(null);
  const humGainRef = useRef<GainNode | null>(null);
  
  const hissSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const hissGainRef = useRef<GainNode | null>(null);

  const [vuValue, setVuValue] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  // 1. Initialize Audio Context and Route Nodes
  const initAudio = () => {
    if (!audioElement || audioCtxRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // Create or reuse MediaElementSource
      if (!sourceNodeRef.current) {
        sourceNodeRef.current = ctx.createMediaElementSource(audioElement);
      }
      const source = sourceNodeRef.current;

      // Master Analyser Node
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      // Filter Node (to simulate low-fidelity telephone/tape head bandwidth)
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.Q.setValueAtTime(0.5, ctx.currentTime);
      filterNodeRef.current = filter;

      // Delay Node (for pitching/wow/flutter warble)
      const delay = ctx.createDelay(1.0);
      delay.delayTime.setValueAtTime(0.005, ctx.currentTime);
      delayNodeRef.current = delay;

      // --- Wow Modulation (Slow drift: 0.2Hz - 2Hz) ---
      const wowLfo = ctx.createOscillator();
      wowLfo.type = "sine";
      wowLfo.frequency.setValueAtTime(0.35, ctx.currentTime); // Slow cycle
      
      const wowGain = ctx.createGain();
      wowGain.gain.setValueAtTime(0.00005, ctx.currentTime); // Subtle delay modulation

      wowLfo.connect(wowGain);
      wowGain.connect(delay.delayTime);
      
      wowLfoRef.current = wowLfo;
      wowGainRef.current = wowGain;

      // --- Flutter Modulation (Fast jitter: 6Hz - 18Hz) ---
      const flutterLfo = ctx.createOscillator();
      flutterLfo.type = "triangle";
      flutterLfo.frequency.setValueAtTime(14.0, ctx.currentTime); // Shivering rate

      const flutterGain = ctx.createGain();
      flutterGain.gain.setValueAtTime(0.00001, ctx.currentTime); // Very tiny high-frequency jitter

      flutterLfo.connect(flutterGain);
      flutterGain.connect(delay.delayTime);

      flutterLfoRef.current = flutterLfo;
      flutterGainRef.current = flutterGain;

      // --- Retro 60Hz Ground Mains Hum ---
      const humOsc = ctx.createOscillator();
      humOsc.type = "triangle"; // Warm, harmonics-heavy 60Hz ground hum
      humOsc.frequency.setValueAtTime(60.0, ctx.currentTime);

      const humGain = ctx.createGain();
      humGain.gain.setValueAtTime(0.001, ctx.currentTime); // Faint background hum

      humOsc.connect(humGain);
      humGain.connect(analyser); // Route background noise to analyser for VU needle bounce

      humOscRef.current = humOsc;
      humGainRef.current = humGain;

      // --- Procedural White Tape Hiss ---
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const hissSource = ctx.createBufferSource();
      hissSource.buffer = noiseBuffer;
      hissSource.loop = true;

      const hissFilter = ctx.createBiquadFilter();
      hissFilter.type = "bandpass";
      hissFilter.frequency.setValueAtTime(3500, ctx.currentTime); // Mid-high frequency hiss
      hissFilter.Q.setValueAtTime(0.4, ctx.currentTime);

      const hissGain = ctx.createGain();
      hissGain.gain.setValueAtTime(0.015, ctx.currentTime); // Static volume

      hissSource.connect(hissFilter);
      hissFilter.connect(hissGain);
      hissGain.connect(analyser);

      hissSourceRef.current = hissSource;
      hissGainRef.current = hissGain;

      // --- Node Routing Web ---
      source.connect(filter);
      filter.connect(delay);
      delay.connect(analyser);
      analyser.connect(ctx.destination);

      // Start Oscillators
      wowLfo.start();
      flutterLfo.start();
      humOsc.start();
      hissSource.start();

      updateParameters();
    } catch (e) {
      console.error("[TAPE AUDIO ERROR] Web Audio Pipeline failed to boot:", e);
    }
  };

  // 2. Tear down the audio node context safely
  const stopAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    try {
      wowLfoRef.current?.stop();
      flutterLfoRef.current?.stop();
      humOscRef.current?.stop();
      hissSourceRef.current?.stop();
    } catch (e) {
      // Ignore if nodes already terminated
    }

    wowLfoRef.current?.disconnect();
    wowGainRef.current?.disconnect();    
    flutterLfoRef.current?.disconnect();
    flutterGainRef.current?.disconnect();
    humOscRef.current?.disconnect();
    humGainRef.current?.disconnect();
    hissSourceRef.current?.disconnect();
    hissGainRef.current?.disconnect();
    
    filterNodeRef.current?.disconnect();
    delayNodeRef.current?.disconnect();
    analyserRef.current?.disconnect();
    sourceNodeRef.current?.disconnect();

    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  // 3. Update parameters smoothly based on active Dust Index
  const updateParameters = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const now = ctx.currentTime;

    // Normalizing dust index from [0..100] scale
    const intensity = Math.min(1.0, dustIndex / 100);

    const filterFreq = 1200 - intensity * 400; // Center shifts lower
    const filterQ = 0.5 + intensity * 4.5;      // Band narrows under magnetic corrosion

    const wowDepth = 0.00005 + intensity * 0.00045; // Shifts between subtle drift and old tape drag
    const wowFreq = 0.35 + intensity * 0.65;        // Pitch slows down further as magnetic tape loses grip

    const flutterDepth = 0.00001 + intensity * 0.00015;
    const flutterFreq = 14.0 - intensity * 4.0;     // Jitters with a heavier shivering warble

    const humVolume = 0.001 + intensity * 0.015;   // Heavy AC transformer hum
    const hissVolume = 0.012 + intensity * 0.088;  // Thick atmospheric white noise floor

    filterNodeRef.current?.frequency.setTargetAtTime(filterFreq, now, 0.2);
    filterNodeRef.current?.Q.setTargetAtTime(filterQ, now, 0.2);

    wowLfoRef.current?.frequency.setTargetAtTime(wowFreq, now, 0.3);
    wowGainRef.current?.gain.setTargetAtTime(wowDepth, now, 0.2);

    flutterLfoRef.current?.frequency.setTargetAtTime(flutterFreq, now, 0.3);
    flutterGainRef.current?.gain.setTargetAtTime(flutterDepth, now, 0.2);

    humGainRef.current?.gain.setTargetAtTime(humVolume, now, 0.4);
    hissGainRef.current?.gain.setTargetAtTime(hissVolume, now, 0.3);
  };

  // 4. Update Web Audio parameters when dustIndex changes
  useEffect(() => {
    if (audioCtxRef.current) {
      updateParameters();
    }
  }, [dustIndex]);

  // 5. Playback lifecycle tracking
  useEffect(() => {
    if (isPlaying) {
      initAudio();
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
    }
  }, [isPlaying, audioElement]);

  // 6. Renders live VU Meter average amplitudes via requestAnimationFrame
  useEffect(() => {
    if (!isPlaying || !analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateVU = () => {
      analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;

      const scale = average / 255; // Normalize to [0..1]
      setVuValue((prev) => prev * 0.75 + scale * 0.3); // Needle momentum simulation

      animationFrameRef.current = requestAnimationFrame(updateVU);
    };

    updateVU();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  // ─── PROCEDURAL TAPE SCRUBBING AUDIO ENGINE ───
  const triggerScrubSound = useCallback((direction: "ff" | "rw") => {
    // If context is not ready yet, initialize on demand
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // 1. Solenoid Relay Clack (Heavy metal spring thud)
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thudOsc.type = "triangle";
    thudOsc.frequency.setValueAtTime(115, now);
    thudOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

    thudGain.gain.setValueAtTime(0.24, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    thudOsc.connect(thudGain);
    thudGain.connect(ctx.destination);
    thudOsc.start(now);
    thudOsc.stop(now + 0.15);

    // 2. High-Passed Tape Head "Squeal" Scrape
    const scrubNoise = ctx.createBufferSource();
    const bufferSize = 0.08 * ctx.sampleRate; // ~80ms scrape window
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      channelData[i] = Math.random() * 2 - 1;
    }
    scrubNoise.buffer = buffer;

    const scrubFilter = ctx.createBiquadFilter();
    scrubFilter.type = "bandpass";
    const centerFreq = direction === "ff" ? 2800 : 1500;
    scrubFilter.frequency.setValueAtTime(centerFreq, now);
    scrubFilter.frequency.exponentialRampToValueAtTime(direction === "ff" ? 3800 : 700, now + 0.08);
    scrubFilter.Q.setValueAtTime(2.2, now);

    const scrubGain = ctx.createGain();
    scrubGain.gain.setValueAtTime(0.08, now);
    scrubGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    scrubNoise.connect(scrubFilter);
    scrubFilter.connect(scrubGain);
    scrubGain.connect(ctx.destination);

    scrubNoise.start(now);
    scrubNoise.stop(now + 0.1);
  }, []);

  // Tear down audio nodes completely on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  return {
    vuValue,
    triggerScrubSound,
  };
}
