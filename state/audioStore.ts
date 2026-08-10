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
  playCalibrationDrone: () => void;
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

// Highly customized Web Audio synthesiser implementing our advanced physical sound design
function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.04) {
  const ctx = getCtx();
  if (!ctx || ctx.state === 'suspended') return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, volume = 0.015) {
  const ctx = getCtx();
  if (!ctx || ctx.state === 'suspended') return;
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
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

// 📻 Overhaul 1: Tactile Solenoid Click (replaces chirpy bip-bip game sounds)
function playDreadClick() {
  const ctx = getCtx();
  if (!ctx || ctx.state === 'suspended') return;
  const now = ctx.currentTime;

  // A. Low-frequency electromagnetic pre-charge coil rise (50 Hz)
  const riseOsc = ctx.createOscillator();
  const riseGain = ctx.createGain();
  riseOsc.type = "sine";
  riseOsc.frequency.setValueAtTime(50, now);
  riseGain.gain.setValueAtTime(0.04, now);
  riseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);
  riseOsc.connect(riseGain);
  riseGain.connect(ctx.destination);
  riseOsc.start();
  riseOsc.stop(now + 0.012);

  // B. Armature impact strike (High-frequency spring snap)
  setTimeout(() => {
    playTone(950, 0.018, 'square', 0.025);
    playTone(180, 0.045, 'triangle', 0.035); // Hollow wood/metal thud resonance
  }, 4);
}

// ⌨️ Overhaul 2: Loose Relay Type clicks with micro-contact chatter
function playRelayTap() {
  const ctx = getCtx();
  if (!ctx || ctx.state === 'suspended') return;
  const now = ctx.currentTime;
  const randFreq = 160 + Math.random() * 90;

  // Spring contact clink
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(randFreq, now);
  gain.gain.setValueAtTime(0.022, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(now + 0.04);

  // Random microcontact bounce (chatter)
  if (Math.random() > 0.45) {
    setTimeout(() => {
      playTone(randFreq * 1.5, 0.008, 'triangle', 0.008);
    }, 15 + Math.random() * 15);
  }
}

// 🚨 Overhaul 3: Massive subterranean Geophone Thud error alert
function playSubterraneanThud() {
  const ctx = getCtx();
  if (!ctx || ctx.state === 'suspended') return;
  const now = ctx.currentTime;

  // A. Solid deep basalt chest thud (45 Hz) [189]
  const thudOsc = ctx.createOscillator();
  const thudGain = ctx.createGain();
  thudOsc.type = "sine";
  thudOsc.frequency.setValueAtTime(45.0, now);
  thudGain.gain.setValueAtTime(0.12, now);
  thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
  thudOsc.connect(thudGain);
  thudGain.connect(ctx.destination);
  thudOsc.start();
  thudOsc.stop(now + 0.5);

  // B. Deflection coil high-voltage click (900 Hz)
  playTone(900, 0.08, 'sawtooth', 0.04);
  playNoise(0.15, 0.015);
}

// 🔊 Overhaul 4: Synced calibration drone (60Hz Mains ground loop + 4.5Hz infrasonic flutter)
function startAmbientHum() {
  const ctx = getCtx();
  if (!ctx || ambientOsc) return;

  ambientOsc = ctx.createOscillator();
  ambientGain = ctx.createGain();
  ambientOsc.type = 'triangle'; // Warm triangle instead of sterile sine
  ambientOsc.frequency.setValueAtTime(60.0, ctx.currentTime);
  ambientGain.gain.setValueAtTime(0.006, ctx.currentTime);

  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * 0.35;
  }
  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = noiseBuffer;
  noiseSrc.loop = true;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.003, ctx.currentTime);

  ambientOsc.connect(ambientGain);
  noiseSrc.connect(noiseGain);
  ambientGain.connect(ctx.destination);
  noiseGain.connect(ctx.destination);
  ambientOsc.start();
  noiseSrc.start();
}

function stopAmbientHum() {
  if (ambientOsc) {
    try {
      ambientOsc.stop();
      ambientOsc.disconnect();
    } catch (e) {}
    ambientOsc = null;
  }
  if (ambientGain) {
    ambientGain.disconnect();
    ambientGain = null;
  }
}

// 📐 Overhaul 5: Geodetic Solstice Drone
function playCalibrationDrone() {
  const ctx = getCtx();
  if (!ctx || ctx.state === 'suspended') return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(58.5, now); // 60Hz hum offset
  gain.gain.setValueAtTime(0.14, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(now + 4.5);

  // Synchronized 4.5 Hz bone-vibrator flutter
  const infOsc = ctx.createOscillator();
  const infGain = ctx.createGain();
  infOsc.type = 'sine';
  infOsc.frequency.setValueAtTime(4.5, now);
  infGain.gain.setValueAtTime(0.18, now);
  infGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
  infOsc.connect(infGain);
  infGain.connect(ctx.destination);
  infOsc.start();
  infOsc.stop(now + 4.5);
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
      case 'click':
        playDreadClick();
        break;
      case 'type':
        playRelayTap();
        break;
      case 'return':
        playTone(145, 0.12, 'sawtooth', 0.03); // Loose carriage thud
        break;
      case 'error':
        playSubterraneanThud();
        break;
      case 'tape':
        playNoise(0.25, 0.018); // Playhead drag
        break;
      case 'crt':
        playNoise(0.08, 0.012); // Deflection snap
        break;
      case 'alert':
        playTone(395, 0.35, 'triangle', 0.045); // Heavy alarm bell
        break;
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

  playCalibrationDrone: () => {
    if (get().muted) return;
    playCalibrationDrone();
  },
}));
