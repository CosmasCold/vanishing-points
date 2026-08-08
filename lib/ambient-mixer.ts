"use client";

import { Howl } from "howler";

export class AmbientMixer {
  private ctx: AudioContext | null = null;
  private oscillators: { freq: number; node: OscillatorNode; gain: GainNode }[] = [];
  private noiseNode: AudioWorkletNode | ScriptProcessorNode | null = null;
  private noiseGain: GainNode | null = null;
  private ambientSounds: { rain?: Howl; roomTone?: Howl } = {};

  constructor() {
    if (typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  public triggerCrtWarmup() {
    const ctx = this.ctx;
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    // ── 1. Synthesize Procedural Analog CRT Flyback Whine (15.6 kHz scanline)
    const scanlineOsc = ctx.createOscillator();
    const scanlineGain = ctx.createGain();

    scanlineOsc.type = "sine";
    scanlineOsc.frequency.setValueAtTime(15625, ctx.currentTime); // Standard analog scan frequency
    
    // Whine starts high and settled, mimic analog tube warmup sweep
    scanlineOsc.frequency.exponentialRampToValueAtTime(15625, ctx.currentTime + 1.5);

    // Keep scanline whine incredibly quiet so it doesn't fatigue real-world ears but adds "tactile" space
    scanlineGain.gain.setValueAtTime(0.0002, ctx.currentTime);
    scanlineGain.gain.exponentialRampToValueAtTime(0.0012, ctx.currentTime + 0.8);
    scanlineGain.gain.exponentialRampToValueAtTime(0.0003, ctx.currentTime + 2.0);

    scanlineOsc.connect(scanlineGain);
    scanlineGain.connect(ctx.destination);
    scanlineOsc.start();

    this.oscillators.push({ freq: 15625, node: scanlineOsc, gain: scanlineGain });

    // ── 2. Synthesize Procedural Transformer Line Hum (60 Hz + 120 Hz harmonics)
    const powerHum = ctx.createOscillator();
    const harmonicHum = ctx.createOscillator();
    const humGain = ctx.createGain();

    powerHum.type = "sine";
    powerHum.frequency.setValueAtTime(60, ctx.currentTime); // 60Hz US line frequency

    harmonicHum.type = "triangle";
    harmonicHum.frequency.setValueAtTime(120, ctx.currentTime); // Harmonic distortion overtones

    humGain.gain.setValueAtTime(0, ctx.currentTime);
    humGain.gain.linearRampToValueAtTime(0.006, ctx.currentTime + 1.2);

    powerHum.connect(humGain);
    harmonicHum.connect(humGain);
    humGain.connect(ctx.destination);

    powerHum.start();
    harmonicHum.start();

    this.oscillators.push({ freq: 60, node: powerHum, gain: humGain });
    this.oscillators.push({ freq: 120, node: harmonicHum, gain: humGain });

    // ── 3. Synthesize CRT Cathode Rustle (Low Frequency Noise floor)
    try {
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 180; // Suffuse it into a warm low-frequency rustle

      this.noiseGain = ctx.createGain();
      this.noiseGain.gain.setValueAtTime(0.001, ctx.currentTime);
      this.noiseGain.gain.linearRampToValueAtTime(0.004, ctx.currentTime + 2.0);

      whiteNoise.connect(lowpass);
      lowpass.connect(this.noiseGain);
      this.noiseGain.connect(ctx.destination);
      whiteNoise.start();
    } catch (e) {
      console.warn("Failed to generate custom audio buffer source noise:", e);
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
    this.oscillators.forEach((osc) => {
      try {
        osc.node.stop();
        osc.node.disconnect();
      } catch (e) {}
    });
    this.oscillators = [];

    if (this.noiseGain) {
      this.noiseGain.disconnect();
      this.noiseGain = null;
    }

    Object.values(this.ambientSounds).forEach((howl) => {
      if (howl) howl.stop();
    });
  }
}
