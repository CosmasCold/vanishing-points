"use client";

import { useState, useEffect } from "react";

interface Props {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

const GHOST_FRAGMENTS = [
  " The dust remembers.",
  " Do not trust the coordinates.",
  " You are not alone in this archive.",
  " Listen to the static.",
];

export default function GhostTypewriter({ text, speed = 12, onComplete }: Props) {
  const [display, setDisplay] = useState("");
  const [ghost, setGhost] = useState("");

  useEffect(() => {
    let i = 0;
    let current = "";
    let insertedGhost = false;

    const interval = setInterval(() => {
      if (i < text.length) {
        current += text[i];
        setDisplay(current);
        i++;

        // 3% chance to inject ghost text mid-stream, once only
        if (!insertedGhost && i > text.length * 0.6 && Math.random() < 0.03) {
          insertedGhost = true;
          const fragment = GHOST_FRAGMENTS[Math.floor(Math.random() * GHOST_FRAGMENTS.length)];
          setGhost(fragment);
          setTimeout(() => setGhost(""), 2500);
        }
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <span>
      {display}
      {ghost && <span className="text-[#7a3a2a]/70 italic">{ghost}</span>}
    </span>
  );
}