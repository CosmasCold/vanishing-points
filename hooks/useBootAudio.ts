import { useEffect, useRef, useCallback } from 'react';
import { Howl, Howler } from 'howler';

interface BootAudioState {
  powerClick: Howl | null;
  crtWarmup: Howl | null;
  relayClick: Howl | null;
  roomTone: Howl | null;
  rain: Howl | null;
}

export function useBootAudio() {
  const audioRef = useRef<BootAudioState>({
    powerClick: null,
    crtWarmup: null,
    relayClick: null,
    roomTone: null,
    rain: null,
  });

  // Initialize all sounds
  useEffect(() => {
    const state = audioRef.current;

    state.powerClick = new Howl({
      src: ['/audio/boot/power_click.mp3'],
      volume: 0.9,
      preload: true,
    });

    state.crtWarmup = new Howl({
      src: ['/audio/boot/crt_warmup.wav'],
      volume: 0,
      loop: true,
      preload: true,
    });

    state.relayClick = new Howl({
      src: ['/audio/boot/relay_click.wav'],
      volume: 0.6,
      preload: true,
    });

    state.roomTone = new Howl({
      src: ['/audio/boot/room_tone.mp3'],
      volume: 0.15,
      loop: true,
      preload: true,
    });

    state.rain = new Howl({
      src: ['/audio/boot/rain.mp3'],
      volume: 0.25,
      loop: true,
      preload: true,
    });

    // Start ambient layers immediately (very quiet)
    state.roomTone.play();
    state.rain.play();

    return () => {
      Object.values(state).forEach((sound) => {
        if (sound) {
          sound.stop();
          sound.unload();
        }
      });
    };
  }, []);

  // Trigger power click
  const playPowerClick = useCallback(() => {
    audioRef.current.powerClick?.play();
  }, []);

  // Start CRT warmup with fade-in
  const startCrtWarmup = useCallback(() => {
    const crt = audioRef.current.crtWarmup;
    if (!crt) return;
    crt.play();
    // Fade from 0 to 0.4 over 3 seconds
    let vol = 0;
    const fadeInterval = setInterval(() => {
      vol += 0.01;
      if (vol >= 0.4) {
        vol = 0.4;
        clearInterval(fadeInterval);
      }
      crt.volume(vol);
    }, 75);
  }, []);

  // Trigger relay click with slight random pitch variation
  const playRelayClick = useCallback(() => {
    const relay = audioRef.current.relayClick;
    if (!relay) return;
    // Random rate between 0.95 and 1.05 for variety
    const rate = 0.95 + Math.random() * 0.1;
    relay.rate(rate);
    relay.play();
  }, []);

  // Fade out all audio (for exit)
  const fadeOutAll = useCallback(() => {
    const state = audioRef.current;
    Object.values(state).forEach((sound) => {
      if (sound) {
        sound.fade(sound.volume(), 0, 2000);
        setTimeout(() => sound.stop(), 2100);
      }
    });
  }, []);

  return {
    playPowerClick,
    startCrtWarmup,
    playRelayClick,
    fadeOutAll,
  };
}