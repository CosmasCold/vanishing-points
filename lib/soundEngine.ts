"use client";

import { Howl, Howler } from "howler";

/* ── AUDIO MANIFEST ── */
const SOUNDS = {
  ambience: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
  drone: "https://cdn.pixabay.com/download/audio/2022/03/24/audio_c8c90c59c7.mp3",
  key1: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8c734b2.mp3",
  key2: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8c734b2.mp3",
  key3: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8c734b2.mp3",
  boot: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3",
  static: "https://cdn.pixabay.com/download/audio/2021/08/09/audio_88447e769f.mp3",
  glitch: "https://cdn.pixabay.com/download/audio/2021/08/09/audio_88447e769f.mp3",
  creak: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3",
  whispers: "https://cdn.pixabay.com/download/audio/2021/11/25/audio_cb0b7c6a4c.mp3",
} as const;

type SoundKey = keyof typeof SOUNDS;

class SoundEngine {
  private pool: Map<SoundKey, Howl> = new Map();
  private ambienceId?: number;
  private droneId?: number;
  private isMuted = false;
  private masterVolume = 0.7;

  constructor() {
    this.load("boot", { volume: 0.5 });
    this.load("static", { volume: 0.15, loop: false });
    this.load("glitch", { volume: 0.2 });
    this.load("creak", { volume: 0.08 });
  }

  private load(key: SoundKey, opts: { volume?: number; loop?: boolean } = {}) {
    const howl = new Howl({
      src: [SOUNDS[key]],
      volume: opts.volume ?? 0.5,
      loop: opts.loop ?? false,
      preload: true,
      html5: true,
    });
    this.pool.set(key, howl);
    return howl;
  }

  private get(key: SoundKey): Howl {
    if (!this.pool.has(key)) {
      this.load(key);
    }
    return this.pool.get(key)!;
  }

  /* ── AMBIENCE ── */
  startAmbience() {
    if (this.ambienceId !== undefined) return;
    const ambience = this.get("ambience") as Howl;
    ambience.fade(0, 0.15, 4000);
    this.ambienceId = ambience.play();
    ambience.loop(true, this.ambienceId);

    setTimeout(() => {
      const drone = this.get("drone") as Howl;
      drone.fade(0, 0.08, 6000);
      this.droneId = drone.play();
      drone.loop(true, this.droneId);
    }, 2000);
  }

  stopAmbience() {
    if (this.ambienceId !== undefined) {
      const ambience = this.get("ambience") as Howl;
      ambience.fade(0.15, 0, 3000);
      setTimeout(() => {
        const a = this.get("ambience") as Howl;
        a.stop();
        this.ambienceId = undefined;
      }, 3000);
    }
    if (this.droneId !== undefined) {
      const drone = this.get("drone") as Howl;
      drone.fade(0.08, 0, 4000);
      setTimeout(() => {
        const d = this.get("drone") as Howl;
        d.stop();
        this.droneId = undefined;
      }, 4000);
    }
  }

  /* ── TYPING ── */
  playKeypress() {
    const keys: SoundKey[] = ["key1", "key2", "key3"];
    const key = keys[Math.floor(Math.random() * keys.length)];
    const howl = this.get(key) as Howl;
    howl.volume(0.04 + Math.random() * 0.03);
    howl.rate(0.9 + Math.random() * 0.2);
    howl.play();
  }

  /* ── EVENTS ── */
  playBoot() {
    const h = this.get("boot") as Howl;
    h.volume(0.4);
    h.play();
  }

  playStatic(duration = 800) {
    const s = this.get("static") as Howl;
    const id = s.play();
    s.fade(0.1, 0, duration, id);
    setTimeout(() => s.stop(id), duration + 100);
  }

  playGlitch() {
    const g = this.get("glitch") as Howl;
    g.volume(0.15);
    g.rate(1.5 + Math.random());
    g.play();
  }

  playCreak() {
    if (Math.random() > 0.3) return;
    const c = this.get("creak") as Howl;
    c.volume(0.06);
    c.rate(0.7 + Math.random() * 0.4);
    c.play();
  }

  /* ── CORRUPTION LAYER ── */
  triggerCorruptionBurst(intensity: number) {
    const s = this.get("static") as Howl;
    const id = s.play();
    s.volume(intensity * 0.3, id);
    s.rate(0.5 + Math.random(), id);
    s.fade(intensity * 0.3, 0, 2000, id);
    setTimeout(() => s.stop(id), 2200);
  }

  /* ── GLOBAL ── */
  setMasterVolume(v: number) {
    this.masterVolume = v;
    Howler.volume(v);
  }

  mute() {
    this.isMuted = true;
    Howler.mute(true);
  }

  unmute() {
    this.isMuted = false;
    Howler.mute(false);
  }

  toggleMute() {
    this.isMuted ? this.unmute() : this.mute();
    return this.isMuted;
  }
}

export const soundEngine = new SoundEngine();