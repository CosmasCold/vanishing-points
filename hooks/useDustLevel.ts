"use client";

import { useState, useEffect, useCallback } from "react";

const DUST_KEY = "vp-dust-accumulation";
const CORRUPTION_KEY = "vp-corruption-stage";
const ECHOES_KEY = "echoes-visited";
const LAST_TX_KEY = "vp-last-transmission";

interface DustState {
  level: number;
  echoesVisited: boolean;
  isCorrupted: boolean;
  isSevere: boolean;
  corruptionStage: number;
}

export function useDustLevel(): DustState {
  const [level, setLevel] = useState(0);
  const [echoesVisited, setEchoesVisited] = useState(false);
  const [corruptionStage, setCorruptionStage] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const d = parseInt(localStorage.getItem(DUST_KEY) || "0", 10);
    const e = localStorage.getItem(ECHOES_KEY) === "true";
    const c = parseInt(localStorage.getItem(CORRUPTION_KEY) || "0", 10);
    setLevel(Math.min(100, d));
    setEchoesVisited(e);
    setCorruptionStage(c);
  }, []);

  return {
    level,
    echoesVisited,
    isCorrupted: level > 40,
    isSevere: level > 75,
    corruptionStage,
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

/** Spend dust. Returns true if successful, false if insufficient. */
export function spendDust(amount: number): boolean {
  if (typeof window === "undefined") return false;
  const current = parseInt(localStorage.getItem(DUST_KEY) || "0", 10);
  if (current < amount) return false;
  localStorage.setItem(DUST_KEY, String(Math.max(0, current - amount)));
  return true;
}

/** Call when an expedition triggers corruption or a decode fails critically */
export function bumpCorruption(amount: number = 1) {
  if (typeof window === "undefined") return;
  const current = parseInt(localStorage.getItem(CORRUPTION_KEY) || "0", 10);
  localStorage.setItem(CORRUPTION_KEY, String(Math.min(10, current + amount)));
}

/** Call when a signal is successfully locked/decoded */
export function markTransmission() {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_TX_KEY, Date.now().toString());
}

/** Dust decays slowly when the player seals places or stays away */
export function decayDust(amount: number = 5) {
  if (typeof window === "undefined") return;
  const current = parseInt(localStorage.getItem(DUST_KEY) || "0", 10);
  localStorage.setItem(DUST_KEY, String(Math.max(0, current - amount)));
}

/** Reset dust and corruption to 0. Used by `purge` terminal command. */
export function purgeDust(): { dustReset: boolean; corruptionReset: boolean } {
  if (typeof window === "undefined") return { dustReset: false, corruptionReset: false };
  localStorage.setItem(DUST_KEY, "0");
  localStorage.setItem(CORRUPTION_KEY, "0");
  return { dustReset: true, corruptionReset: true };
}