"use client";

import { useEffect, useRef, useState } from "react";

type AudioLayer = "ambient" | "haunted" | "danger";

export default function BackgroundAudio() {
  const ambientRef = useRef<HTMLAudioElement | null>(null);
  const hauntedRef = useRef<HTMLAudioElement | null>(null);
  const dangerRef = useRef<HTMLAudioElement | null>(null);
  const [active, setActive] = useState<AudioLayer>("ambient");

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        category: string;
        dangerLevel: number;
      };
      if (detail.dangerLevel >= 4) setActive("danger");
      else if (detail.category === "haunted" || detail.category === "both")
        setActive("haunted");
      else setActive("ambient");
    };

    window.addEventListener("placeaudiochange", handler);
    return () => window.removeEventListener("placeaudiochange", handler);
  }, []);

  // Crossfade volumes
  useEffect(() => {
    const fade = (el: HTMLAudioElement | null, target: number) => {
      if (!el) return;
      const step = 0.04;
      const interval = setInterval(() => {
        if (Math.abs(el.volume - target) < step) {
          el.volume = target;
          clearInterval(interval);
        } else if (el.volume < target) {
          el.volume = Math.min(1, el.volume + step);
        } else {
          el.volume = Math.max(0, el.volume - step);
        }
      }, 80);
      return () => clearInterval(interval);
    };

    const c1 = fade(ambientRef.current, active === "ambient" ? 0.35 : 0);
    const c2 = fade(hauntedRef.current, active === "haunted" ? 0.35 : 0);
    const c3 = fade(dangerRef.current, active === "danger" ? 0.35 : 0);

    return () => {
      c1?.();
      c2?.();
      c3?.();
    };
  }, [active]);

  return (
    <div className="sr-only">
      <audio
        ref={ambientRef}
        src="/audio/ambient.mp3"
        loop
        autoPlay
        preload="auto"
      />
      <audio
        ref={hauntedRef}
        src="/audio/haunted.mp3"
        loop
        autoPlay
        preload="auto"
      />
      <audio
        ref={dangerRef}
        src="/audio/danger.mp3"
        loop
        autoPlay
        preload="auto"
      />
    </div>
  );
}