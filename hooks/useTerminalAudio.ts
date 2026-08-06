"use client";

import { useRef, useCallback } from "react";
import { Howl } from "howler";

const AUDIO_PATHS = {
  key1: "/audio/terminal/key_01.mp3",
  key2: "/audio/terminal/key_02.mp3",
  key3: "/audio/terminal/key_03.mp3",
  enter: "/audio/terminal/enter_thud.mp3",
  bell: "/audio/terminal/bell_soft.mp3",
  scroll: "/audio/terminal/scroll_rustle.mp3",
};

export function useTerminalAudio() {
  const soundsRef = useRef<{
    keys: Howl[];
    enter: Howl;
    bell: Howl;
    scroll: Howl;
  } | null>(null);

  if (!soundsRef.current) {
    soundsRef.current = {
      keys: [
        new Howl({ src: [AUDIO_PATHS.key1], volume: 0.15 }),
        new Howl({ src: [AUDIO_PATHS.key2], volume: 0.12 }),
        new Howl({ src: [AUDIO_PATHS.key3], volume: 0.14 }),
      ],
      enter: new Howl({ src: [AUDIO_PATHS.enter], volume: 0.25 }),
      bell: new Howl({ src: [AUDIO_PATHS.bell], volume: 0.2 }),
      scroll: new Howl({ src: [AUDIO_PATHS.scroll], volume: 0.08 }),
    };
  }

  const playKey = useCallback(() => {
    const keys = soundsRef.current?.keys;
    if (!keys) return;
    const idx = Math.floor(Math.random() * keys.length);
    keys[idx]?.rate(0.95 + Math.random() * 0.1);
    keys[idx]?.play();
  }, []);

  const playEnter = useCallback(() => {
    soundsRef.current?.enter.play();
  }, []);

  const playBell = useCallback(() => {
    soundsRef.current?.bell.play();
  }, []);

  const playScroll = useCallback(() => {
    soundsRef.current?.scroll.play();
  }, []);

  return { playKey, playEnter, playBell, playScroll };
}