"use client";

import { useEffect } from "react";

const GHOST_LINES = [
  "the dust settles in patterns...",
  "did you hear that?",
  "03:14...",
  "someone else is using this terminal.",
  "the atlas updates itself.",
  "i can see when you will return.",
  "don't trust the static.",
];

export function useTerminalGhost(onGhost: (line: string) => void) {
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.25) {
        const line = GHOST_LINES[Math.floor(Math.random() * GHOST_LINES.length)];
        onGhost(line);
      }
    }, 25000);
    return () => clearInterval(interval);
  }, [onGhost]);
}