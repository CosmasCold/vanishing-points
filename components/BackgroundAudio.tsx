"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type AudioLayer = "ambient" | "haunted" | "danger";

export default function BackgroundAudio() {
  const ambientRef = useRef<HTMLAudioElement | null>(null);
  const hauntedRef = useRef<HTMLAudioElement | null>(null);
  const dangerRef = useRef<HTMLAudioElement | null>(null);
  const [active, setActive] = useState<AudioLayer>("ambient");
  const [enabled, setEnabled] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const unlock = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        setEnabled(true);
        [ambientRef, hauntedRef, dangerRef].forEach((ref) => {
          ref.current?.play().catch(() => {});
        });
      }
    };
    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [hasInteracted]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        category: string;
        dangerLevel: number;
      };
      if (!enabled) return;

      if (detail.dangerLevel >= 4) setActive("danger");
      else if (detail.category === "haunted" || detail.category === "both")
        setActive("haunted");
      else setActive("ambient");
    };

    window.addEventListener("placeaudiochange", handler);
    return () => window.removeEventListener("placeaudiochange", handler);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const fade = (el: HTMLAudioElement | null, target: number) => {
      if (!el) return;
      const step = 0.03;
      const interval = setInterval(() => {
        if (Math.abs(el.volume - target) < step) {
          el.volume = target;
          clearInterval(interval);
        } else if (el.volume < target) {
          el.volume = Math.min(0.4, el.volume + step);
        } else {
          el.volume = Math.max(0, el.volume - step);
        }
      }, 60);
      return () => clearInterval(interval);
    };

    const c1 = fade(ambientRef.current, active === "ambient" ? 0.25 : 0);
    const c2 = fade(hauntedRef.current, active === "haunted" ? 0.25 : 0);
    const c3 = fade(dangerRef.current, active === "danger" ? 0.25 : 0);

    return () => {
      c1?.();
      c2?.();
      c3?.();
    };
  }, [active, enabled]);

  const toggleMute = useCallback(() => {
    setEnabled((e) => !e);
    [ambientRef, hauntedRef, dangerRef].forEach((ref) => {
      if (ref.current) ref.current.muted = !ref.current.muted;
    });
  }, []);

  return (
    <>
      <div className="sr-only">
        <audio
          ref={ambientRef}
          src="/audio/ambient.mp3"
          loop
          preload="auto"
          muted={!enabled}
        />
        <audio
          ref={hauntedRef}
          src="/audio/haunted.mp3"
          loop
          preload="auto"
          muted={!enabled}
        />
        <audio
          ref={dangerRef}
          src="/audio/danger.mp3"
          loop
          preload="auto"
          muted={!enabled}
        />
      </div>

      <button
        onClick={toggleMute}
        className="fixed bottom-16 right-6 z-[9999] flex items-center gap-2 px-3 py-2 bg-[#252018]/80 backdrop-blur-sm border border-[rgba(122,107,82,0.2)] rounded-lg text-[10px] font-mono uppercase tracking-wider text-[#7a6e5e] hover:text-[#c4b8a4] hover:border-[rgba(122,107,82,0.4)] transition-all shadow-lg"
        title={enabled ? "Mute atmosphere" : "Unmute atmosphere"}
      >
        <span className="text-sm leading-none">{enabled ? "🔊" : "🔇"}</span>
        <span className="hidden sm:inline">{enabled ? "Sound On" : "Muted"}</span>
      </button>
    </>
  );
}