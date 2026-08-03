"use client";

import { useEffect, useRef } from "react";
import { initAudio, startAmbient, playPlaceResonance, playUIClick, playUIHover, playStaticBurst, playKeystroke, playOtherInterference } from "@/lib/audio";

export default function AudioEngine() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    
    const handleFirstInteraction = () => {
      if (initialized.current) return;
      initialized.current = true;
      initAudio();
      
      // Start ambient based on current state
      const dust = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
      const corruption = parseInt(localStorage.getItem("vp-corruption-stage") || "0", 10);
      const hour = new Date().getHours();
      const tod = hour >= 6 && hour < 18 ? "day" : hour >= 18 && hour < 20 ? "dusk" : "night";
      
      startAmbient(dust, corruption, tod);
    };

    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("keydown", handleFirstInteraction, { once: true });

    // Listen for place resonance
    const handlePlaceAudio = (e: any) => {
      if (!initialized.current) return;
      playPlaceResonance(e.detail?.category || "abandoned", e.detail?.atmosphere || 1);
    };

    // Listen for UI events
    const handleUIClick = () => { if (initialized.current) playUIClick(); };
    const handleUIHover = () => { if (initialized.current) playUIHover(); };
    const handleStatic = (e: any) => { if (initialized.current) playStaticBurst(e.detail?.duration, e.detail?.intensity); };
    const handleKeystroke = () => { if (initialized.current) playKeystroke(); };
    const handleOther = () => { if (initialized.current) playOtherInterference(); };

    window.addEventListener("placeaudiochange", handlePlaceAudio);
    window.addEventListener("vp-ui-click", handleUIClick);
    window.addEventListener("vp-ui-hover", handleUIHover);
    window.addEventListener("vp-static", handleStatic);
    window.addEventListener("vp-keystroke", handleKeystroke);
    window.addEventListener("vp-other-interference", handleOther);

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("placeaudiochange", handlePlaceAudio);
      window.removeEventListener("vp-ui-click", handleUIClick);
      window.removeEventListener("vp-ui-hover", handleUIHover);
      window.removeEventListener("vp-static", handleStatic);
      window.removeEventListener("vp-keystroke", handleKeystroke);
      window.removeEventListener("vp-other-interference", handleOther);
    };
  }, []);

  return null; // Invisible component
}