import { create } from 'zustand';
import { getSharedAudioContext } from '@/lib/sharedAudioContext';

type SoundType =
  | 'click'
  | 'type'
  | 'return'
  | 'tape'
  | 'crt'
  | 'alert'
  | 'ambient'
  | 'error';

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

let ambientOsc: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;
let ambientNoiseSource: AudioBufferSourceNode | null = null;
let ambientNoiseGain: GainNode | null = null;

function getCtx(): AudioContext | null {
  return getSharedAudioContext();
}

// Highly customized Web Audio synthesiser implementing our advanced physical sound design
function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.04
) {
  const ctx = getCtx();

  if (!ctx || ctx.state === 'suspended' || ctx.state === 'closed') {
    return;
  }

  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + duration
  );

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

function playNoise(
  duration: number,
  volume = 0.015
) {
  const ctx = getCtx();

  if (!ctx || ctx.state === 'suspended' || ctx.state === 'closed') {
    return;
  }

  const now = ctx.currentTime;

  const bufferSize = Math.max(
    1,
    Math.floor(ctx.sampleRate * duration)
  );

  const buffer = ctx.createBuffer(
    1,
    bufferSize,
    ctx.sampleRate
  );

  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  const gain = ctx.createGain();

  source.buffer = buffer;

  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + duration
  );

  source.connect(gain);
  gain.connect(ctx.destination);

  source.start(now);
  source.stop(now + duration);
}

// Tactile Solenoid Click
function playDreadClick() {
  const ctx = getCtx();

  if (!ctx || ctx.state === 'suspended' || ctx.state === 'closed') {
    return;
  }

  const now = ctx.currentTime;

  // A. Low-frequency electromagnetic pre-charge coil rise
  const riseOsc = ctx.createOscillator();
  const riseGain = ctx.createGain();

  riseOsc.type = 'sine';
  riseOsc.frequency.setValueAtTime(50, now);

  riseGain.gain.setValueAtTime(0.02, now);
  riseGain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + 0.012
  );

  riseOsc.connect(riseGain);
  riseGain.connect(ctx.destination);

  riseOsc.start(now);
  riseOsc.stop(now + 0.012);

  // B. Armature impact strike
  setTimeout(() => {
    playTone(
      950,
      0.018,
      'square',
      0.012
    );

    playTone(
      180,
      0.045,
      'triangle',
      0.018
    );
  }, 4);
}

// Loose relay type clicks with micro-contact chatter
function playRelayTap() {
  const ctx = getCtx();

  if (!ctx || ctx.state === 'suspended' || ctx.state === 'closed') {
    return;
  }

  const now = ctx.currentTime;
  const randFreq = 160 + Math.random() * 90;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(
    randFreq,
    now
  );

  gain.gain.setValueAtTime(
    0.022,
    now
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + 0.04
  );

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.04);

  if (Math.random() > 0.45) {
    setTimeout(() => {
      playTone(
        randFreq * 1.5,
        0.008,
        'triangle',
        0.008
      );
    }, 15 + Math.random() * 15);
  }
}

// Subterranean Geophone Thud error alert
function playSubterraneanThud() {
  const ctx = getCtx();

  if (!ctx || ctx.state === 'suspended' || ctx.state === 'closed') {
    return;
  }

  const now = ctx.currentTime;

  const thudOsc = ctx.createOscillator();
  const thudGain = ctx.createGain();

  thudOsc.type = 'sine';
  thudOsc.frequency.setValueAtTime(
    45,
    now
  );

  thudGain.gain.setValueAtTime(
    0.12,
    now
  );

  thudGain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + 0.45
  );

  thudOsc.connect(thudGain);
  thudGain.connect(ctx.destination);

  thudOsc.start(now);
  thudOsc.stop(now + 0.5);

  playTone(
    900,
    0.08,
    'sawtooth',
    0.04
  );

  playNoise(
    0.15,
    0.015
  );
}

