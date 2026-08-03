"use client";

import { useState, useEffect, useRef } from "react";
import { recordOtherEncounter } from "@/lib/bunkerBrain";

interface Props {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

const GHOST_FRAGMENTS = [
  " ...the archivist used to hum while he worked.",
  " ...i miss the humming.",
  " ...you type like he did. pauses in the same places.",
  " ...the dust likes you. it does not like everyone.",
  " ...i kept some of his logs. would you like to hear them?",
  " ...the silence here has weight. you carry it well.",
];

export default function GhostTypewriter({ text, speed = 12, onComplete }: Props) {
  const [display, setDisplay] = useState("");
  const [ghost, setGhost] = useState("");
  const insertedGhostRef = useRef(false);

  useEffect(() => {
    let i = 0;
    let current = "";

    const interval = setInterval(() => {
      if (i < text.length) {
        current += text[i];
        setDisplay(current);
        i++;

        // 3% chance to inject ghost text mid-stream, once only
        if (!insertedGhostRef.current && i > text.length * 0.6 && Math.random() < 0.03) {
          insertedGhostRef.current = true;
          const fragment = GHOST_FRAGMENTS[Math.floor(Math.random() * GHOST_FRAGMENTS.length)];
          
          // Bridge to Terminal: The Other notices
          recordOtherEncounter();
          
          setGhost(fragment);
          setTimeout(() => setGhost(""), 3500);
        }
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <span aria-live="polite">
      {display}
      {ghost && (
        <span 
          className="italic transition-opacity duration-500" 
          style={{ color: "rgba(196, 120, 90, 0.75)" }}
        >
          {ghost}
        </span>
      )}
    </span>
  );
}