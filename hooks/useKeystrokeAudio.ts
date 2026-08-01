"use client";

import { useCallback, useRef } from "react";

export function useKeystrokeAudio() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = () => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return ctxRef.current;
  };

  const playClick = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  }, []);

  const playWrong = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    try {
      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(50 + Math.random() * 30, ctx.currentTime);
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.05, ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      noise.connect(gain);
      gain.connect(ctx.destination);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      noise.start();
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }, []);

  const onType = useCallback(() => {
    if (Math.random() < 0.03) {
      playWrong();
    } else {
      playClick();
    }
  }, [playClick, playWrong]);

  return { onType };
}