'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors, typography, microform } from '@/styles/theme';
import { X, Play, Pause, Radio } from 'lucide-react';

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

// 1. Lore-Accurate Coordinate Frequency & Audio Profile Mapping
interface SignalAudioProfile {
  frequency: number;
  type: 'ghostly' | 'terminal' | 'numbers' | 'radar';
  label: string;
}

const SIGNAL_SETTINGS: Record<string, SignalAudioProfile> = {
  'blackwood-ambience': { frequency: 4.5, type: 'ghostly', label: 'ANOMALOUS INFRASOUND RES_4.5' },
  'bunker7-boot': { frequency: 7.0, type: 'terminal', label: 'B7_CORE_BUS_7.0' },
  'vance-lighthouse': { frequency: 5.8, type: 'ghostly', label: 'SOLSTICE_DRIFT_5.8' },
  'numbers-station-7': { frequency: 8.2, type: 'numbers', label: 'NUMBERS_STATION_8.2' },
  'meridian-dictaphone': { frequency: 3.1, type: 'ghostly', label: 'CAVERN_RESONANCE_3.1' },
  'bunker7-diagnostic': { frequency: 7.3, type: 'terminal', label: 'B7_DIAG_BUS_7.3' },
  'meridian-resonance': { frequency: 10.0, type: 'radar', label: 'DUGA_WOODPECKER_10.0' },
  'bunker7-final': { frequency: 7.9, type: 'terminal', label: 'B7_COMPROMISED_7.9' },
};

