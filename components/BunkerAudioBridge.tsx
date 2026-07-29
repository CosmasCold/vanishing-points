"use client";

import { useEffect, useRef } from "react";

export default function BunkerAudioBridge() {
  const staticRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const { message } = (e as CustomEvent).detail;
      if (!staticRef.current) return;

      // Brief static burst
      staticRef.current.volume = 0;
      staticRef.current.currentTime = 0;
      staticRef.current.play().catch(() => {});
      
      // Ramp up then down
      let vol = 0;
      const ramp = setInterval(() => {
        vol += 0.05;
        if (staticRef.current) staticRef.current.volume = Math.min(0.3, vol);
        if (vol >= 0.3) {
          clearInterval(ramp);
          setTimeout(() => {
            const fade = setInterval(() => {
              vol -= 0.02;
              if (staticRef.current) staticRef.current.volume = Math.max(0, vol);
              if (vol <= 0) clearInterval(fade);
            }, 100);
          }, 1500);
        }
      }, 60);
    };

    window.addEventListener("bunker-transmission", handler);
    return () => window.removeEventListener("bunker-transmission", handler);
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