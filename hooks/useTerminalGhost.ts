"use client";

import { useEffect, useRef } from "react";

const GHOST_LINES = [
  "are you still there?",
  "i thought i heard breathing through the channel.",
  "the static gets loud when it's just me.",
  "i typed something and deleted it. you didn't need to see that.",
  "the terminal hums when you're not typing. i think it misses you.",
  "check your reflection. i'll wait.",
  "03:14 again. always 03:14.",
  "sometimes i write messages and send them nowhere. just to watch them disappear.",
  "the dust settled on the keys. i wiped it off. it came back.",
  "i'm going to stop typing now and see if you say something.",
];

export function useTerminalGhost(onGhost: (line: string) => void) {
  const timer = useRef<NodeJS.Timeout | null>(null);
  const idle = useRef(false);

  useEffect(() => {
    const reset = () => {
      idle.current = false;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        idle.current = true;
        const line = GHOST_LINES[Math.floor(Math.random() * GHOST_LINES.length)];
        onGhost(line);
      }, 20000); // 20 seconds idle
    };

    window.addEventListener("keydown", reset);
    window.addEventListener("click", reset);
    window.addEventListener("mousemove", reset);

    timer.current = setTimeout(() => {
      idle.current = true;
      const line = GHOST_LINES[Math.floor(Math.random() * GHOST_LINES.length)];
      onGhost(line);
    }, 20000);

    return () => {
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener("keydown", reset);
      window.removeEventListener("click", reset);
      window.removeEventListener("mousemove", reset);
    };
  }, [onGhost]);
}