'use client';

import { Howl } from 'howler';
import { getSharedAudioContext } from '@/lib/sharedAudioContext';

export class AmbientMixer {
  private ctx: AudioContext | null = null;

  private oscillators: {
    freq: number;
    node: OscillatorNode;
    gain: GainNode;
  }[] = [];

  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;

  private ambientSounds: {
    rain?: Howl;
    roomTone?: Howl;
  } = {};

  constructor() {
    // AmbientMixer does not own the AudioContext.
    // The application-wide shared singleton owns it.
    this.ctx = getSharedAudioContext();
  }

  public triggerCrtWarmup() {
    const ctx = this.ctx ?? getSharedAudioContext();

    if (!ctx) {
      return;
    }

    this.ctx = ctx;

    if (ctx.state === 'closed') {
      return;
    }

    if (ctx.state === 'suspended') {
      void ctx.resume().catch((error) => {
        console.warn(
          '[AmbientMixer] Failed to resume shared AudioContext:',
          error
        );
      });
    }

    const now = ctx.currentTime;

    // ─────────────────────────────────────────────
    // 1. Analog CRT flyback whine
    // ─────────────────────────────────────────────

    const scanlineOsc = ctx.createOscillator();
    const scanlineGain = ctx.createGain();

    scanlineOsc.type = 'sine';

    scanlineOsc.frequency.setValueAtTime(
      15625,
      now
    );

    scanlineOsc.frequency.exponentialRampToValueAtTime(
      15625,
      now + 1.5
    );

    scanlineGain.gain.setValueAtTime(
      0.0002,
      now
    );

    scanlineGain.gain.exponentialRampToValueAtTime(
      0.0012,
      now + 0.8
    );

    scanlineGain.gain.exponentialRampToValueAtTime(
      0.0003,
      now + 2.0
    );

    scanlineOsc.connect(scanlineGain);
    scanlineGain.connect(ctx.destination);

    scanlineOsc.start(now);
    scanlineOsc.stop(now + 2.1);

    this.oscillators.push({
      freq: 15625,
      node: scanlineOsc,
      gain: scanlineGain,
    });

    // ─────────────────────────────────────────────
    // 2. Transformer line hum
    // ─────────────────────────────────────────────

    const powerHum = ctx.createOscillator();
    const harmonicHum = ctx.createOscillator();
    const humGain = ctx.createGain();

    powerHum.type = 'sine';

    powerHum.frequency.setValueAtTime(
      60,
      now
    );

    harmonicHum.type = 'triangle';

    harmonicHum.frequency.setValueAtTime(
      120,
      now
    );

    humGain.gain.setValueAtTime(
      0,
      now
    );

    humGain.gain.linearRampToValueAtTime(
      0.006,
      now + 1.2
    );

    powerHum.connect(humGain);
    harmonicHum.connect(humGain);
    humGain.connect(ctx.destination);

    powerHum.start(now);
    harmonicHum.start(now);

    this.oscillators.push({
      freq: 60,
      node: powerHum,
      gain: humGain,
    });

    this.oscillators.push({
      freq: 120,
      node: harmonicHum,
      gain: humGain,
    });

    // ─────────────────────────────────────────────
    // 3. CRT cathode rustle
    // ─────────────────────────────────────────────

    try {
      const bufferSize = Math.max(
        1,
        Math.floor(2 * ctx.sampleRate)
      );

      const noiseBuffer = ctx.createBuffer(
        1,
        bufferSize,
        ctx.sampleRate
      );

      const output = noiseBuffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();

      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const lowpass = ctx.createBiquadFilter();

      lowpass.type = 'lowpass';

      lowpass.frequency.setValueAtTime(
        180,
        now
      );

      const noiseGain = ctx.createGain();

      noiseGain.gain.setValueAtTime(
        0.001,
        now
      );

      noiseGain.gain.linearRampToValueAtTime(
        0.004,
        now + 2.0
      );

      whiteNoise.connect(lowpass);
      lowpass.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      this.noiseGain = noiseGain;
      this.noiseNode = whiteNoise;

      whiteNoise.start(now);
    } catch (error) {
      console.warn(
        '[AmbientMixer] Failed to generate custom audio buffer source noise:',
        error
      );
    }
  }

  public setRainVolume(vol: number) {
    if (this.ambientSounds.rain) {
      this.ambientSounds.rain.volume(vol);
    }
  }

  public setRoomToneVolume(vol: number) {
    if (this.ambientSounds.roomTone) {
      this.ambientSounds.roomTone.volume(vol);
    }
  }

  public stopAll() {
    // Stop and disconnect procedural oscillators.
    this.oscillators.forEach((osc) => {
      try {
        osc.node.stop();
      } catch {}

      try {
        osc.node.disconnect();
      } catch {}

      try {
        osc.gain.disconnect();
      } catch {}
    });

    this.oscillators = [];

    // Stop and disconnect the looping noise source.
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
      } catch {}

      try {
        this.noiseNode.disconnect();
      } catch {}

      this.noiseNode = null;
    }

    if (this.noiseGain) {
      try {
        this.noiseGain.disconnect();
      } catch {}

      this.noiseGain = null;
    }

    // Stop Howler-based ambient sounds.
    Object.values(this.ambientSounds).forEach((howl) => {
      if (howl) {
        howl.stop();
      }
    });
  }
}