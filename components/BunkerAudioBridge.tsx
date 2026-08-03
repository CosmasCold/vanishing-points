"use client";

import { useEffect, useRef } from "react";

export default function BunkerAudioBridge() {
  const staticRef = useRef<HTMLAudioElement | null>(null);
  const rampRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const { message } = (e as CustomEvent).detail;
      if (!staticRef.current) return;

      // Clear any lingering intervals from previous burst
      if (rampRef.current) clearInterval(rampRef.current);
      if (fadeRef.current) clearInterval(fadeRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      // Brief static burst
      staticRef.current.volume = 0;
      staticRef.current.currentTime = 0;
      staticRef.current.play().catch(() => {});

      // Ramp up then down
      let vol = 0;
      rampRef.current = setInterval(() => {
        vol += 0.05;
        if (staticRef.current) staticRef.current.volume = Math.min(0.3, vol);
        if (vol >= 0.3) {
          if (rampRef.current) clearInterval(rampRef.current);
          timeoutRef.current = setTimeout(() => {
            fadeRef.current = setInterval(() => {
              vol -= 0.02;
              if (staticRef.current) staticRef.current.volume = Math.max(0, vol);
              if (vol <= 0 && fadeRef.current) clearInterval(fadeRef.current);
            }, 100);
          }, 1500);
        }
      }, 60);
    };

    window.addEventListener("vp-bunker-transmission", handler);
    return () => {
      window.removeEventListener("vp-bunker-transmission", handler);
      if (rampRef.current) clearInterval(rampRef.current);
      if (fadeRef.current) clearInterval(fadeRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <audio
      ref={staticRef}
      src="/audio/static_burst.mp3"
      preload="auto"
      className="sr-only"
    />
  );
}