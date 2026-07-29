"use client";

import { useState, useEffect, useCallback } from "react";

const DUST_KEY = "vp-dust-accumulation";
const ECHOES_KEY = "echoes-visited";

interface DustState {
  level: number;        // 0–100
  echoesVisited: boolean;
  isCorrupted: boolean; // level > 40
  isSevere: boolean;    // level > 75
}

export function useDustLevel(): DustState {
  const [level, setLevel] = useState(0);
  const [echoesVisited, setEchoesVisited] = useState(false);

  useEffect(() => {
    const d = parseInt(localStorage.getItem(DUST_KEY) || "0", 10);
    const e = localStorage.getItem(ECHOES_KEY) === "true";
    setLevel(Math.min(100, d));
    setEchoesVisited(e);
  }, []);

  const accumulate = useCallback((amount: number = 2) => {
    setLevel((prev) => {
      const next = Math.min(100, prev + amount);
      localStorage.setItem(DUST_KEY, next.toString());
      return next;
    });
  }, []);

  return {
    level,
    echoesVisited,
    isCorrupted: level > 40,
    isSevere: level > 75,
  };
}

export function markEchoesVisited() {
  if (typeof window !== "undefined") {
    localStorage.setItem(ECHOES_KEY, "true");
  }
}

export function accumulateDust(amount: number = 2) {
  if (typeof window === "undefined") return;
  const current = parseInt(localStorage.getItem(DUST_KEY) || "0", 10);
  localStorage.setItem(DUST_KEY, Math.min(100, current + amount).toString());
}