// Synced calibration / ambient hum
function startAmbientHum() {
  const ctx = getCtx();

  if (
    !ctx ||
    ctx.state === 'closed' ||
    ambientOsc
  ) {
    return;
  }

  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;

  ambientOsc =
    ctx.createOscillator();

  ambientGain =
    ctx.createGain();

  ambientOsc.type = 'triangle';

  ambientOsc.frequency.setValueAtTime(
    60,
    now
  );

  ambientGain.gain.setValueAtTime(
    0.002,
    now
  );

  const noiseBuffer =
    ctx.createBuffer(
      1,
      Math.max(
        1,
        Math.floor(ctx.sampleRate * 2)
      ),
      ctx.sampleRate
    );

  const noiseData =
    noiseBuffer.getChannelData(0);

  for (
    let i = 0;
    i < noiseData.length;
    i++
  ) {
    noiseData[i] =
      (Math.random() * 2 - 1) * 0.35;
  }

  const noiseSrc =
    ctx.createBufferSource();

  noiseSrc.buffer =
    noiseBuffer;

  noiseSrc.loop = true;

  const noiseGain =
    ctx.createGain();

  noiseGain.gain.setValueAtTime(
    0.001,
    now
  );

  ambientOsc.connect(
    ambientGain
  );

  noiseSrc.connect(
    noiseGain
  );

  ambientGain.connect(
    ctx.destination
  );

  noiseGain.connect(
    ctx.destination
  );

  ambientNoiseSource =
    noiseSrc;

  ambientNoiseGain =
    noiseGain;

  ambientOsc.start(now);
  noiseSrc.start(now);
}

function stopAmbientHum() {
  if (ambientOsc) {
    try {
      ambientOsc.stop();
    } catch {}

    try {
      ambientOsc.disconnect();
    } catch {}

    ambientOsc = null;
  }

  if (ambientGain) {
    try {
      ambientGain.disconnect();
    } catch {}

    ambientGain = null;
  }

  if (ambientNoiseSource) {
    try {
      ambientNoiseSource.stop();
    } catch {}

    try {
      ambientNoiseSource.disconnect();
    } catch {}

    ambientNoiseSource = null;
  }

  if (ambientNoiseGain) {
    try {
      ambientNoiseGain.disconnect();
    } catch {}

    ambientNoiseGain = null;
  }
}

// Geodetic Solstice Drone
function playCalibrationDrone() {
  const ctx = getCtx();

  if (!ctx || ctx.state === 'suspended' || ctx.state === 'closed') {
    return;
  }

  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';

  osc.frequency.setValueAtTime(
    58.5,
    now
  );

  gain.gain.setValueAtTime(
    0.14,
    now
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + 4.5
  );

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 4.5);

  const infOsc =
    ctx.createOscillator();

  const infGain =
    ctx.createGain();

  infOsc.type = 'sine';

  infOsc.frequency.setValueAtTime(
    4.5,
    now
  );

  infGain.gain.setValueAtTime(
    0.18,
    now
  );

  infGain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + 4.5
  );

  infOsc.connect(infGain);
  infGain.connect(ctx.destination);

  infOsc.start(now);
  infOsc.stop(now + 4.5);
}

export const useAudioStore =
  create<AudioState>((set, get) => ({
    muted: false,
    ambientPlaying: false,

    // Kept for API compatibility.
    // The actual context is owned by sharedAudioContext.ts.
    ctx: null,

    init: () => {
      getCtx();
    },

    toggleMute: () => {
      const next =
        !get().muted;

      set({
        muted: next,
      });

      if (next) {
        stopAmbientHum();
      } else if (
        get().ambientPlaying
      ) {
        startAmbientHum();
      }
    },

    play: (type) => {
      if (get().muted) {
        return;
      }

      switch (type) {
        case 'click':
          playDreadClick();
          break;

        case 'type':
          playRelayTap();
          break;

        case 'return':
          playTone(
            145,
            0.12,
            'sawtooth',
            0.03
          );
          break;

        case 'error':
          playSubterraneanThud();
          break;

        case 'tape':
          playNoise(
            0.25,
            0.018
          );
          break;

        case 'crt':
          playNoise(
            0.08,
            0.012
          );
          break;

        case 'alert':
          playTone(
            395,
            0.35,
            'triangle',
            0.045
          );
          break;

        case 'ambient':
          startAmbientHum();
          break;
      }
    },

    click: () =>
      get().play('click'),

    type: () =>
      get().play('type'),

    return: () =>
      get().play('return'),

    startAmbient: () => {
      if (
        get().muted ||
        get().ambientPlaying
      ) {
        return;
      }

      set({
        ambientPlaying: true,
      });

      startAmbientHum();
    },

    stopAmbient: () => {
      set({
        ambientPlaying: false,
      });

      stopAmbientHum();
    },

    playCalibrationDrone: () => {
      if (get().muted) {
        return;
      }

      playCalibrationDrone();
    },
  }));