'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors, typography, microform } from '@/styles/theme';
import { X, Play, Pause, Activity, Radio, Volume2 } from 'lucide-react';

interface SignalArtifact {
  id: string;
  title: string;
  source: string;
  length: string;
  dustUnlock: number;
  description: string;
  transcript: string[];
}

interface SignalModalProps {
  signal: SignalArtifact;
  onClose: () => void;
}

export const SignalModal: React.FC<SignalModalProps> = ({ signal, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(1.0); // Sweep slider from 1.0 to 10.0 Hz
  const [isLocked, setIsLocked] = useState(false);
  
  // Target frequency for anomalies
  const targetFrequency = signal.id === 'blackwood-ambience' ? 4.5 : 7.0;

  // Web Audio Nodes refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const woodpeckerRef = useRef<OscillatorNode | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  // Gain nodes
  const droneGainRef = useRef<GainNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const woodpeckerGainRef = useRef<GainNode | null>(null);

  // Canvas ref for oscilloscope
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // 1. Synthesize Procedural Audio on the Fly (Offline-safe)
  const startSynth = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // Drone (Pulsing Low-End Resonance)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'sine';
      
      // We set baseline hum around 45Hz (audible proxy for infrasonic 4.5Hz)
      osc1.frequency.setValueAtTime(45, ctx.currentTime);
      osc2.frequency.setValueAtTime(45.6, ctx.currentTime); // Offset for acoustic beating

      const droneGain = ctx.createGain();
      droneGain.gain.setValueAtTime(0, ctx.currentTime); // Start silent

      osc1.connect(droneGain);
      osc2.connect(droneGain);
      droneGain.connect(ctx.destination);

      // Woodpecker / DUGA Pulse (10 Hz rhythmic thumping)
      const woodpecker = ctx.createOscillator();
      woodpecker.type = 'sawtooth';
      woodpecker.frequency.setValueAtTime(10, ctx.currentTime); // 10Hz tick rate

      const woodpeckerGain = ctx.createGain();
      woodpeckerGain.gain.setValueAtTime(0, ctx.currentTime);

      // Low pass filter to make the thumping sound deep and mechanical
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, ctx.currentTime);

      woodpecker.connect(woodpeckerGain);
      woodpeckerGain.connect(filter);
      filter.connect(ctx.destination);

      // White Noise (Shortwave Static)
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
      noiseGain.gain.setValueAtTime(0.12, ctx.currentTime); // High baseline static

      noiseSource.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      // Start nodes
      osc1.start();
      osc2.start();
      woodpecker.start();
      noiseSource.start();

      // Store references
      osc1Ref.current = osc1;
      osc2Ref.current = osc2;
      woodpeckerRef.current = woodpecker;
      noiseSourceRef.current = noiseSource;

      droneGainRef.current = droneGain;
      noiseGainRef.current = noiseGain;
      woodpeckerGainRef.current = woodpeckerGain;

      setIsPlaying(true);
    } catch (err) {
      console.error('AudioContext initialization failed:', err);
    }
  }, []);

  const stopSynth = useCallback(() => {
    // Graceful release to prevent audio thuds
    const ctx = audioCtxRef.current;
    if (ctx) {
      droneGainRef.current?.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      noiseGainRef.current?.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      woodpeckerGainRef.current?.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      setTimeout(() => {
        try {
          osc1Ref.current?.stop();
          osc2Ref.current?.stop();
          woodpeckerRef.current?.stop();
          noiseSourceRef.current?.stop();
          ctx.close();
        } catch (e) {}
        
        audioCtxRef.current = null;
        setIsPlaying(false);
      }, 200);
    }
  }, []);

  // 2. Real-Time Signal Tuning Calculation
  useEffect(() => {
    if (!isPlaying) return;

    // Calculate how close the current slider is to the target anomalous channel
    const delta = Math.abs(frequency - targetFrequency);
    const accuracy = Math.max(0, 1 - delta / 0.8); // Peak is within 0.8 Hz threshold

    const ctx = audioCtxRef.current;
    if (ctx) {
      // Dynamic Static Level: static decreases the closer you get to target
      const staticVolume = Math.max(0.015, 0.15 * (1 - accuracy));
      noiseGainRef.current?.gain.linearRampToValueAtTime(staticVolume, ctx.currentTime + 0.05);

      // Dynamic Signal Level: target signal volume swells as static falls
      const targetVolume = accuracy * 0.18;
      droneGainRef.current?.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + 0.05);

      // DUGA Rhythmic Pulse activation when aligned
      const pulseVolume = accuracy > 0.9 ? 0.22 : 0;
      woodpeckerGainRef.current?.gain.linearRampToValueAtTime(pulseVolume, ctx.currentTime + 0.05);

      setIsLocked(accuracy > 0.95);
    }
  }, [frequency, isPlaying, targetFrequency]);

  // 3. Oscilloscope Waveform Painting (Canvas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localFrame: number;
    let phase = 0;

    const drawScope = () => {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.15)'; // CRT phosphor lag effect
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Drawing Grid
      ctx.strokeStyle = '#1e1c18';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let j = 0; j < canvas.height; j += 40) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.stroke();
      }

      // Draw horizontal reference line
      ctx.beginPath();
      ctx.strokeStyle = '#2b251d';
      ctx.lineWidth = 1;
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Oscilloscope Phosphor Waveform
      ctx.beginPath();
      ctx.strokeStyle = isLocked ? '#6a9a5a' : isPlaying ? '#ffb000' : '#423629';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = isPlaying ? 4 : 0;
      ctx.shadowColor = isLocked ? '#6a9a5a' : '#ffb000';

      const delta = Math.abs(frequency - targetFrequency);
      const noiseLevel = isPlaying ? Math.min(25, 45 * delta) : 0; // Erratic noise if mistuned
      const waveHeight = isPlaying ? (isLocked ? 38 : 18) : 1;

      for (let x = 0; x < canvas.width; x++) {
        // Compose wave using a standard sine wave mixed with deterministic noise spikes
        const sineWave = Math.sin(x * 0.04 - phase) * waveHeight;
        const noiseSpike = (Math.random() - 0.5) * noiseLevel;
        
        const y = (canvas.height / 2) + sineWave + noiseSpike;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow

      phase += isPlaying ? (isLocked ? 0.08 : 0.22) : 0.01;
      localFrame = requestAnimationFrame(drawScope);
    };

    drawScope();

    return () => {
      if (localFrame) cancelAnimationFrame(localFrame);
    };
  }, [isPlaying, frequency, targetFrequency, isLocked]);

  useEffect(() => {
    return () => {
      // Emergency unmount cleanup
      stopSynth();
    };
  }, [stopSynth]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(10, 8, 6, 0.92)' }}
        onClick={(e) => {
          stopSynth();
          onClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl border flex flex-col rounded-[2px]"
          style={{
            borderColor: colors.archive.grayDark,
            backgroundColor: colors.archive.black,
            boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
          }}
        >
          {/* Mechanical Bezel Header */}
          <div
            className="flex items-center justify-between px-4 h-11 shrink-0"
            style={{
              background: `linear-gradient(180deg, ${microform.mahogany} 0%, ${microform.iron} 100%)`,
              borderBottom: `1px solid ${microform.iron}`,
            }}
          >
            <div className="flex items-center gap-3">
              <Radio size={14} className="animate-pulse" style={{ color: colors.archive.amber }} />
              <span
                style={{
                  color: microform.halogen,
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.xs,
                  letterSpacing: '0.12em',
                  textShadow: microform.halogenText,
                }}
              >
                TACTILE SIGNAL RECORDER // MOD-7B
              </span>
            </div>
            <button
              onClick={() => {
                stopSynth();
                onClose();
              }}
              className="text-xs py-1 px-2 border transition-all hover:opacity-75"
              style={{
                borderColor: colors.archive.grayDark,
                color: colors.archive.gray,
                fontFamily: typography.mono,
              }}
            >
              × DISCONNECT
            </button>
          </div>

          <div className="p-6 flex flex-col md:flex-row gap-6">
            {/* Left Column: Scope & Controls */}
            <div className="flex-1 flex flex-col gap-4">
              {/* Retro Oscilloscope Screen */}
              <div
                className="relative rounded-[2px] border overflow-hidden p-1"
                style={{
                  borderColor: '#2a2822',
                  backgroundColor: '#0a0a0f',
                  boxShadow: 'inset 0 0 25px rgba(0,0,0,0.9)',
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={180}
                  className="w-full block bg-black"
                />
                
                {/* CRT Scanline filter overlay */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.04]"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)',
                    backgroundSize: '100% 4px',
                  }}
                />
              </div>

              {/* Tactical Control Panel */}
              <div
                className="p-4 border space-y-4 rounded-[2px]"
                style={{
                  borderColor: '#26221d',
                  backgroundColor: colors.archive.surface,
                }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: '0.6875rem' }}>
                    POWER STATE:
                  </span>
                  <button
                    onClick={isPlaying ? stopSynth : startSynth}
                    className="flex items-center gap-2 px-3 py-1.5 border text-xs tracking-wider transition-colors"
                    style={{
                      borderColor: isPlaying ? colors.archive.red : colors.archive.green,
                      color: isPlaying ? colors.archive.red : colors.archive.green,
                      fontFamily: typography.mono,
                      backgroundColor: 'rgba(0,0,0,0.15)',
                    }}
                  >
                    {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                    {isPlaying ? 'PAUSE RECEIVER' : 'ENGAGE POWER'}
                  </button>
                </div>

                {/* Sweep Dial Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline" style={{ fontFamily: typography.mono, fontSize: '0.6875rem' }}>
                    <span style={{ color: colors.archive.gray }}>FREQUENCY DIAL SWEEP:</span>
                    <span style={{ color: isLocked ? colors.archive.green : colors.archive.amber, fontWeight: 'bold' }}>
                      {frequency.toFixed(2)} Hz {isLocked && '✔ LOCK'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.05"
                    disabled={!isPlaying}
                    value={frequency}
                    onChange={(e) => setFrequency(parseFloat(e.target.value))}
                    className="w-full h-1 bg-[#1a1815] accent-amber-600 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ outline: 'none' }}
                  />
                  <div className="flex justify-between text-[9px]" style={{ color: colors.archive.grayDark, fontFamily: typography.mono }}>
                    <span>1.0 Hz (DEEP DRONE)</span>
                    <span>10.0 Hz (DUGA FREQ)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Signal Info & Decrypted Transcript */}
            <div className="w-full md:w-64 flex flex-col justify-between border-t md:border-t-0 md:border-l pt-6 md:pt-0 md:pl-6" style={{ borderColor: '#26221d' }}>
              <div className="space-y-4">
                <div style={{ fontFamily: typography.mono }}>
                  <div className="text-[10px]" style={{ color: colors.archive.amber }}>SOURCE HARDWARE</div>
                  <div className="text-xs mt-0.5" style={{ color: colors.archive.white }}>{signal.source}</div>
                </div>

                {/* Live Decrypting / Transcript log */}
                <div className="space-y-2">
                  <div style={{ fontFamily: typography.mono, fontSize: '10px', color: colors.archive.amber }}>
                    DECRYPTED TRANSMISSION FEED
                  </div>
                  <div
                    className="border p-3 h-44 overflow-y-auto rounded-[2px] space-y-2"
                    style={{
                      borderColor: '#1d1915',
                      backgroundColor: '#050508',
                      fontFamily: typography.mono,
                      fontSize: '11px',
                    }}
                  >
                    {!isPlaying ? (
                      <div style={{ color: colors.archive.grayDark }} className="animate-pulse">
  [ CHASSIS OFFLINE. ENGAGE RECEIVER POWER TO SCAN... ]
</div>
                    ) : !isLocked ? (
                      <div style={{ color: colors.archive.amber }}>
                        [ CARRIER UNSTABLE ]<br />
                        Sweep frequency dials to isolate anomalous wave coordinates...
                      </div>
                    ) : (
                      signal.transcript.map((line, idx) => (
                        <div key={idx} style={{ color: line.startsWith('[') ? colors.archive.gray : colors.archive.green }}>
                          {line}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Status details footer */}
              <div
                className="mt-6 p-3 border rounded-[2px]"
                style={{
                  borderColor: isLocked ? 'rgba(106, 154, 90, 0.15)' : '#1d1915',
                  backgroundColor: 'rgba(0,0,0,0.12)',
                  fontFamily: typography.mono,
                  fontSize: '10px',
                }}
              >
                <div className="flex justify-between items-center">
                  <span style={{ color: colors.archive.gray }}>SIGNAL STATE:</span>
                  <span style={{ color: isLocked ? colors.archive.green : isPlaying ? colors.archive.amber : colors.archive.grayDark }}>
                    {isLocked ? 'STABILIZED / DECRYPTED' : isPlaying ? 'TUNING CARRIER...' : 'INACTIVE'}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1.5">
                  <span style={{ color: colors.archive.gray }}>DANGER LEVEL:</span>
                  <span style={{ color: colors.archive.red }}>HIGH D3 // ANOMALOUS</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};