export const SignalModal: React.FC<SignalModalProps> = ({ signal, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(1.0); // Tuning slider from 1.0 to 10.0 Hz
  const [isLocked, setIsLocked] = useState(false);

  // Get active audio configuration or fallback
  const profile = useMemo(() => {
    return SIGNAL_SETTINGS[signal.id] || { frequency: 5.0, type: 'ghostly', label: 'UNKNOWN_CARRIER' };
  }, [signal.id]);

  const targetFrequency = profile.frequency;

  // Web Audio Nodes refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  // Custom synthesis oscillators/filters
  const synthNodesRef = useRef<AudioNode[]>([]);
  const signalGainRef = useRef<GainNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);

  // Canvas refs for visual oscilloscope
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // 2. Dynamic Audio Synthesizer (Tailored dynamically on connection)
  const startSynth = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // Reset node tracking array
      synthNodesRef.current = [];

      // Master signal gain node
      const signalGain = ctx.createGain();
      signalGain.gain.setValueAtTime(0, ctx.currentTime);
      signalGain.connect(ctx.destination);
      signalGainRef.current = signalGain;

      // Base background shortwave white static
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
      noiseGain.gain.setValueAtTime(0.12, ctx.currentTime);

      noiseSource.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSource.start();
      
      noiseSourceRef.current = noiseSource;
      noiseGainRef.current = noiseGain;

      // Assemble procedural instrument based on signal profile
      if (profile.type === 'ghostly') {
        // Deep breathing low-frequency atmospheric drone
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(45, ctx.currentTime); // 45Hz sub-bass hum
        osc2.frequency.setValueAtTime(45.4, ctx.currentTime); // Acoustic beating offset

        // LFO to modulate volume slow like breathing lungs
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.15, ctx.currentTime); // 0.15Hz rate (slow breathing)
        lfoGain.gain.setValueAtTime(0.08, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(signalGain.gain); // Swell master signal gain

        osc1.connect(signalGain);
        osc2.connect(signalGain);

        osc1.start();
        osc2.start();
        lfo.start();

        synthNodesRef.current.push(osc1, osc2, lfo, lfoGain);

      } else if (profile.type === 'terminal') {
        // Structural terminal cabinet whir
        const hum = ctx.createOscillator();
        const fan = ctx.createOscillator();
        const crt = ctx.createOscillator(); // 12,000Hz flyback CRT whine

        hum.type = 'sine';
        hum.frequency.setValueAtTime(60, ctx.currentTime); // 60Hz wall hum

        fan.type = 'triangle';
        fan.frequency.setValueAtTime(220, ctx.currentTime); // 220Hz fan whir

        crt.type = 'sine';
        crt.frequency.setValueAtTime(12000, ctx.currentTime); // High CRT flyback hum

        const crtGain = ctx.createGain();
        crtGain.gain.setValueAtTime(0.003, ctx.currentTime); // Keep CRT whine nearly subliminal

        hum.connect(signalGain);
        fan.connect(signalGain);
        
        crt.connect(crtGain);
        crtGain.connect(signalGain);

        hum.start();
        fan.start();
        crt.start();

        synthNodesRef.current.push(hum, fan, crt, crtGain);

      } else if (profile.type === 'numbers') {
        // Classic shortwave carrier numbers station pulse
        const carrier = ctx.createOscillator();
        carrier.type = 'sine';
        carrier.frequency.setValueAtTime(660, ctx.currentTime); // Typical East-German station tone

        // Square wave LFO to make it beep rhythmically (beep, beep, beep)
        const beeper = ctx.createOscillator();
        const beeperGain = ctx.createGain();
        beeper.type = 'square';
        beeper.frequency.setValueAtTime(4, ctx.currentTime); // 4Hz pulse rate
        beeperGain.gain.setValueAtTime(400, ctx.currentTime);

        beeper.connect(beeperGain);
        beeperGain.connect(carrier.frequency); // Modulates the pitch of the carrier wave

        carrier.connect(signalGain);
        
        carrier.start();
        beeper.start();

        synthNodesRef.current.push(carrier, beeper, beeperGain);

      } else if (profile.type === 'radar') {
        // Rhythmic, heavy 10Hz "woodpecker" sawtooth thudding
        const thump = ctx.createOscillator();
        thump.type = 'sawtooth';
        thump.frequency.setValueAtTime(10, ctx.currentTime); // 10Hz tick rate

        // Deep mechanical low-pass filter
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(150, ctx.currentTime);

        thump.connect(filter);
        filter.connect(signalGain);

        thump.start();

        synthNodesRef.current.push(thump, filter);
      }

      setIsPlaying(true);
    } catch (err) {
      console.error('AudioContext initialization failed:', err);
    }
  }, [profile]);

  const stopSynth = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (ctx) {
      // Linear release ramp to prevent audio popping
      signalGainRef.current?.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      noiseGainRef.current?.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      setTimeout(() => {
        try {
          synthNodesRef.current.forEach((node) => {
            if ('stop' in node) {
              (node as any).stop();
            }
          });
          noiseSourceRef.current?.stop();
          ctx.close();
        } catch (e) {}
        
        audioCtxRef.current = null;
        setIsPlaying(false);
      }, 150);
    }
  }, []);

  // 3. Dynamic tuning slider evaluation
  useEffect(() => {
    if (!isPlaying) return;

    const delta = Math.abs(frequency - targetFrequency);
    const accuracy = Math.max(0, 1 - delta / 0.8); // Tuning window is 0.8 Hz wide

    const ctx = audioCtxRef.current;
    if (ctx) {
      // As you approach target frequency, the background static drops...
      const staticVolume = Math.max(0.015, 0.15 * (1 - accuracy));
      noiseGainRef.current?.gain.linearRampToValueAtTime(staticVolume, ctx.currentTime + 0.05);

      // ...and the unique localized signal sweeps up!
      const signalVolume = accuracy * 0.22;
      signalGainRef.current?.gain.linearRampToValueAtTime(signalVolume, ctx.currentTime + 0.05);

      setIsLocked(accuracy > 0.95);
    }
  }, [frequency, isPlaying, targetFrequency]);

  // 4. Visual Oscilloscope Render Loop (HTML5 Canvas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const drawScope = () => {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.15)'; // CRT phosphor lag trace
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Drawing background measurement grids
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

      // Horizontal central alignment axis
      ctx.beginPath();
      ctx.strokeStyle = '#2b251d';
      ctx.lineWidth = 1;
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Plot phosphorescent trace line
      ctx.beginPath();
      ctx.strokeStyle = isLocked ? '#6a9a5a' : isPlaying ? '#ffb000' : '#423629';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = isPlaying ? 5 : 0;
      ctx.shadowColor = isLocked ? '#6a9a5a' : '#ffb000';

      const delta = Math.abs(frequency - targetFrequency);
      const staticSnow = isPlaying ? Math.min(25, 45 * delta) : 0;
      const waveAmplitude = isPlaying ? (isLocked ? 38 : 18) : 1.5;

      for (let x = 0; x < canvas.width; x++) {
        // Draw waves matching the actual mechanical type
        let wave = 0;
        if (profile.type === 'radar') {
          // Sharp repeating sawtooth visual peaks
          wave = (((x - phase * 10) % 60) / 60 - 0.5) * waveAmplitude;
        } else if (profile.type === 'numbers') {
          // Rapidly pulsing packet burst square peaks
          wave = Math.sign(Math.sin(x * 0.12 - phase)) * Math.sin(phase * 4) * waveAmplitude;
        } else {
          // Continuous, organic smooth sine waves
          wave = Math.sin(x * 0.04 - phase) * waveAmplitude;
        }

        const noiseSpike = (Math.random() - 0.5) * staticSnow;
        const y = (canvas.height / 2) + wave + noiseSpike;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Adjust animation sweep speed based on connection lock
      phase += isPlaying ? (isLocked ? 0.08 : 0.22) : 0.01;
      animationRef.current = requestAnimationFrame(drawScope);
    };

    drawScope();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, frequency, targetFrequency, isLocked, profile.type]);

  useEffect(() => {
    return () => {
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
          {/* Bezel Title Header */}
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
                
                {/* CRT Scanline Filter */}
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
                    {isPlaying ? 'PAUSE RECEIVER' : 'ENGAGE POWER'}
                  </button>
                </div>

                {/* Sweep Dial Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline" style={{ fontFamily: typography.mono, fontSize: '0.6875rem' }}>
                    <span style={{ color: colors.archive.gray }}>CARRIER DIAL SWEEP:</span>
                    <span style={{ color: isLocked ? colors.archive.green : isPlaying ? colors.archive.amber : colors.archive.grayDark, fontWeight: 'bold' }}>
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
                    <span>1.0 Hz (LOW SWEEP)</span>
                    <span>10.0 Hz (HIGH SWEEP)</span>
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

                {/* Decrypting Feed */}
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
                        Tuning... Target frequency expected near the {profile.label} coordinate sweep range.
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
                    {isLocked ? 'STABILIZED / LOCK' : isPlaying ? 'TUNING CARRIER...' : 'INACTIVE'}
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