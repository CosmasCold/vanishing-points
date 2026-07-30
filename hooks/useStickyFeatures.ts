"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── CORRUPTION STAGES ───
export function useCorruptionStage() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const check = () => {
      const dust = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
      const echoes = localStorage.getItem("echoes-visited") === "true";
      const visits = JSON.parse(localStorage.getItem("vp-expedition-log") || "[]").length;

      if (dust > 200 && echoes) setStage(4);      // GHOST
      else if (dust > 100 && echoes) setStage(3); // WITNESS
      else if (dust > 50) setStage(2);            // ARCHIVIST
      else if (dust > 20) setStage(1);            // SENSITIVE
      else setStage(0);                            // OBSERVER
    };
    check();
    window.addEventListener("dust-updated", check);
    return () => window.removeEventListener("dust-updated", check);
  }, []);

  const labels = ["OBSERVER", "SENSITIVE", "ARCHIVIST", "WITNESS", "GHOST"];
  const colors = ["#8a7a6a", "#9a8a72", "#a67c52", "#c4a882", "#e8d5c0"];

  return {
    stage,
    label: labels[stage],
    color: colors[stage],
  };
}

// ─── IDLE GHOST ───
export function useIdleGhost(onGhost: (line: string) => void) {
  const idleRef = useRef<NodeJS.Timeout | null>(null);
  const [idleCount, setIdleCount] = useState(0);

  const GHOST_LINES = [
    "the dust settles in patterns...",
    "did you hear that?",
    "03:14...",
    "someone else is using this terminal.",
    "the atlas updates itself.",
    "i can see when you will return.",
    "don't trust the static.",
    "are you still there?",
    "the door is warm.",
    "i'll wait.",
  ];

  useEffect(() => {
    const reset = () => {
      if (idleRef.current) clearTimeout(idleRef.current);
      document.title = "BUNKER_7 TERMINAL";
      idleRef.current = setTimeout(() => {
        const line = GHOST_LINES[Math.floor(Math.random() * GHOST_LINES.length)];
        onGhost(line);
        setIdleCount((c) => c + 1);
        document.title = "BUNKER_7 is waiting...";
      }, 30000);
    };

    window.addEventListener("keydown", reset);
    window.addEventListener("mousemove", reset);
    reset();

    return () => {
      window.removeEventListener("keydown", reset);
      window.removeEventListener("mousemove", reset);
      if (idleRef.current) clearTimeout(idleRef.current);
    };
  }, [onGhost]);

  return idleCount;
}

// ─── 03:14 EVENT ───
export function useThreeFourteen() {
  const [is314, setIs314] = useState(false);

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const active = now.getHours() === 3 && now.getMinutes() === 14;
      setIs314(active);
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return is314;
}