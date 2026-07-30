"use client";

import { useEffect, useRef } from "react";
import { useDustLevel } from "@/hooks/useDustLevel";

const WHISPERS = [
  "Don't go inside.",
  "The floor remembers footsteps.",
  "I was here. I shouldn't have been.",
  "Check your reflection before leaving.",
  "The dust carries your name now.",
  "Someone is typing from the next room.",
  "The coordinates are wrong by three degrees.",
  "It sees you reading this.",
  "Don't trust the nearest ruin.",
  "The silence has weight.",
];

export default function PlaceWhispers() {
  const { level } = useDustLevel();
  const lastSpoke = useRef(0);

  useEffect(() => {
    if (level < 60) return;

    const handler = () => {
      const now = Date.now();
      if (now - lastSpoke.current < 8000) return; // 8s cooldown
      lastSpoke.current = now;

      const text = WHISPERS[Math.floor(Math.random() * WHISPERS.length)];
      const utter = new SpeechSynthesisUtterance(text);
      utter.pitch = 0.4;
      utter.rate = 0.6;
      utter.volume = 0.15;
      utter.lang = "en-US";

      const voices = window.speechSynthesis.getVoices();
      const whisperVoice = voices.find((v) => v.name.includes("Whisper") || v.name.includes("Dark") || v.name.includes("Zira"));
      if (whisperVoice) utter.voice = whisperVoice;

      window.speechSynthesis.speak(utter);
    };

    window.addEventListener("place-selected", handler);
    return () => window.removeEventListener("place-selected", handler);
  }, [level]);

  return null;
}