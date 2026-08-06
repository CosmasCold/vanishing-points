import { create } from 'zustand';

type SoundType = 'click' | 'type' | 'return' | 'tape' | 'crt' | 'alert' | 'ambient' | 'error';

interface AudioState {
  muted: boolean;
  ambientPlaying: boolean;
  ctx: AudioContext | null;

  init: () => void;
  toggleMute: () => void;
  play: (type: SoundType) => void;
  click: () => void;
  type: () => void;
  return: () => void;
  startAmbient: () => void;
  stopAmbient: () => void;
}

let audioCtx: AudioContext | null = null;
let ambientOsc: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.04) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, volume = 0.015) {
  const ctx = getCtx();
  if (!ctx) return;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

function playClick() {
  playTone(800, 0.03, 'square', 0.03);
  setTimeout(() => playTone(1200, 0.02, 'square', 0.02), 30);
}

function playType() {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(200 + Math.random() * 100, ctx.currentTime);
  gain.gain.setValueAtTime(0.02, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.04);
}

function playReturn() {
  playTone(150, 0.1, 'sawtooth', 0.04);
}

function playError() {
  playTone(180, 0.3, 'sawtooth', 0.05);
  setTimeout(() => playTone(150, 0.3, 'sawtooth', 0.05), 120);
}

function startAmbientHum() {
  const ctx = getCtx();
  if (!ctx || ambientOsc) return;
  
  ambientOsc = ctx.createOscillator();
  ambientGain = ctx.createGain();
  ambientOsc.type = 'sine';
  ambientOsc.frequency.setValueAtTime(60, ctx.currentTime);
  ambientGain.gain.setValueAtTime(0.008, ctx.currentTime);
  
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * 0.3;
  }
  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = noiseBuffer;
  noiseSrc.loop = true;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.004, ctx.currentTime);
  
  ambientOsc.connect(ambientGain);
  noiseSrc.connect(noiseGain);
  ambientGain.connect(ctx.destination);
  noiseGain.connect(ctx.destination);
  ambientOsc.start();
  noiseSrc.start();
}

function stopAmbientHum() {
  if (ambientOsc) {
    ambientOsc.stop();
    ambientOsc.disconnect();
    ambientOsc = null;
  }
  if (ambientGain) {
    ambientGain.disconnect();
    ambientGain = null;
  }
}

export const useAudioStore = create<AudioState>((set, get) => ({
  muted: false,
  ambientPlaying: false,
  ctx: null,

  init: () => {
    getCtx();
  },

  toggleMute: () => {
    const next = !get().muted;
    set({ muted: next });
    if (next) {
      stopAmbientHum();
    } else if (get().ambientPlaying) {
      startAmbientHum();
    }
  },

  play: (type) => {
    if (get().muted) return;
    switch (type) {
      case 'click': playClick(); break;
      case 'type': playType(); break;
      case 'return': playReturn(); break;
      case 'error': playError(); break;
      case 'tape': playNoise(0.3, 0.02); break;
      case 'crt': playNoise(0.1, 0.01); break;
      case 'alert': playTone(440, 0.2, 'square', 0.03); break;
    }
  },

  click: () => get().play('click'),
  type: () => get().play('type'),
  return: () => get().play('return'),

  startAmbient: () => {
    if (get().muted || get().ambientPlaying) return;
    set({ ambientPlaying: true });
    startAmbientHum();
  },

  stopAmbient: () => {
    set({ ambientPlaying: false });
    stopAmbientHum();
  },
}));