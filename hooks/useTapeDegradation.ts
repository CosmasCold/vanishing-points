import { useEffect, useRef, useState, useCallback } from "react";
import { useUIStore } from "@/state/uiStore";

interface TapeDegradationConfig {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
}

export function useTapeDegradation({ audioElement, isPlaying }: TapeDegradationConfig) {
  const { status } = useUIStore();
  const dustIndex = status.dustIndex;

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
      // Native audio element source must only be created once per element
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
      // Source -> Filter -> Delay -> Master Analyser -> Destination
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

    // Dynamic Tape-Wear duration tracking [21, 22]
    const playTime = audioElement ? audioElement.currentTime : 0;
    const durationRatio = Math.min(1.0, playTime / 135.0); // Peak degradation at 2:15 limit

    // ── 1. Tape Head Oxidation (High frequency roll-off over playtime) ──
    const filterFreq = Math.max(250, 1200 - (intensity * 400) - (durationRatio * 350));
    const filterQ = 0.5 + intensity * 4.5 + durationRatio * 1.5;

    // ── 2. Thermal Motor Drag (Wow increases as reels accumulate friction) ──
    const wowDepth = 0.00005 + (intensity * 0.00045) + (durationRatio * 0.00035);
    const wowFreq = 0.35 + (intensity * 0.65) + (durationRatio * 0.25);

    // ── 3. High-Frequency Belt Flutters ──
    const flutterDepth = 0.00001 + (intensity * 0.00015) + (durationRatio * 0.00008);
    const flutterFreq = 14.0 - (intensity * 4.0) - (durationRatio * 2.0);

    // ── 4. Progressive Oxide Hiss Accumulation ──
    const humVolume = 0.001 + intensity * 0.015;
    const hissVolume = 0.012 + (intensity * 0.088) + (durationRatio * 0.04);

    // ── 5. Transient Belt Slips (Motor pitch sags every 40s of active tape) ──
    const sagPeriod = 40;
    const relativeTime = playTime % sagPeriod;
    let sagOffset = 0;
    if (relativeTime > 37.8) { // 2.2s mechanical slip window
      const sagProgress = (relativeTime - 37.8) / 2.2;
      sagOffset = Math.sin(sagProgress * Math.PI) * 0.0028 * (0.35 + intensity * 0.65);
    }

    // Apply target transitions smoothly to avoid modern digital clicks, maintaining heavy physical warmth
    filterNodeRef.current?.frequency.setTargetAtTime(filterFreq, now, 0.25);
    filterNodeRef.current?.Q.setTargetAtTime(filterQ, now, 0.25);

    wowLfoRef.current?.frequency.setTargetAtTime(wowFreq, now, 0.3);
    wowGainRef.current?.gain.setTargetAtTime(wowDepth, now, 0.2);

    flutterLfoRef.current?.frequency.setTargetAtTime(flutterFreq, now, 0.3);
    flutterGainRef.current?.gain.setTargetAtTime(flutterDepth, now, 0.2);

    humGainRef.current?.gain.setTargetAtTime(humVolume, now, 0.4);
    hissGainRef.current?.gain.setTargetAtTime(hissVolume, now, 0.3);

    // Modulate physical delay time offset to implement motor sags
    if (delayNodeRef.current) {
      const baseDelay = 0.005 + (durationRatio * 0.004); // Creep up as tape stretches
      delayNodeRef.current.delayTime.setTargetAtTime(baseDelay + sagOffset, now, 0.08);
    }
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
      // Resume audio context if suspended (browser security autoplays)
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
    }
  }, [isPlaying, audioElement]);

  // 6. Renders live VU Meter average amplitudes via requestAnimationFrame [21]
  useEffect(() => {
    if (!isPlaying || !analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateVU = () => {
      analyser.getByteFrequencyData(dataArray);

      // Read average amplitude across our frequency bins
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;

      // Scale and smooth out the VU needle bouncing
      const scale = average / 255; // Normalize to [0..1]
      setVuValue((prev) => prev * 0.75 + scale * 0.3); // Needle momentum simulation

      // Procedural real-time motor speed and tape wear parameter sweep! [21]
      updateParameters();

      animationFrameRef.current = requestAnimationFrame(updateVU);
    };

    updateVU();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  // Tear down audio nodes completely on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  // 7. Procedural Tape Scrubbing scrape sound trigger
  const triggerScrubSound = useCallback((direction: "forward" | "backward" | "delta" | "ff" | "rw" = "delta") => {
    let ctx = audioCtxRef.current;
    if (!ctx) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        ctx = new AudioContextClass();
      } catch (e) {
        return;
      }
    }

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // A. Create mechanical Solenoid Relay clack thud
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = "triangle";
    clickOsc.frequency.setValueAtTime(115, now);
    clickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

    clickGain.gain.setValueAtTime(0.18, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.15);

    // B. Create high-passed metallic playhead friction squeal
    const bufferSize = ctx.sampleRate * 0.18; // Short 180ms burst
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = "highpass";
    hpFilter.frequency.setValueAtTime(1200, now);

    const bpFilter = ctx.createBiquadFilter();
    bpFilter.type = "bandpass";
    bpFilter.Q.setValueAtTime(2.2, now);

    // Directional pitch-shifting squeal
    const isRewind = direction === "backward" || direction === "rw";
    const startFreq = isRewind ? 1500 : 2800;
    const endFreq = isRewind ? 700 : 3800;

    bpFilter.frequency.setValueAtTime(startFreq, now);
    bpFilter.frequency.exponentialRampToValueAtTime(endFreq, now + 0.15);

    const scrapeGain = ctx.createGain();
    scrapeGain.gain.setValueAtTime(0.09, now);
    scrapeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    noiseNode.connect(hpFilter);
    hpFilter.connect(bpFilter);
    bpFilter.connect(scrapeGain);
    scrapeGain.connect(ctx.destination);

    noiseNode.start(now);
    noiseNode.stop(now + 0.2);
  }, []);

  return {
    vuValue,
    triggerScrubSound,
  };
}
